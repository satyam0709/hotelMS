import Image from "next/image";
import Link from "next/link";
import {
  CalendarDays,
  Clock3,
  Coffee,
  Flame,
  Leaf,
  Sparkles,
  UtensilsCrossed,
  Wine,
} from "lucide-react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import SectionHeader from "@/components/ui/SectionHeader";
import FadeIn from "@/components/motion/FadeIn";
import { Stagger, StaggerItem } from "@/components/motion/Stagger";
import RestaurantReservationForm from "@/components/site/RestaurantReservationForm";
import { getRestaurant } from "@/lib/api/content";
import { getDemoRestaurant } from "@/lib/demo-content";
import { fallbackSrc } from "@/lib/site-assets";
import { formatCurrency, mediaAlt, mediaUrl } from "@/lib/utils";

export const metadata = {
  title: "Restaurant & Dining — ExoStay Luxury Resort",
  description:
    "Artisanal coastal dining, wood-fired flavors, and candlelit pavilions. Reserve a table or explore our seasonal menu.",
};

function asStringList(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === "string" && value.trim()) return [value];
  return [];
}

const DINING_EXPERIENCES = [
  {
    title: "The Garden Pavilion",
    tag: "Veranda & Poolside",
    description: "Breezy morning breakfasts, cold-pressed elixirs, and unhurried al fresco lunches beside the gardens.",
    image: "https://images.unsplash.com/photo-1586861635167-e5223aadc9fe?auto=format&fit=crop&w=1200&q=80",
    icon: Coffee,
  },
  {
    title: "The Wood-Fired Hearth",
    tag: "Dinner & Embers",
    description: "Flavors kissed by local hardwoods, featuring day-boat seafood, smoked flatbreads, and tender cuts.",
    image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1200&q=80",
    icon: Flame,
  },
  {
    title: "Botanical Bar & Cellar",
    tag: "Aperitivo & Sunset",
    description: "Handcrafted garden infusions, artisanal spirits, and a cellar curated by our resident sommelier.",
    image: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=1200&q=80",
    icon: Wine,
  },
  {
    title: "Private Gazebo Dinners",
    tag: "Intimate Evenings",
    description: "Exclusive multi-course dinners set beneath candlelit palms with personal chef and butler service.",
    image: "https://images.unsplash.com/photo-1527359443443-84a48aec73d2?auto=format&fit=crop&w=1200&q=80",
    icon: Sparkles,
  },
];

export default async function RestaurantPage() {
  const result = await Promise.allSettled([getRestaurant()]);
  const restaurant = (result[0].status === "fulfilled" && result[0].value) || getDemoRestaurant();

  const cuisines = asStringList(restaurant.cuisineTypesJson);
  const categories = Array.isArray(restaurant.menuCategories) && restaurant.menuCategories.length
    ? restaurant.menuCategories
    : getDemoRestaurant().menuCategories;

  const timings = [
    {
      label: "Breakfast",
      hours: restaurant.breakfastTime || "7:00 AM – 10:30 AM",
      desc: "Artisan pastries, tropical fruits, farm eggs, and fresh roast coffee.",
    },
    {
      label: "Lunch",
      hours: restaurant.lunchTime || "12:30 PM – 3:30 PM",
      desc: "Light coastal bowls, garden salads, wood-fired flatbreads, and chilled wines.",
    },
    {
      label: "Sunset & Aperitivo",
      hours: "5:00 PM – 7:00 PM",
      desc: "Botanical cocktails, craft tapas, and evening ambient lounge music.",
    },
    {
      label: "Dinner",
      hours: restaurant.dinnerTime || "7:00 PM – 11:00 PM",
      desc: "Fire-hearth specialties, regional curries, and candlelit courtyard service.",
    },
  ];

  return (
    <div className="pb-24">
      {/* Cinematic Dining Hero */}
      <section className="relative min-h-[520px] lg:min-h-[580px] flex items-center overflow-hidden border-b border-line bg-ink text-white">
        <Image
          src={fallbackSrc("gallery", 2)}
          alt="The Garden Pavilion Dining"
          fill
          priority
          className="object-cover opacity-45 scale-105"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/30" />

        <Container className="relative z-10 py-20">
          <div className="max-w-3xl space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold tracking-[0.2em] uppercase backdrop-blur-md">
              <UtensilsCrossed className="size-3.5 text-accent-soft" />
              Gastronomy & Botanical Cellar
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl tracking-tight text-white leading-[1.1]">
              {restaurant.name || "The Garden Pavilion & Hearth"}
            </h1>

            <p className="max-w-2xl text-base sm:text-lg leading-relaxed text-white/85 font-light">
              {restaurant.description
                || "A celebration of regional terroir, morning-harvested produce, and wood-fired craftsmanship — served in sun-dappled pavilions and starlit gardens."}
            </p>

            {cuisines.length ? (
              <div className="flex flex-wrap items-center gap-2 pt-2">
                {cuisines.map((item) => (
                  <span
                    key={item}
                    className="rounded-full bg-white/15 px-3.5 py-1 text-xs font-medium text-white/90 border border-white/15 backdrop-blur-sm"
                  >
                    {item}
                  </span>
                ))}
              </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-4 pt-4">
              <Button href="#dining-inquiry" size="lg" className="rounded-xl shadow-lg">
                Reserve a Table
              </Button>
              <Button
                href="#menu-section"
                variant="secondary"
                size="lg"
                className="rounded-xl bg-white/20 text-white border-white/30 hover:bg-white/30 backdrop-blur-md"
              >
                Explore Menus
              </Button>
            </div>
          </div>
        </Container>
      </section>

      {/* Dining Concepts Strip */}
      <section className="section-pad pb-12">
        <Container>
          <FadeIn>
            <SectionHeader
              eyebrow="Dining Settings"
              title="Four distinctive culinary spaces"
              description="From morning coffee by the lotus pond to late-evening fire-grilled feasts under starlit palms."
            />
          </FadeIn>

          <Stagger className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {DINING_EXPERIENCES.map((exp) => {
              const Icon = exp.icon;
              return (
                <StaggerItem key={exp.title}>
                  <div className="group relative flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-line/80 bg-elevated shadow-soft transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg">
                    <div className="relative aspect-[4/3] overflow-hidden bg-accent-soft">
                      <Image
                        src={exp.image}
                        alt={exp.title}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-108"
                        sizes="(max-width: 768px) 100vw, 25vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute top-3.5 left-3.5 rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold tracking-wider text-ink uppercase backdrop-blur-md">
                        {exp.tag}
                      </div>
                    </div>
                    <div className="flex flex-1 flex-col p-5">
                      <div className="flex items-center gap-2 text-accent">
                        <Icon className="size-4" />
                        <h3 className="font-display text-xl text-ink">{exp.title}</h3>
                      </div>
                      <p className="mt-2 text-xs sm:text-sm leading-relaxed text-muted">
                        {exp.description}
                      </p>
                    </div>
                  </div>
                </StaggerItem>
              );
            })}
          </Stagger>
        </Container>
      </section>

      {/* Meal Timings Schedule */}
      <section className="py-12 bg-sand-soft/50 border-y border-line/70">
        <Container>
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-8">
            <div>
              <p className="text-xs font-semibold tracking-[0.2em] text-accent uppercase">
                Service Schedule
              </p>
              <h2 className="mt-1 font-display text-3xl text-ink md:text-4xl">
                Daily meal timings & dining rhythm
              </h2>
            </div>
            <Button href="#dining-inquiry" variant="secondary" size="sm" className="w-fit">
              Table reservations
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {timings.map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-line bg-elevated p-5 shadow-sm transition hover:border-accent/40"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold tracking-[0.16em] text-accent uppercase">
                    {item.label}
                  </span>
                  <Clock3 className="size-4 text-accent/70" />
                </div>
                <p className="mt-2 font-display text-xl text-ink font-semibold">{item.hours}</p>
                <p className="mt-2 text-xs leading-relaxed text-muted">{item.desc}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Culinary Menu Showcase */}
      <section id="menu-section" className="section-pad">
        <Container>
          <FadeIn>
            <SectionHeader
              eyebrow="Curated Menus"
              title="From our kitchen garden & open hearth"
              description="Seasonal signatures prepared fresh daily with cold-pressed oils, organic herbs, and fire-kissed spices."
            />
          </FadeIn>

          <div className="space-y-12 mt-10">
            {categories.map((category) => {
              const items = Array.isArray(category.items) ? category.items : [];
              if (!items.length) return null;
              return (
                <div key={category.id} className="rounded-[2rem] border border-line/80 bg-elevated p-6 md:p-8 shadow-sm">
                  <div className="border-b border-line/70 pb-4 mb-6 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="font-display text-2xl md:text-3xl text-ink">{category.name}</h3>
                      <p className="text-xs text-muted mt-1">Available for table service and in-room dining</p>
                    </div>
                    <Badge tone="line">{items.length} Curated dishes</Badge>
                  </div>

                  <Stagger className="grid gap-5 md:grid-cols-2">
                    {items.map((item, idx) => {
                      const imageSrc = mediaUrl(item.media) || fallbackSrc("gallery", (idx % 6) + 1);
                      return (
                        <StaggerItem key={item.id}>
                          <article className="group flex gap-4 rounded-2xl border border-line/60 bg-sand-soft/30 p-4 transition-all duration-300 hover:border-accent/40 hover:bg-elevated hover:shadow-md">
                            <div className="relative h-24 w-24 sm:h-28 sm:w-28 shrink-0 overflow-hidden rounded-xl bg-accent-soft">
                              <Image
                                src={imageSrc}
                                alt={mediaAlt(item.media, item.name)}
                                fill
                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                                sizes="112px"
                              />
                            </div>
                            <div className="flex flex-1 flex-col justify-between min-w-0">
                              <div>
                                <div className="flex items-start justify-between gap-3">
                                  <h4 className="font-display text-lg text-ink font-medium leading-snug group-hover:text-accent transition-colors">
                                    {item.name}
                                  </h4>
                                  {item.price != null ? (
                                    <span className="shrink-0 font-display text-base font-semibold text-accent">
                                      {formatCurrency(item.price)}
                                    </span>
                                  ) : null}
                                </div>
                                {item.description ? (
                                  <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted">
                                    {item.description}
                                  </p>
                                ) : null}
                              </div>
                              <div className="mt-2 flex items-center gap-2 text-[11px] text-accent/80">
                                <Leaf className="size-3 text-brand-green" />
                                <span>Fresh garden herbs & spices</span>
                              </div>
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
        </Container>
      </section>

      {/* Table Reservation & Inquiry Module */}
      <section id="dining-inquiry" className="py-16 bg-sand-soft/40 border-t border-line">
        <Container>
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold tracking-wider text-accent uppercase">
                <CalendarDays className="size-3.5" />
                Table Reservations
              </span>
              <h2 className="mt-3 font-display text-3xl sm:text-4xl text-ink">
                Reserve your dining experience
              </h2>
              <p className="mt-3 text-sm text-muted leading-relaxed max-w-xl mx-auto">
                Whether you desire a poolside veranda breakfast, a celebration feast, or a private candlelight dinner under the palms, our culinary team welcomes your reservation.
              </p>
            </div>

            <div className="rounded-[2rem] border border-line bg-elevated p-6 sm:p-10 shadow-lg">
              <RestaurantReservationForm />
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
