import Link from "next/link";
import Button from "@/components/ui/Button";
import { siteConfig } from "@/lib/config";

export const metadata = {
  title: "Page not found",
  description: "The page you requested could not be found.",
};

export default function RootNotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4f3ee] px-4 py-16">
      <div className="mx-auto w-full max-w-lg text-center">
        <p className="text-xs font-semibold tracking-[0.22em] text-[#2c6700] uppercase">
          404
        </p>
        <h1 className="mt-3 font-display text-4xl text-[#1a2e0a] md:text-5xl">
          Page not found
        </h1>
        <p className="mt-4 text-base leading-relaxed text-[#4a5c3a]">
          The link may be outdated, or this page is not available. Head home or
          contact {siteConfig.name} for help.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button href="/">Back home</Button>
          <Button href="/contact" variant="secondary">
            Contact us
          </Button>
          <Link
            href="/booking"
            className="text-sm font-medium text-[#2c6700] underline-offset-4 hover:underline"
          >
            Book a stay
          </Link>
        </div>
      </div>
    </main>
  );
}
