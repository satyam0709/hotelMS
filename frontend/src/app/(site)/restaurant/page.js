import Image from "next/image";
import { Clock3, UtensilsCrossed } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import ImageCarousel from "@/components/ui/ImageCarousel";
import SectionHeader from "@/components/ui/SectionHeader";
import FadeIn from "@/components/motion/FadeIn";
import { Stagger, StaggerItem } from "@/components/motion/Stagger";
import InquiryForm from "@/components/site/InquiryForm";
import { getRestaurant } from "@/lib/api/content";
import { getDemoRestaurant } from "@/lib/demo-content";
import { formatCurrency, mediaAlt, mediaUrl } from "@/lib/utils";

export const metadata = {
  title: "Restaurant & Dining",
  description: "Cuisine, meal timings, and the hotel dining experience.",
};

function asStringList(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === "string" && value.trim()) return [value];
  return [];
}

export default async function RestaurantPage() {
  const result = await Promise.allSettled([getRestaurant()]);
  const restaurant = (result[0].status === "fulfilled" && result[0].value) || getDemoRestaurant();

  const mediaItems = Array.isArray(restaurant.media)
    ? restaurant.media.map((item) => item?.media).filter(Boolean)
    : [];
  const carouselImages = mediaItems
    .map((item) => ({
      src: mediaUrl(item),
      alt: mediaAlt(item, restaurant.name || "Dining"),
    }))
    .filter((item) => item.src);
  const cuisines = asStringList(restaurant.cuisineTypesJson);
  const categories = Array.isArray(restaurant.menuCategories) ? restaurant.menuCategories : [];
  const timings = [
    restaurant.breakfastTime && { label: "Breakfast", value: restaurant.breakfastTime },
    restaurant.lunchTime && { label: "Lunch", value: restaurant.lunchTime },
    restaurant.dinnerTime && { label: "Dinner", value: restaurant.dinnerTime },
  ].filter(Boolean);

  return (
    <div className="pb-20">
      <section className="section-pad pb-8">
        <Container>
          <FadeIn>
            <SectionHeader
              eyebrow="Dining"
              title={restaurant.name || "Restaurant & Dining"}
              description={
                restaurant.description
                  || "Thoughtful cuisine served in a calm setting — from breakfast light to evening plates."
              }
            />
            {cuisines.length ? (
              <div className="mb-8 flex flex-wrap gap-2">
                {cuisines.map((item) => (
                  <Badge key={item} tone="line">{item}</Badge>
                ))}
              </div>
            ) : null}
          </FadeIn>
        </Container>
      </section>

      <Container className="space-y-14">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(16rem,0.75fr)]">
          <FadeIn>
            <ImageCarousel
              images={carouselImages}
              role="gallery"
              aspect="16/10"
              min={3}
              rounded="rounded-[2rem]"
              altFallback={restaurant.name || "Dining"}
              sizes="(max-width: 1024px) 100vw, 70vw"
            />
          </FadeIn>

          <FadeIn delay={0.05}>
            <aside className="space-y-4 rounded-[1.75rem] border border-line bg-elevated p-5 shadow-soft lg:sticky lg:top-[calc(var(--header-h)+1.5rem)]">
              <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.18em] text-accent uppercase">
                <UtensilsCrossed className="size-3.5" />
                Meal timings
              </p>
              {timings.length ? (
                <ul className="space-y-3">
                  {timings.map((item) => (
                    <li key={item.label} className="rounded-2xl border border-line px-4 py-3">
                      <p className="text-xs tracking-[0.14em] text-muted uppercase">{item.label}</p>
                      <p className="mt-1 inline-flex items-center gap-2 text-sm font-medium text-ink">
                        <Clock3 className="size-3.5 text-accent" />
                        {item.value}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <ul className="space-y-3 text-sm text-muted">
                  <li>Breakfast · 7:00 AM – 10:30 AM</li>
                  <li>Lunch · 12:30 PM – 3:00 PM</li>
                  <li>Dinner · 7:00 PM – 11:00 PM</li>
                </ul>
              )}
              {restaurant.reservationEnabled ? (
                <Button href="#dining-inquiry" className="w-full">
                  Reserve a table
                </Button>
              ) : (
                <Button href="#dining-inquiry" variant="secondary" className="w-full">
                  Dining inquiry
                </Button>
              )}
            </aside>
          </FadeIn>
        </div>

        {categories.length ? (
          <section>
            <SectionHeader
              eyebrow="Menu"
              title="From the kitchen"
              description="A selection of dishes available during your stay."
            />
            <div className="space-y-10">
              {categories.map((category) => {
                const items = Array.isArray(category.items) ? category.items : [];
                if (!items.length) return null;
                return (
                  <div key={category.id}>
                    <h3 className="font-display text-2xl text-ink md:text-3xl">{category.name}</h3>
                    <Stagger className="mt-5 grid gap-4 md:grid-cols-2">
                      {items.map((item) => {
                        const imageSrc = mediaUrl(item.media);
                        return (
                          <StaggerItem key={item.id}>
                            <article className="flex gap-4 rounded-[1.35rem] border border-line bg-elevated p-4">
                              {imageSrc ? (
                                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-accent-soft">
                                  <Image
                                    src={imageSrc}
                                    alt={mediaAlt(item.media, item.name)}
                                    fill
                                    className="object-cover"
                                    sizes="96px"
                                  />
                                </div>
                              ) : null}
                              <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-3">
                                  <h4 className="font-medium text-ink">{item.name}</h4>
                                  {item.price != null ? (
                                    <p className="shrink-0 text-sm font-semibold text-accent">
                                      {formatCurrency(item.price)}
                                    </p>
                                  ) : null}
                                </div>
                                {item.description ? (
                                  <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted">
                                    {item.description}
                                  </p>
                                ) : null}
                              </div>
                            </article>
                          </StaggerItem>
                        );
                      })}
                    </Stagger>
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}

        <section id="dining-inquiry">
          <InquiryForm
            defaultType="RESTAURANT"
            sourceRefType="restaurant"
            sourceRefId={restaurant.id}
          />
        </section>
      </Container>
    </div>
  );
}
