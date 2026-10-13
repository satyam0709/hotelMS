import FooterContent from "@/components/site/FooterContent";
import { siteConfig } from "@/lib/config";

const defaultQuickLinks = [
  { label: "Home", href: "/" },
  { label: "Rooms", href: "/rooms" },
  { label: "Dining", href: "/restaurant" },
  { label: "Facilities", href: "/facilities" },
  { label: "Gallery", href: "/gallery" },
  { label: "Contact", href: "/contact" },
];

const defaultPackageLinks = [
  { label: "All packages", href: "/packages" },
  { label: "Book a stay", href: "/booking" },
  { label: "Offers & journal", href: "/journal" },
  { label: "Events", href: "/events" },
  { label: "Nearby attractions", href: "/attractions" },
];

const defaultSupportLinks = [
  { label: "About us", href: "/about" },
  { label: "FAQs", href: "/faqs" },
  { label: "Guest reviews", href: "/testimonials" },
  { label: "Privacy policy", href: "/policies/privacy" },
  { label: "Terms & conditions", href: "/policies/terms" },
  { label: "Cancellation", href: "/policies/cancellation" },
  { label: "Hotel rules", href: "/policies/hotel-rules" },
];

export default function Footer({ settings, navigation = [] }) {
  const rawBrand = settings?.websiteName;
  const brand = !rawBrand || /hotel\s*l?ms/i.test(rawBrand) ? siteConfig.name : rawBrand;
  const quickLinks = navigation.length ? navigation : defaultQuickLinks;
  const socials = Array.isArray(settings?.socialLinksJson)
    ? settings.socialLinksJson
    : settings?.socialLinksJson && typeof settings.socialLinksJson === "object"
      ? Object.entries(settings.socialLinksJson).map(([label, href]) => ({ label, href }))
      : [];
  const year = new Date().getFullYear();
  const rawCopyright = settings?.copyrightText?.trim();
  const copyright = rawCopyright
    ? rawCopyright.replace(/©\s*\d{4}/, `© ${year}`)
    : `© ${year} ${brand}. All rights reserved.`;

  return (
    <FooterContent
      brand={brand}
      settings={settings}
      quickLinks={quickLinks}
      packageLinks={defaultPackageLinks}
      supportLinks={defaultSupportLinks}
      socials={socials}
      copyright={copyright}
    />
  );
}
