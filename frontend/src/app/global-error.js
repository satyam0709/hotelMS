"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error("Global application error caught:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-[#f7f6f0] px-4 py-16 font-sans text-[#1a201c]">
        <div className="mx-auto max-w-md text-center">
          <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl bg-[#2c6700]/10 text-[#2c6700]">
            <svg
              className="size-7"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <p className="text-xs font-semibold tracking-[0.2em] text-[#2c6700] uppercase">
            Notice
          </p>
          <h1 className="mt-2 text-3xl font-serif text-[#1a201c]">
            Something unexpected occurred
          </h1>
          <p className="mt-3 text-sm text-[#5a6b5e]">
            We were unable to complete this action right now. Please reload to try again.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              type="button"
              onClick={() => reset()}
              className="inline-flex items-center justify-center rounded-xl bg-[#2c6700] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:brightness-110"
            >
              Reload page
            </button>
            <a
              href="/"
              className="inline-flex items-center justify-center rounded-xl border border-[#d6d8ce] bg-white px-5 py-2.5 text-sm font-semibold text-[#1a201c] hover:bg-neutral-50"
            >
              Return home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
