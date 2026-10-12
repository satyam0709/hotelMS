import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import MotionCard from "@/components/motion/MotionCard";
import { journalAccentDot } from "@/lib/journal-articles";
import { cn } from "@/lib/utils";

export default function JournalArticleCard({ article }) {
  const dot = journalAccentDot[article.accent] || journalAccentDot.lime;

  return (
    <MotionCard className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-elevated pb-4 shadow-soft">
      <Link href={article.href} className="flex h-full flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 rounded-2xl">
        <div className="relative h-60 overflow-hidden sm:h-64">
          {article.imageSrc ? (
            <Image
              src={article.imageSrc}
              alt={article.imageAlt || article.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          ) : (
            <div className="absolute inset-0 media-fallback-bg" />
          )}
        </div>

        <div className="flex flex-1 flex-col px-5 pt-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm text-muted">
              <span className={cn("size-2 rounded-full", dot)} aria-hidden />
              <span className="font-medium text-ink/80">{article.category}</span>
            </div>
            <span className="shrink-0 text-sm text-muted">{article.readTime}</span>
          </div>

          <h3 className="mt-2 mb-2 text-xl font-semibold tracking-tight text-ink group-hover:text-accent">
            {article.title}
          </h3>

          <span className="mt-auto inline-flex items-center gap-0.5 text-sm font-medium text-accent">
            Read story
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </span>
        </div>
      </Link>
    </MotionCard>
  );
}
