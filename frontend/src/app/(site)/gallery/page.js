import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import SectionHeader from "@/components/ui/SectionHeader";
import GalleryExperience from "@/components/hotel/GalleryExperience";
import FadeIn from "@/components/motion/FadeIn";
import {
  getAttractions,
  getEvents,
  getFacilities,
  getGallery,
} from "@/lib/api/content";
import { getRooms } from "@/lib/api/rooms";
import {
  buildGalleryItemsFromApi,
  buildPublicGalleryItems,
  galleryCategoryOptionsFromApi,
} from "@/lib/gallery-items";
import { demoGalleryItems } from "@/lib/demo-content";
import { asListItems } from "@/lib/utils";

export const metadata = {
  title: "Gallery",
  description: "Photos of the resort, rooms, and surroundings.",
};

export default async function GalleryPage() {
  const galleryResult = await Promise.allSettled([getGallery()]);
  const apiCategories = galleryResult[0].status === "fulfilled" && Array.isArray(galleryResult[0].value)
    ? galleryResult[0].value
    : [];
  const apiItems = buildGalleryItemsFromApi(apiCategories);
  const useApiGallery = apiItems.length > 0;

  let items = apiItems;
  let categoryOptions = galleryCategoryOptionsFromApi(apiCategories);
  let failed = galleryResult[0].status === "rejected";

  if (!useApiGallery) {
    const result = await Promise.allSettled([
      getRooms({ limit: 24 }),
      getFacilities({ limit: 24 }),
      getEvents(),
      getAttractions({ limit: 12 }),
    ]);

    failed = result.some((item) => item.status === "rejected");
    const rooms = result[0].status === "fulfilled" ? asListItems(result[0].value) : [];
    const facilities = result[1].status === "fulfilled" ? asListItems(result[1].value) : [];
    const events = result[2].status === "fulfilled"
      ? (Array.isArray(result[2].value) ? result[2].value : asListItems(result[2].value))
      : [];
    const attractions = result[3].status === "fulfilled" ? asListItems(result[3].value) : [];

    items = buildPublicGalleryItems({ rooms, facilities, events, attractions });
    categoryOptions = undefined;
  }

  if (!items.length) {
    items = demoGalleryItems();
  }

  return (
    <div className="pb-20">
      <section className="section-pad pb-10">
        <Container>
          <FadeIn>
            <SectionHeader
              eyebrow="Gallery"
              title="Moments around the property"
              description={
                useApiGallery
                  ? "Browse resort albums by category. Tap any image for a closer look."
                  : "Browse by category. Tap any image for a closer look — showing photos from rooms and facilities until gallery albums are published."
              }
              action={<Button href="/rooms" variant="secondary">View rooms</Button>}
            />
          </FadeIn>
        </Container>
      </section>

      <Container className="space-y-8">
        <GalleryExperience items={items} categoryOptions={categoryOptions} />
      </Container>
    </div>
  );
}
