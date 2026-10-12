import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Container from "@/components/ui/Container";
import FadeIn from "@/components/motion/FadeIn";
import MarkdownContent from "@/components/ui/MarkdownContent";
import { getBlog } from "@/lib/api/content";
import { findDemoBlog } from "@/lib/demo-content";
import { formatDateLabel, mediaAlt, mediaUrl } from "@/lib/utils";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  try {
    const post = await getBlog(slug);
    return {
      title: post.title,
      description: post.excerpt || post.title,
    };
  } catch {
    return { title: "Journal" };
  }
}

export default async function JournalArticlePage({ params }) {
  const { slug } = await params;
  let post;
  try {
    post = await getBlog(slug);
  } catch {
    post = null;
  }
  post = post || findDemoBlog(slug);
  if (!post) notFound();

  const cover = mediaUrl(post.coverMedia);

  return (
    <article className="pb-20">
      <section className="section-pad pb-8">
        <Container className="max-w-3xl">
          <FadeIn>
            <Link href="/journal" className="text-sm font-medium text-accent hover:underline">← Journal</Link>
            <p className="mt-6 text-xs font-semibold tracking-[0.22em] text-accent uppercase">
              {post.category || "Resort journal"}
            </p>
            <h1 className="mt-3 font-display text-4xl text-ink md:text-5xl">{post.title}</h1>
            <p className="mt-4 text-sm text-muted">
              {post.authorName ? `${post.authorName} · ` : ""}
              {post.publishedAt ? formatDateLabel(post.publishedAt) : ""}
            </p>
            {post.excerpt ? (
              <p className="mt-6 text-lg leading-relaxed text-muted">{post.excerpt}</p>
            ) : null}
          </FadeIn>
        </Container>
      </section>

      {cover ? (
        <Container className="max-w-4xl">
          <div className="relative aspect-[21/9] overflow-hidden rounded-2xl border border-line bg-accent-soft">
            <Image
              src={cover}
              alt={mediaAlt(post.coverMedia, post.title)}
              fill
              className="object-cover"
              sizes="(max-width: 896px) 100vw, 896px"
              priority
            />
          </div>
        </Container>
      ) : null}

      <section className="section-pad pt-10">
        <Container className="max-w-3xl">
          <FadeIn>
            <div className="prose-resort">
              <MarkdownContent content={post.content} />
            </div>
          </FadeIn>
        </Container>
      </section>
    </article>
  );
}
