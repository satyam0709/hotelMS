"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { listAdminMedia } from "@/lib/api/admin-media";
import { mediaUrl } from "@/lib/utils";

export default function MediaIdField({ label, value, onChange, hint }) {
  const [options, setOptions] = useState([]);

  useEffect(() => {
    let active = true;
    listAdminMedia({ limit: 40 })
      .then((data) => {
        if (active) setOptions(data.items);
      })
      .catch(() => {
        if (active) setOptions([]);
      });
    return () => {
      active = false;
    };
  }, []);

  const selected = options.find((item) => item.id === value);
  const preview = mediaUrl(selected);

  return (
    <div className="space-y-2">
      <label className="flex w-full flex-col gap-1.5">
        <span className="text-xs font-medium tracking-[0.08em] text-muted uppercase">{label}</span>
        <select
          value={value || ""}
          onChange={(event) => onChange(event.target.value || "")}
          className="h-12 w-full rounded-xl border border-line bg-elevated px-3 text-sm text-ink"
        >
          <option value="">None</option>
          {options.map((item) => (
            <option key={item.id} value={item.id}>
              {item.altText || item.caption || item.publicId || item.id}
            </option>
          ))}
        </select>
      </label>
      <input
        type="text"
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Or paste media asset ID"
        className="h-10 w-full rounded-xl border border-line bg-elevated px-3 text-xs text-ink"
      />
      {preview ? (
        <img src={preview} alt="" className="h-20 w-32 rounded-lg object-cover border border-line" />
      ) : null}
      <p className="text-xs text-muted">
        {hint || "Upload or register images in "}
        <Link href="/admin/media" className="text-accent hover:underline">Media library</Link>
        {" "}first, then pick here.
      </p>
    </div>
  );
}
