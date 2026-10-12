const HOME_SECTION_KEYS = [
  "hero",
  "about",
  "rooms",
  "gallery",
  "facilities",
  "offers",
  "testimonials",
  "journal",
  "local_guide",
  "newsletter",
  "cta",
];

/**
 * When a published `home` CMS page has sections, only listed/enabled keys render.
 * When the home page is missing or has no sections, every section stays visible.
 */
export function buildHomeSectionVisibility(homePage) {
  const sections = Array.isArray(homePage?.sections) ? homePage.sections : [];
  if (!homePage || sections.length === 0) {
    return Object.fromEntries(HOME_SECTION_KEYS.map((key) => [key, true]));
  }
  const enabled = new Set(
    sections
      .filter((section) => section.isEnabled !== false)
      .map((section) => String(section.sectionKey || "").trim())
      .filter(Boolean)
  );
  return Object.fromEntries(HOME_SECTION_KEYS.map((key) => [key, enabled.has(key)]));
}

export { HOME_SECTION_KEYS };
