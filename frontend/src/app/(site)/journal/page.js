import Container from "@/components/ui/Container";
import SectionHeader from "@/components/ui/SectionHeader";
import JournalSection from "@/components/hotel/JournalSection";
import FadeIn from "@/components/motion/FadeIn";
import { getAttractions, getBlogs, getEvents } from "@/lib/api/content";
import { asListItems } from "@/lib/utils";

export const metadata = {
  title: "Resort Journal",
  description: "Stories, events, and nearby places from the hotel team.",
};

export default async function JournalPage() {
  const [blogsResult, eventsResult, attractionsResult] = await Promise.allSettled([
    getBlogs({ limit: 24 }),
    getEvents(),
    getAttractions({ limit: 24 }),
  ]);

  const posts = blogsResult.status === "fulfilled" && Array.isArray(blogsResult.value)
    ? blogsResult.value
    : [];

  const events = eventsResult.status === "fulfilled" && Array.isArray(eventsResult.value)
    ? eventsResult.value
    : [];
  const attractions = attractionsResult.status === "fulfilled"
    ? asListItems(attractionsResult.value)
    : [];

  return (
    <div className="pb-20">
      <section className="section-pad pb-4">
        <Container>
          <FadeIn>
            <SectionHeader
              eyebrow="Journal"
              title="Resort stories & nearby finds"
              description="Editorial stories from the resort team, plus events and day-trip ideas."
            />
          </FadeIn>
        </Container>
      </section>

      <JournalSection
        posts={posts}
        events={events}
        attractions={attractions}
        limit={9}
        showViewAll={false}
        className="section-pad pt-0"
      />
    </div>
  );
}
