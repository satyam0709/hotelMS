const fs = require("node:fs");
const path = require("node:path");
const { Prisma } = require("@prisma/client");
const prisma = require("../src/prisma/client");

const initialMigrationPath = path.join(__dirname, "../prisma/migrations/20261006122712_init/migration.sql");
const repairMigrationPath = path.join(__dirname, "../prisma/migrations/20261007190000_restore_missing_foreign_keys/migration.sql");
const migrationName = "20261007190000_restore_missing_foreign_keys";
const foreignKeyPattern = /ALTER TABLE `([^`]+)` ADD CONSTRAINT `([^`]+)` FOREIGN KEY \(`([^`]+)`\) REFERENCES `([^`]+)`\(`([^`]+)`\) ON DELETE (SET NULL|RESTRICT|CASCADE|NO ACTION) ON UPDATE (SET NULL|RESTRICT|CASCADE|NO ACTION);/g;

function readExpectedForeignKeys(filePath) {
  const sql = fs.readFileSync(filePath, "utf8");
  return [...sql.matchAll(foreignKeyPattern)].map((match) => ({
    tableName: match[1],
    constraintName: match[2],
    columnName: match[3],
    referencedTableName: match[4],
    referencedColumnName: match[5],
    deleteRule: match[6],
    updateRule: match[7],
  }));
}

function normalize(value) {
  return value.toLowerCase();
}

function classifyExpectedForeignKey(expected, actualForeignKeys) {
  const sameColumn = actualForeignKeys.filter((actual) =>
    normalize(actual.tableName) === normalize(expected.tableName) &&
    normalize(actual.columnName) === normalize(expected.columnName)
  );
  const sameRelation = sameColumn.find((actual) =>
    normalize(actual.referencedTableName) === normalize(expected.referencedTableName) &&
    normalize(actual.referencedColumnName) === normalize(expected.referencedColumnName)
  );

  if (!sameRelation) {
    return {
      ...expected,
      classification: sameColumn.length ? "PRESENT BUT DIFFERENT" : "MISSING",
      actual: sameColumn,
    };
  }

  const exact =
    normalize(sameRelation.constraintName) === normalize(expected.constraintName) &&
    normalize(sameRelation.deleteRule) === normalize(expected.deleteRule) &&
    normalize(sameRelation.updateRule) === normalize(expected.updateRule);
  return {
    ...expected,
    classification: exact ? "PRESENT AND CORRECT" : "PRESENT BUT DIFFERENT",
    actual: sameRelation,
  };
}

async function main() {
  const expectedForeignKeys = readExpectedForeignKeys(initialMigrationPath);
  const currentRepairForeignKeys = readExpectedForeignKeys(repairMigrationPath);
  const affectedTables = [...new Set(expectedForeignKeys.map(({ tableName }) => tableName))];

  const [database, serverInfo, actualForeignKeys, rawIndexes, duplicateNames, migrationLedger] = await Promise.all([
    prisma.$queryRaw`SELECT DATABASE() AS databaseName`,
    prisma.$queryRaw`SELECT VERSION() AS serverVersion, @@version_comment AS versionComment, @@lower_case_table_names AS lowerCaseTableNames, @@FOREIGN_KEY_CHECKS AS foreignKeyChecks`,
    prisma.$queryRaw`
      SELECT
        k.TABLE_NAME AS tableName,
        k.CONSTRAINT_NAME AS constraintName,
        k.COLUMN_NAME AS columnName,
        k.REFERENCED_TABLE_NAME AS referencedTableName,
        k.REFERENCED_COLUMN_NAME AS referencedColumnName,
        k.ORDINAL_POSITION AS ordinalPosition,
        r.DELETE_RULE AS deleteRule,
        r.UPDATE_RULE AS updateRule
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE AS k
      LEFT JOIN INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS AS r
        ON r.CONSTRAINT_SCHEMA = k.CONSTRAINT_SCHEMA
        AND r.TABLE_NAME = k.TABLE_NAME
        AND r.CONSTRAINT_NAME = k.CONSTRAINT_NAME
      WHERE k.TABLE_SCHEMA = DATABASE()
        AND k.REFERENCED_TABLE_NAME IS NOT NULL
        AND k.TABLE_NAME IN (${Prisma.join(affectedTables)})
      ORDER BY k.TABLE_NAME, k.CONSTRAINT_NAME, k.ORDINAL_POSITION
    `,
    prisma.$queryRaw`
      SELECT TABLE_NAME AS tableName, INDEX_NAME AS indexName,
        NON_UNIQUE AS nonUnique, SEQ_IN_INDEX AS sequenceInIndex,
        COLUMN_NAME AS columnName
      FROM INFORMATION_SCHEMA.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME IN (${Prisma.join(affectedTables)})
      ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX
    `,
    prisma.$queryRaw`
      SELECT CONSTRAINT_NAME AS constraintName,
        COUNT(*) AS occurrenceCount,
        GROUP_CONCAT(TABLE_NAME ORDER BY TABLE_NAME) AS tableNames
      FROM INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS
      WHERE CONSTRAINT_SCHEMA = DATABASE()
      GROUP BY CONSTRAINT_NAME
      HAVING COUNT(*) > 1
      ORDER BY CONSTRAINT_NAME
    `,
    prisma.$queryRaw`
      SELECT id, migration_name AS migrationName, checksum,
        started_at AS startedAt, finished_at AS finishedAt,
        rolled_back_at AS rolledBackAt,
        applied_steps_count AS appliedStepsCount, logs
      FROM _prisma_migrations
      WHERE migration_name = ${migrationName}
      ORDER BY started_at
    `,
  ]);

  const comparison = expectedForeignKeys.map((expected) =>
    classifyExpectedForeignKey(expected, actualForeignKeys)
  );
  const indexesByTable = new Map();
  for (const index of rawIndexes) {
    const key = `${index.tableName}.${index.indexName}`;
    if (!indexesByTable.has(key)) {
      indexesByTable.set(key, {
        tableName: index.tableName,
        indexName: index.indexName,
        unique: Number(index.nonUnique) === 0,
        columns: [],
      });
    }
    indexesByTable.get(key).columns.push(index.columnName);
  }

  const statusCounts = Object.fromEntries(["PRESENT AND CORRECT", "PRESENT BUT DIFFERENT", "MISSING"].map((status) => [
    status,
    comparison.filter(({ classification }) => classification === status).length,
  ]));
  const relationLines = comparison.map((row) => {
    const expected = `${row.tableName}.${row.columnName} -> ${row.referencedTableName}.${row.referencedColumnName}`;
    const actual = Array.isArray(row.actual)
      ? row.actual.map((entry) => `${entry.constraintName}: ${entry.referencedTableName}.${entry.referencedColumnName}`).join(" | ")
      : row.actual
        ? `${row.actual.constraintName} -> ${row.actual.referencedTableName}.${row.actual.referencedColumnName} (${row.actual.deleteRule}/${row.actual.updateRule})`
        : "none";
    return `${row.classification}: ${expected}; expectedName=${row.constraintName}; actual=${actual}`;
  });
  const foreignKeyLines = actualForeignKeys.map((row) =>
    `${row.tableName}.${row.columnName} -> ${row.referencedTableName}.${row.referencedColumnName}; name=${row.constraintName}; actions=${row.deleteRule}/${row.updateRule}`
  );
  const indexLines = affectedTables.map((tableName) => {
    const indexes = [...indexesByTable.values()]
      .filter((row) => normalize(row.tableName) === normalize(tableName))
      .map((row) => `${row.indexName}[${row.columns.join(",")}]${row.unique ? " UNIQUE" : ""}`);
    return `${tableName}: ${indexes.join("; ")}`;
  });
  const ledgerLines = migrationLedger.map((row) =>
    `name=${row.migrationName}; started=${row.startedAt}; finished=${row.finishedAt}; rolledBack=${row.rolledBackAt}; steps=${row.appliedStepsCount}; logs=${String(row.logs || "").slice(0, 1200)}`
  );

  process.stdout.write([
    `DATABASE: ${database[0]?.databaseName}`,
    `SERVER: ${JSON.stringify(serverInfo[0], (_, value) => typeof value === "bigint" ? Number(value) : value)}`,
    `EXPECTED FK COUNT: ${expectedForeignKeys.length}`,
    `REPAIR FILE FK COUNT: ${currentRepairForeignKeys.length}`,
    `ACTUAL FK COLUMN COUNT: ${actualForeignKeys.length}`,
    `STATUS COUNTS: ${JSON.stringify(statusCounts)}`,
    "RELATION CLASSIFICATIONS:",
    ...relationLines,
    "ACTUAL FOREIGN KEYS:",
    ...foreignKeyLines,
    "ALL INDEXES BY TABLE:",
    ...indexLines,
    "DUPLICATE FK CONSTRAINT NAMES:",
    ...duplicateNames.map((row) => `${row.constraintName}; occurrences=${row.occurrenceCount}; tables=${row.tableNames}`),
    "MIGRATION LEDGER:",
    ...ledgerLines,
    "END METADATA AUDIT",
  ].join("\n") + "\n");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());