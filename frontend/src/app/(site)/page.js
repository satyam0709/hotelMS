import AboutPreview from "@/components/hotel/AboutPreview";
import CtaBand from "@/components/hotel/CtaBand";
import FeaturedRooms from "@/components/hotel/FeaturedRooms";
import HomeGalleryVignettes from "@/components/hotel/HomeGalleryVignettes";
import HomePaymentSection from "@/components/hotel/HomePaymentSection";
import HomeMapSection from "@/components/hotel/HomeMapSection";
import JournalSection from "@/components/hotel/JournalSection";
import LocalGuideSection from "@/components/hotel/LocalGuideSection";
import LuxuryInteractiveHero from "@/components/hotel/LuxuryInteractiveHero";
import SignatureExperiences from "@/components/hotel/SignatureExperiences";
import SpecialOffersStrip from "@/components/hotel/SpecialOffersStrip";
import TestimonialsGrid from "@/components/hotel/TestimonialsGrid";
import NewsletterSection from "@/components/hotel/NewsletterSection";
import {
  getAttractions,
  getBanners,
  getBlogs,
  getFacilities,
  getPublicPage,
  getSettings,
  getTestimonials,
} from "@/lib/api/content";
import { getRooms } from "@/lib/api/rooms";
import { buildPublicGalleryItems } from "@/lib/gallery-items";
import { buildHomeSectionVisibility } from "@/lib/home-sections";
import {
  coalesceList,
  demoAttractions,
  demoBanners,
  demoBlogPosts,
  demoFacilities,
  demoRooms,
  demoContactSettings,
  demoTestimonials,
  getDemoAboutPage,
} from "@/lib/demo-content";

export const dynamic = "force-dynamic";

async function settledValue(promise, fallback) {
  const result = await Promise.allSettled([promise]);
  return result[0].status === "fulfilled" ? result[0].value : fallback;
}

export default async function HomePage() {
  const [
    settings,
    homePage,
    aboutPage,
    roomsResponse,
    facilities,
    testimonials,
    attractions,
    banners,
    blogs,
    galleryRooms,
    galleryFacilities,
  ] = await Promise.all([
    settledValue(getSettings(), {}),
    settledValue(getPublicPage("home"), null),
    settledValue(getPublicPage("about"), null),
    settledValue(getRooms({ isFeatured: "true", limit: 6 }), { items: [] }),
    settledValue(getFacilities({ limit: 8 }), []),
    settledValue(getTestimonials(), []),
    settledValue(getAttractions({ limit: 6 }), []),
    settledValue(getBanners(), []),
    settledValue(getBlogs({ limit: 6 }), []),
    settledValue(getRooms({ limit: 12 }), { items: [] }),
    settledValue(getFacilities({ limit: 12 }), []),
  ]);
  const show = buildHomeSectionVisibility(homePage);

  const featuredRooms = coalesceList(
    Array.isArray(roomsResponse?.items)
      ? roomsResponse.items
      : Array.isArray(roomsResponse)
        ? roomsResponse
        : [],
    demoRooms,
  );

  const facilityItems = coalesceList(
    Array.isArray(facilities?.items)
      ? facilities.items
      : Array.isArray(facilities)
        ? facilities
        : [],
    demoFacilities,
  );

  const attractionItems = coalesceList(
    Array.isArray(attractions?.items)
      ? attractions.items
      : Array.isArray(attractions)
        ? attractions
        : [],
    demoAttractions,
  );

  const bannerItems = coalesceList(Array.isArray(banners) ? banners : [], demoBanners);
  const blogPosts = coalesceList(Array.isArray(blogs) ? blogs : [], demoBlogPosts);
  const testimonialItems = coalesceList(
    Array.isArray(testimonials) ? testimonials : [],
    demoTestimonials,
  );
  const aboutPageContent = aboutPage || getDemoAboutPage();
  const siteSettings = { ...demoContactSettings, ...(settings || {}) };
  if (!siteSettings.websiteName || /hotel\s*l?ms/i.test(siteSettings.websiteName)) {
    siteSettings.websiteName = "ExoStay - Hotel/Resort";
  }
  const galleryRoomItems = Array.isArray(galleryRooms?.items)
    ? galleryRooms.items
    : Array.isArray(galleryRooms)
      ? galleryRooms
      : [];
  const galleryFacilityItems = Array.isArray(galleryFacilities?.items)
    ? galleryFacilities.items
    : Array.isArray(galleryFacilities)
      ? galleryFacilities
      : [];
  const galleryPreviewItems = buildPublicGalleryItems(
    { rooms: galleryRoomItems, facilities: galleryFacilityItems },
    12
  );

  const hotelJsonLd = {
    "@context": "https://schema.org",
    "@type": "Hotel",
    name: siteSettings.websiteName || "ExoStay - Hotel/Resort",
    description: siteSettings.metaDescription || siteSettings.address || undefined,
    telephone: siteSettings.phone || undefined,
    email: siteSettings.email || undefined,
    address: siteSettings.address
      ? {
          "@type": "PostalAddress",
          streetAddress: siteSettings.address,
        }
      : undefined,
    url: process.env.NEXT_PUBLIC_SITE_URL || undefined,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(hotelJsonLd) }}
      />
      {show.hero ? <LuxuryInteractiveHero banners={bannerItems} settings={siteSettings} /> : null}
      {show.about ? <AboutPreview page={aboutPageContent} settings={siteSettings} /> : null}
      {show.rooms ? <FeaturedRooms rooms={featuredRooms} /> : null}
      {show.gallery ? <HomeGalleryVignettes items={galleryPreviewItems} /> : null}
      <HomePaymentSection brandName={siteSettings.websiteName} />
      <HomeMapSection settings={siteSettings} />
      {show.facilities ? <SignatureExperiences facilities={facilityItems} /> : null}
      {show.offers ? <SpecialOffersStrip banners={bannerItems} /> : null}
      {show.testimonials ? <TestimonialsGrid testimonials={testimonialItems} /> : null}
      {show.journal ? <JournalSection posts={blogPosts} attractions={attractionItems} limit={3} /> : null}
      {show.local_guide ? <LocalGuideSection attractions={attractionItems} settings={siteSettings} /> : null}
      {show.newsletter ? <NewsletterSection settings={siteSettings} /> : null}
      {show.cta ? <CtaBand settings={siteSettings} /> : null}
    </>
  );
}
