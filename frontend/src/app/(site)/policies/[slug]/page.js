import Link from "next/link";
import { notFound } from "next/navigation";
import Container from "@/components/ui/Container";
import FadeIn from "@/components/motion/FadeIn";
import { ApiError } from "@/lib/api/client";
import { getPolicy } from "@/lib/api/content";
import { findDemoPolicy } from "@/lib/demo-content";
import { formatDateLabel } from "@/lib/utils";

const POLICY_LINKS = [
  { label: "Privacy Policy", href: "/policies/privacy" },
  { label: "Terms & Conditions", href: "/policies/terms" },
  { label: "Cancellation", href: "/policies/cancellation" },
  { label: "Refund", href: "/policies/refund" },
  { label: "Hotel Rules", href: "/policies/hotel-rules" },
  { label: "Check-in / Check-out", href: "/policies/check-in-check-out" },
];

async function loadPolicy(slug) {
  try {
    return await getPolicy(slug);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const policy = await loadPolicy(slug).catch(() => null);
  if (!policy) return { title: "Policy not found" };
  return {
    title: policy.title,
    description: `${policy.title} for guests and visitors.`,
  };
}

export default async function PolicyPage({ params }) {
  const { slug } = await params;
  const policy = (await loadPolicy(slug)) || findDemoPolicy(slug);
  if (!policy) notFound();

  return (
    <div className="pb-20">
      <section className="section-pad pb-8">
        <Container>
          <FadeIn>
            <nav className="mb-6 text-sm text-muted" aria-label="Breadcrumb">
              <Link href="/" className="transition-colors hover:text-accent">
                Home
              </Link>
              <span className="mx-2 text-line">/</span>
              <span className="text-ink">{policy.title}</span>
            </nav>
            <p className="text-xs font-semibold tracking-[0.22em] text-accent uppercase">
              {policy.type || "Policy"}
            </p>
            <h1 className="mt-3 font-display text-4xl text-ink md:text-6xl">{policy.title}</h1>
            {policy.updatedAt ? (
              <p className="mt-4 text-sm text-muted">
                Updated {formatDateLabel(policy.updatedAt)}
              </p>
            ) : null}
          </FadeIn>
        </Container>
      </section>

      <Container>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(14rem,0.55fr)]">
          <FadeIn>
            <article className="rounded-[1.75rem] border border-line bg-elevated p-6 shadow-soft md:p-10">
              <div className="prose-policy whitespace-pre-line text-base leading-relaxed text-muted md:text-lg">
                {policy.content}
              </div>
            </article>
          </FadeIn>

          <aside className="h-fit rounded-[1.75rem] border border-line bg-elevated p-5">
            <p className="text-xs font-semibold tracking-[0.18em] text-muted uppercase">
              Other policies
            </p>
            <ul className="mt-4 space-y-2">
              {POLICY_LINKS.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`text-sm transition-colors hover:text-accent ${
                      item.href === `/policies/${slug}` ? "font-semibold text-accent" : "text-ink/80"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </Container>
    </div>
  );
}
