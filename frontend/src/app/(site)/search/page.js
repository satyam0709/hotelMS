import Container from "@/components/ui/Container";
import SectionHeader from "@/components/ui/SectionHeader";
import FadeIn from "@/components/motion/FadeIn";
import SearchPageClient from "@/components/site/SearchPageClient";

export const metadata = {
  title: "Search",
  description: "Search rooms, packages, journal posts, and pages.",
};

export default async function SearchPage({ searchParams }) {
  const params = await searchParams;
  const initialQuery = String(params?.q || "").trim();

  return (
    <div className="pb-20">
      <section className="section-pad pb-10">
        <Container>
          <FadeIn>
            <SectionHeader
              eyebrow="Search"
              title="Find stays, offers, and stories"
              description="Search published rooms, packages, journal posts, and pages."
            />
          </FadeIn>
        </Container>
      </section>
      <Container>
        <SearchPageClient initialQuery={initialQuery} />
      </Container>
    </div>
  );
}
