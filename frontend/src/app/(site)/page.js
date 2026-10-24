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
import { getHome } from "@/lib/api/content";
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

export const revalidate = 60;

async function loadHomeBundle() {
  try {
    return await getHome();
  } catch {
    return {};
  }
}

export default async function HomePage() {
  const bundle = await loadHomeBundle();
  const show = buildHomeSectionVisibility(bundle.homePage);

  const roomsResponse = bundle.rooms || { items: [] };
  const featuredRooms = coalesceList(
    Array.isArray(roomsResponse?.items)
      ? roomsResponse.items
      : Array.isArray(roomsResponse)
        ? roomsResponse
        : [],
    demoRooms,
  );

  const facilityItems = coalesceList(
    Array.isArray(bundle.facilities?.items)
      ? bundle.facilities.items
      : Array.isArray(bundle.facilities)
        ? bundle.facilities
        : [],
    demoFacilities,
  );

  const attractionItems = coalesceList(
    Array.isArray(bundle.attractions?.items)
      ? bundle.attractions.items
      : Array.isArray(bundle.attractions)
        ? bundle.attractions
        : [],
    demoAttractions,
  );

  const bannerItems = coalesceList(Array.isArray(bundle.banners) ? bundle.banners : [], demoBanners);
  const blogPosts = coalesceList(Array.isArray(bundle.blogs) ? bundle.blogs : [], demoBlogPosts);
  const testimonialItems = coalesceList(
    Array.isArray(bundle.testimonials) ? bundle.testimonials : [],
    demoTestimonials,
  );
  const aboutPageContent = bundle.aboutPage || getDemoAboutPage();
  const siteSettings = { ...demoContactSettings, ...(bundle.settings || {}) };
  if (!siteSettings.websiteName || /hotel\s*l?ms/i.test(siteSettings.websiteName)) {
    siteSettings.websiteName = "ExoStay - Hotel/Resort";
  }

  const galleryPreviewItems = buildPublicGalleryItems(
    { rooms: featuredRooms, facilities: facilityItems },
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
      {show.rooms ? <FeaturedRooms rooms={featuredRooms.slice(0, 6)} /> : null}
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
