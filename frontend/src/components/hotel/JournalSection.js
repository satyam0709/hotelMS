import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Container from "@/components/ui/Container";
import JournalArticleCard from "@/components/hotel/JournalArticleCard";
import { Stagger, StaggerItem } from "@/components/motion/Stagger";
import { demoJournalArticles } from "@/lib/demo-content";
import { buildJournalArticles } from "@/lib/journal-articles";

export default function JournalSection({
  posts = [],
  events = [],
  attractions = [],
  limit = 3,
  showViewAll = true,
  className = "",
}) {
  const built = buildJournalArticles({ posts, events, attractions }, limit);
  const articles = built.length ? built : demoJournalArticles.slice(0, limit);

  return (
    <section className={className || "section-pad bg-brand-cream/40"}>
      <Container>
        <div className="grid gap-10 lg:grid-cols-[1fr_400px] lg:items-start lg:gap-10">
          <div>
            <p className="text-xs font-semibold tracking-[0.22em] text-accent uppercase">
              Resort journal
            </p>
            <h2 className="mt-4 max-w-2xl whitespace-pre-line font-display text-4xl leading-tight text-ink sm:text-5xl md:text-6xl">
              Stories from the property{"\n"}and the road nearby
            </h2>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
              Event venues, weekend rituals, and places our guests love — pulled from what is live at the resort today.
            </p>
          </div>

          <div className="pt-0 lg:pt-24">
            <p className="max-w-sm text-lg leading-relaxed text-muted">
              Resort stories from the editorial team, plus live events and nearby places when you need more to explore.
            </p>
            {showViewAll ? (
              <Link
                href="/journal"
                className="group mt-10 inline-flex items-center border-b border-ink/30 pb-3 text-lg font-semibold text-ink transition-colors hover:border-accent hover:text-accent"
              >
                View all stories
                <ArrowRight className="ml-4 size-5 transition-transform group-hover:translate-x-1" />
              </Link>
            ) : null}
          </div>
        </div>

        <Stagger className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3 lg:gap-4">
          {articles.map((article) => (
            <StaggerItem key={article.id}>
              <JournalArticleCard article={article} />
            </StaggerItem>
          ))}
        </Stagger>
      </Container>
    </section>
  );
}
