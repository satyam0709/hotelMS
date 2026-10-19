const PDFDocument = require("pdfkit");
const ExcelJS = require("exceljs");

/**
 * Format currency value with symbol or code
 */
function formatCurrency(amount, currency = "INR") {
  const num = Number(amount || 0).toFixed(2);
  return `${currency} ${num}`;
}

function formatDate(date) {
  if (!date) return "—";
  return new Date(date).toISOString().slice(0, 10);
}

/**
 * Streams a dataset to an Excel (.xlsx) file using ExcelJS.stream.xlsx.WorkbookWriter
 * Supports auto-column widths, header styling, and memory efficiency.
 */
async function streamExcelReport(res, { filename, sheetName = "Report", columns, rows }) {
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.setHeader("Cache-Control", "no-store");

  const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
    stream: res,
    useStyles: true,
    useSharedStrings: false,
  });

  const worksheet = workbook.addWorksheet(sheetName);

  worksheet.columns = columns.map((col) => ({
    header: col.header,
    key: col.key,
    width: col.width || 18,
  }));

  // Style header row
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1F2937" }, // slate-800
  };
  headerRow.commit();

  for (const row of rows) {
    const r = worksheet.addRow(row);
    r.commit();
  }

  worksheet.commit();
  await workbook.commit();
}

/**
 * Generates a clean A4 PDF report document and pipes it to response or resolves Buffer
 */
function createPdfReport(res, { title, subtitle, dateRange, columns, rows }) {
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${title.toLowerCase().replace(/[^a-z0-9]/g, "-")}.pdf"`);
  res.setHeader("Cache-Control", "no-store");

  const doc = new PDFDocument({ size: "A4", margin: 36 });
  doc.pipe(res);

  // Header
  doc.fontSize(18).font("Helvetica-Bold").text(title, { align: "left" });
  if (subtitle) {
    doc.fontSize(10).font("Helvetica").fillColor("#6B7280").text(subtitle, { align: "left" });
  }
  if (dateRange) {
    doc.fontSize(9).font("Helvetica").fillColor("#4B5563").text(`Period: ${dateRange}`, { align: "left" });
  }
  doc.moveDown(1);

  // Table setup
  const pageWidth = 595.28 - 72; // A4 width minus margins (36 on each side)
  const colWidth = pageWidth / columns.length;
  let y = doc.y;

  // Header Row
  doc.rect(36, y, pageWidth, 20).fill("#1F2937");
  doc.fillColor("#FFFFFF").fontSize(8).font("Helvetica-Bold");

  columns.forEach((col, i) => {
    doc.text(col.header.toUpperCase(), 36 + i * colWidth + 4, y + 6, {
      width: colWidth - 8,
      align: col.align || "left",
      ellipsis: true,
    });
  });

  y += 20;
  doc.fillColor("#111827").font("Helvetica").fontSize(8);

  // Rows
  rows.forEach((row, rowIndex) => {
    if (y > 780) {
      doc.addPage();
      y = 36;
      // Re-draw header on new page
      doc.rect(36, y, pageWidth, 20).fill("#1F2937");
      doc.fillColor("#FFFFFF").fontSize(8).font("Helvetica-Bold");
      columns.forEach((col, i) => {
        doc.text(col.header.toUpperCase(), 36 + i * colWidth + 4, y + 6, {
          width: colWidth - 8,
          align: col.align || "left",
          ellipsis: true,
        });
      });
      y += 20;
      doc.fillColor("#111827").font("Helvetica").fontSize(8);
    }

    if (rowIndex % 2 === 1) {
      doc.rect(36, y, pageWidth, 18).fill("#F9FAFB");
      doc.fillColor("#111827");
    }

    columns.forEach((col, i) => {
      const val = row[col.key] != null ? String(row[col.key]) : "";
      doc.text(val, 36 + i * colWidth + 4, y + 5, {
        width: colWidth - 8,
        align: col.align || "left",
        ellipsis: true,
      });
    });

    y += 18;
  });

  // Footer / Page numbers
  const pages = doc.bufferedPageRange();
  for (let i = 0; i < pages.count; i++) {
    doc.switchToPage(i);
    doc.fontSize(8).fillColor("#9CA3AF").text(
      `Generated on ${new Date().toISOString().slice(0, 10)} · Page ${i + 1} of ${pages.count}`,
      36,
      805,
      { align: "center", width: pageWidth }
    );
  }

  doc.end();
}

/**
 * Builds a professional A4 invoice PDF for a booking
 */
function buildInvoicePdfStream(res, invoice, brandName = "ExoStay Luxury Resort") {
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="Invoice-${invoice.bookingRef}.pdf"`);
  res.setHeader("Cache-Control", "no-store");

  const doc = new PDFDocument({ size: "A4", margin: 40 });
  doc.pipe(res);

  const amounts = invoice.amounts || {};
  const rooms = Array.isArray(invoice.rooms) ? invoice.rooms : [];
  const curr = invoice.currency || "INR";

  // Brand and Title
  doc.fontSize(22).font("Helvetica-Bold").fillColor("#111827").text("INVOICE", 40, 40);
  doc.fontSize(10).font("Helvetica-Bold").fillColor("#D97706").text(brandName.toUpperCase(), 40, 68);

  doc.fontSize(9).font("Helvetica").fillColor("#4B5563");
  doc.text(`Invoice No: ${invoice.invoiceNumber}`, 350, 40, { align: "right", width: 200 });
  doc.text(`Booking Ref: ${invoice.bookingRef}`, 350, 54, { align: "right", width: 200 });
  doc.text(`Issued Date: ${formatDate(invoice.issuedAt)}`, 350, 68, { align: "right", width: 200 });

  doc.strokeColor("#E5E7EB").lineWidth(1).moveTo(40, 90).lineTo(555, 90).stroke();

  // Guest & Stay details
  let y = 105;
  doc.rect(40, y, 245, 75).fill("#F9FAFB").stroke("#E5E7EB");
  doc.rect(310, y, 245, 75).fill("#F9FAFB").stroke("#E5E7EB");

  // Guest block
  doc.fillColor("#6B7280").fontSize(8).font("Helvetica-Bold").text("GUEST DETAILS", 50, y + 8);
  doc.fillColor("#111827").fontSize(10).font("Helvetica-Bold").text(invoice.guest?.fullName || "Guest", 50, y + 22);
  doc.fillColor("#4B5563").fontSize(8).font("Helvetica");
  doc.text(invoice.guest?.email || "", 50, y + 36);
  doc.text(invoice.guest?.phone || "", 50, y + 48);

  // Stay block
  doc.fillColor("#6B7280").fontSize(8).font("Helvetica-Bold").text("STAY DETAILS", 320, y + 8);
  doc.fillColor("#111827").fontSize(9).font("Helvetica-Bold").text(
    `${formatDate(invoice.stay?.checkIn)}  to  ${formatDate(invoice.stay?.checkOut)}`,
    320,
    y + 22
  );
  doc.fillColor("#4B5563").fontSize(8).font("Helvetica");
  doc.text(`${invoice.stay?.adults || 1} Adult(s), ${invoice.stay?.children || 0} Child(ren)`, 320, y + 36);
  doc.text(`Rooms: ${invoice.stay?.roomCount || 1} Room(s)`, 320, y + 48);

  // Line items
  y = 200;
  doc.rect(40, y, 515, 20).fill("#1F2937");
  doc.fillColor("#FFFFFF").fontSize(8).font("Helvetica-Bold");
  doc.text("ITEM / ROOM TYPE", 50, y + 6);
  doc.text("QTY", 320, y + 6, { align: "center", width: 40 });
  doc.text("AMOUNT", 430, y + 6, { align: "right", width: 115 });

  y += 20;
  doc.fillColor("#111827").font("Helvetica").fontSize(8);

  rooms.forEach((row, i) => {
    if (i % 2 === 1) {
      doc.rect(40, y, 515, 22).fill("#F9FAFB");
      doc.fillColor("#111827");
    }
    const rName = row.room?.name || "Room";
    doc.text(rName, 50, y + 7, { width: 250 });
    doc.text(String(row.quantity), 320, y + 7, { align: "center", width: 40 });
    doc.text(formatCurrency(row.totalAmount, curr), 430, y + 7, { align: "right", width: 115 });
    y += 22;
  });

  doc.strokeColor("#E5E7EB").lineWidth(1).moveTo(40, y + 4).lineTo(555, y + 4).stroke();
  y += 14;

  // Totals box
  const totalsY = y;
  const leftX = 350;
  const rightX = 430;
  const widthVal = 115;

  doc.fontSize(8).font("Helvetica").fillColor("#4B5563");
  doc.text("Subtotal:", leftX, totalsY);
  doc.text(formatCurrency(amounts.subtotal, curr), rightX, totalsY, { align: "right", width: widthVal });

  let nextY = totalsY + 14;
  if (Number(amounts.discountAmount) > 0) {
    doc.text("Discount:", leftX, nextY);
    doc.text(`-${formatCurrency(amounts.discountAmount, curr)}`, rightX, nextY, { align: "right", width: widthVal });
    nextY += 14;
  }
  if (Number(amounts.extraBedAmount) > 0) {
    doc.text("Extra Bed:", leftX, nextY);
    doc.text(`+${formatCurrency(amounts.extraBedAmount, curr)}`, rightX, nextY, { align: "right", width: widthVal });
    nextY += 14;
  }
  doc.text("Tax / GST:", leftX, nextY);
  doc.text(formatCurrency(amounts.taxAmount, curr), rightX, nextY, { align: "right", width: widthVal });
  nextY += 14;

  doc.strokeColor("#E5E7EB").lineWidth(1).moveTo(leftX, nextY).lineTo(555, nextY).stroke();
  nextY += 6;

  doc.fontSize(10).font("Helvetica-Bold").fillColor("#111827");
  doc.text("Total Amount:", leftX, nextY);
  doc.text(formatCurrency(amounts.totalAmount, curr), rightX, nextY, { align: "right", width: widthVal });

  // Payment status footer
  doc.rect(40, 740, 515, 30).fill("#F3F4F6");
  doc.fontSize(8).font("Helvetica").fillColor("#374151");
  doc.text(
    `Status: ${String(invoice.status).toUpperCase()}   |   Payment: ${String(invoice.paymentStatus).toUpperCase()} (${String(invoice.paymentMethod || "").replace(/_/g, " ")})`,
    50,
    750
  );

  doc.end();
}

module.exports = {
  buildInvoicePdfStream,
  createPdfReport,
  formatCurrency,
  formatDate,
  streamExcelReport,
};
