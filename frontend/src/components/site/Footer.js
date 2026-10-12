import FooterContent from "@/components/site/FooterContent";
import { siteConfig } from "@/lib/config";

const defaultQuickLinks = [
  { label: "Home", href: "/" },
  { label: "Rooms", href: "/rooms" },
  { label: "Facilities", href: "/facilities" },
  { label: "Restaurant", href: "/restaurant" },
  { label: "Gallery", href: "/gallery" },
  { label: "Contact", href: "/contact" },
];

const defaultPackageLinks = [
  { label: "All packages", href: "/packages" },
  { label: "Book a stay", href: "/booking" },
  { label: "Journal", href: "/journal" },
  { label: "Events", href: "/events" },
  { label: "Attractions", href: "/attractions" },
];

const defaultSupportLinks = [
  { label: "About us", href: "/about" },
  { label: "Contact", href: "/contact" },
  { label: "FAQs", href: "/faqs" },
  { label: "Privacy policy", href: "/policies/privacy" },
  { label: "Terms & conditions", href: "/policies/terms" },
  { label: "Cancellation", href: "/policies/cancellation" },
  { label: "Hotel rules", href: "/policies/hotel-rules" },
];

export default function Footer({ settings, navigation = [] }) {
  const brand = settings?.websiteName || siteConfig.name;
  const quickLinks = navigation.length ? navigation : defaultQuickLinks;
  const socials = Array.isArray(settings?.socialLinksJson)
    ? settings.socialLinksJson
    : settings?.socialLinksJson && typeof settings.socialLinksJson === "object"
      ? Object.entries(settings.socialLinksJson).map(([label, href]) => ({ label, href }))
      : [];
  const copyright = settings?.copyrightText || `© ${new Date().getFullYear()} ${brand}. All rights reserved.`;

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
