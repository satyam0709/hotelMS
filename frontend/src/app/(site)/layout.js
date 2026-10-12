import Footer from "@/components/site/Footer";
import AnnouncementBar from "@/components/site/AnnouncementBar";
import Navbar from "@/components/site/Navbar";
import BookingContactFab from "@/components/site/BookingContactFab";
import CookieConsent from "@/components/site/CookieConsent";
import { getBanners, getNavigation, getSettings } from "@/lib/api/content";
import { demoContactSettings } from "@/lib/demo-content";
import { siteConfig } from "@/lib/config";
import { splitNavigation } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  try {
    const settings = await getSettings();
    const title = settings?.metaTitle || settings?.websiteName || siteConfig.name;
    const description = settings?.metaDescription || settings?.tagline || siteConfig.description;
    const keywords = settings?.metaKeywords
      ? String(settings.metaKeywords).split(",").map((part) => part.trim()).filter(Boolean)
      : undefined;
    return {
      title: {
        default: title,
        template: `%s · ${settings?.websiteName || siteConfig.name}`,
      },
      description,
      keywords,
      openGraph: {
        title,
        description,
        type: "website",
      },
    };
  } catch {
    return {};
  }
}

async function loadShellData() {
  const [settingsResult, navigationResult, bannersResult] = await Promise.allSettled([
    getSettings(),
    getNavigation(),
    getBanners(),
  ]);

  const settings = {
    ...demoContactSettings,
    ...(settingsResult.status === "fulfilled" ? settingsResult.value : {}),
  };
  const navigation = navigationResult.status === "fulfilled" ? navigationResult.value : [];
  const banners = bannersResult.status === "fulfilled" && Array.isArray(bannersResult.value)
    ? bannersResult.value
    : [];
  const { header, footer } = splitNavigation(Array.isArray(navigation) ? navigation : []);

  return { settings, headerNav: header, footerNav: footer, announcement: banners[0] || null };
}

export default async function SiteLayout({ children }) {
  const { settings, headerNav, footerNav, announcement } = await loadShellData();

  return (
    <div className="flex min-h-full flex-col surface-grid">
      <AnnouncementBar banner={announcement} />
      <Navbar settings={settings} navigation={headerNav} />
      <main className="flex-1 pt-0">{children}</main>
      <Footer settings={settings} navigation={footerNav} />
      <BookingContactFab
        phone={settings?.phone}
        whatsapp={settings?.whatsapp}
        brandName={settings?.websiteName || siteConfig.name}
      />
      <CookieConsent />
    </div>
  );
}
