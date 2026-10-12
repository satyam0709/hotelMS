"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { searchSite } from "@/lib/api/content";
import { ApiError } from "@/lib/api/client";

function ResultGroup({ title, items }) {
  if (!items?.length) return null;
  return (
    <section className="space-y-3">
      <h2 className="font-display text-2xl text-ink">{title}</h2>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={`${item.type}-${item.id}`}>
            <Link
              href={item.href}
              className="block rounded-2xl border border-line bg-elevated px-4 py-3 transition-colors hover:border-accent/40"
            >
              <p className="font-medium text-ink">{item.title}</p>
              {item.summary ? (
                <p className="mt-1 line-clamp-2 text-sm text-muted">{item.summary}</p>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function SearchPageClient({ initialQuery = "" }) {
  const router = useRouter();
  const [q, setQ] = useState(initialQuery);
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setQ(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    const query = String(initialQuery || "").trim();
    if (query.length < 2) {
      setResults(null);
      setError("");
      return undefined;
    }

    let active = true;
    startTransition(async () => {
      setError("");
      try {
        const data = await searchSite(query);
        if (active) setResults(data);
      } catch (err) {
        if (active) {
          setResults(null);
          setError(err instanceof ApiError ? err.message : "Unable to search right now.");
        }
      }
    });

    return () => {
      active = false;
    };
  }, [initialQuery]);

  function onSubmit(event) {
    event.preventDefault();
    const next = q.trim();
    router.push(next ? `/search?q=${encodeURIComponent(next)}` : "/search");
  }

  const total =
    (results?.rooms?.length || 0)
    + (results?.packages?.length || 0)
    + (results?.blogs?.length || 0)
    + (results?.pages?.length || 0);

  return (
    <div className="space-y-8">
      <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Input
            label="Search the site"
            name="q"
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="Rooms, packages, journal, pages…"
            autoComplete="off"
          />
        </div>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Searching…" : "Search"}
        </Button>
      </form>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {!initialQuery ? (
        <p className="text-sm text-muted">Enter at least 2 characters to search published content.</p>
      ) : null}

      {results && !error ? (
        total ? (
          <div className="space-y-8">
            <p className="text-sm text-muted">{total} result{total === 1 ? "" : "s"} for “{results.q}”</p>
            <ResultGroup title="Rooms" items={results.rooms} />
            <ResultGroup title="Packages" items={results.packages} />
            <ResultGroup title="Journal" items={results.blogs} />
            <ResultGroup title="Pages" items={results.pages} />
          </div>
        ) : (
          <p className="text-sm text-muted">No matches for “{results.q}”.</p>
        )
      ) : null}
    </div>
  );
}
