import { allSiteAssetSources, fallbackSrc } from "@/lib/site-assets";
import { siteConfig } from "@/lib/config";

function media(src, alt) {
  return { url: src, altText: alt };
}

function roomMedia(src, alt) {
  return [{ usage: "featured", media: media(src, alt) }];
}

export function coalesceList(value, fallback = []) {
  if (Array.isArray(value) && value.length) return value;
  if (value?.items && Array.isArray(value.items) && value.items.length) return value.items;
  return fallback;
}

export const demoRooms = [
  {
    id: "demo-room-deluxe",
    slug: "deluxe-garden-room",
    name: "Deluxe Garden Room",
    shortDescription: "Floor-to-ceiling windows open to palm-lined gardens and morning light.",
    basePrice: 5200,
    nightlyFrom: 5200,
    isFeatured: true,
    maxAdults: 2,
    maxChildren: 1,
    maxOccupancy: 3,
    bedType: "King",
    roomSize: "32 m²",
    category: { name: "Deluxe" },
    media: roomMedia(fallbackSrc("room", 0), "Deluxe garden room"),
    amenities: [{ name: "Wi‑Fi" }, { name: "Rain shower" }, { name: "Garden view" }],
  },
  {
    id: "demo-room-suite",
    slug: "terrace-suite",
    name: "Terrace Suite",
    shortDescription: "A private terrace, lounge seating, and space for unhurried mornings.",
    basePrice: 8900,
    nightlyFrom: 8900,
    isFeatured: true,
    maxAdults: 3,
    maxChildren: 2,
    maxOccupancy: 4,
    bedType: "King + sofa bed",
    roomSize: "48 m²",
    category: { name: "Suite" },
    media: roomMedia(fallbackSrc("room", 1), "Terrace suite"),
    amenities: [{ name: "Terrace" }, { name: "Mini bar" }, { name: "Bathtub" }],
  },
  {
    id: "demo-room-premium",
    slug: "premium-pool-view",
    name: "Premium Pool View",
    shortDescription: "Balcony overlooking the pool deck with curated in-room amenities.",
    basePrice: 6800,
    nightlyFrom: 6800,
    isFeatured: false,
    maxAdults: 2,
    maxChildren: 1,
    maxOccupancy: 3,
    bedType: "Queen",
    roomSize: "36 m²",
    category: { name: "Premium" },
    media: roomMedia(fallbackSrc("room", 2), "Pool view room"),
    amenities: [{ name: "Pool view" }, { name: "Desk" }, { name: "Room service" }],
  },
];

export const demoFacilities = [
  {
    id: "demo-facility-spa",
    slug: "wellness-spa",
    name: "Wellness & Spa",
    category: "Wellness",
    description: "Thermal rituals, massage suites, and a quiet hydrotherapy circuit.",
    operatingHours: "Daily · 8:00 AM – 9:00 PM",
    media: [{ media: media(fallbackSrc("facility", 0), "Spa") }],
  },
  {
    id: "demo-facility-pool",
    slug: "infinity-pool",
    name: "Infinity Pool",
    category: "Recreation",
    description: "Sun loungers, shaded cabanas, and poolside service through the afternoon.",
    operatingHours: "Daily · 7:00 AM – 8:00 PM",
    media: [{ media: media(fallbackSrc("hero", 1), "Pool") }],
  },
  {
    id: "demo-facility-dining",
    slug: "pavilion-dining",
    name: "Garden Pavilion",
    category: "Dining",
    description: "Open-air tables for breakfast, light lunches, and candlelit dinners.",
    operatingHours: "Daily · 7:00 AM – 11:00 PM",
    media: [{ media: media(fallbackSrc("gallery", 2), "Dining pavilion") }],
  },
  {
    id: "demo-facility-parking",
    slug: "guest-parking",
    name: "Guest Parking",
    category: "Services",
    description: "Covered bays, valet assistance, and EV charging on request.",
    operatingHours: "24 hours",
    media: [{ media: media(fallbackSrc("parking", 0), "Parking") }],
  },
];

export const demoAttractions = [
  {
    id: "demo-attraction-1",
    slug: "heritage-old-town",
    name: "Heritage Old Town",
    distance: "12 km · 25 min drive",
    description: "Colonial lanes, local markets, and sunset viewpoints above the city.",
    media: media(fallbackSrc("gallery", 3), "Old town"),
  },
  {
    id: "demo-attraction-2",
    slug: "forest-trail",
    name: "Forest Ridge Trail",
    distance: "8 km · 18 min drive",
    description: "A shaded loop trail with birdlife and a lookout deck at the ridge.",
    media: media(fallbackSrc("gallery", 4), "Forest trail"),
  },
  {
    id: "demo-attraction-3",
    slug: "artisan-village",
    name: "Artisan Village",
    distance: "15 km · 30 min drive",
    description: "Pottery studios, spice stalls, and weekend craft fairs.",
    media: media(fallbackSrc("gallery", 5), "Artisan village"),
  },
  {
    id: "demo-attraction-4",
    slug: "lake-picnic",
    name: "Lake Picnic Point",
    distance: "20 km · 35 min drive",
    description: "Quiet shoreline picnics and paddle boats on calm mornings.",
    media: media(fallbackSrc("gallery", 6), "Lake"),
  },
  {
    id: "demo-attraction-5",
    slug: "temple-gardens",
    name: "Temple Gardens",
    distance: "6 km · 15 min drive",
    description: "Lotus ponds, evening lamps, and a gentle walk through sacred groves.",
    media: media(fallbackSrc("gallery", 7), "Temple gardens"),
  },
];

export const demoTestimonials = [
  {
    id: "demo-testimonial-1",
    guestName: "Ananya Sharma",
    review: "The gardens, the pool mornings, and how quietly the team anticipates every need — we did not want to leave.",
    rating: 5,
    source: "Direct guest",
    reviewDate: "2025-11-12",
  },
  {
    id: "demo-testimonial-2",
    guestName: "James & Elise Carter",
    review: "Our suite terrace became the favourite room on the trip. Dining at the pavilion was consistently excellent.",
    rating: 5,
    source: "Weekend stay",
    reviewDate: "2025-10-03",
  },
  {
    id: "demo-testimonial-3",
    guestName: "Rahul Mehta",
    review: "Effortless check-in, thoughtful spa recommendations, and rooms that feel genuinely restorative.",
    rating: 5,
    source: "Business travel",
    reviewDate: "2025-09-18",
  },
];

export const demoBanners = [
  {
    id: "demo-banner-1",
    title: "Monsoon retreat",
    subtitle: "Three nights with daily breakfast and a spa credit.",
    ctaText: "View package",
    ctaLink: "/packages",
    desktopMedia: media(fallbackSrc("hero", 0), "Monsoon retreat"),
  },
  {
    id: "demo-banner-2",
    title: "Weekend escape",
    subtitle: "Late checkout, pool cabana, and chef’s tasting menu for two.",
    ctaText: "Book now",
    ctaLink: "/booking",
    desktopMedia: media(fallbackSrc("hero", 1), "Weekend escape"),
  },
  {
    id: "demo-banner-3",
    title: "Celebration stay",
    subtitle: "Decor, cake service, and a private dinner setup.",
    ctaText: "Enquire",
    ctaLink: "/contact?type=PACKAGE",
    desktopMedia: media(fallbackSrc("hero", 2), "Celebration stay"),
  },
  {
    id: "demo-banner-4",
    title: "Garden mornings",
    subtitle: "Quiet suites opening onto palm courtyards and soft light.",
    ctaText: "Explore rooms",
    ctaLink: "/rooms",
    desktopMedia: media(fallbackSrc("gallery", 0), "Garden mornings"),
  },
];

export const demoPackages = [
  {
    id: "demo-package-1",
    slug: "wellness-weekend",
    name: "Wellness Weekend",
    duration: "2 nights",
    description: "Daily yoga, 60-minute spa ritual, and nourishing breakfast spreads.",
    price: 18400,
    isFeatured: true,
    bannerMedia: media(fallbackSrc("gallery", 0), "Wellness weekend"),
  },
  {
    id: "demo-package-2",
    slug: "family-stay",
    name: "Family Garden Stay",
    duration: "3 nights",
    description: "Connecting rooms, kids’ activities, and poolside dining credits.",
    price: 24600,
    isFeatured: false,
    bannerMedia: media(fallbackSrc("room", 0), "Family stay"),
  },
  {
    id: "demo-package-3",
    slug: "romantic-evening",
    name: "Romantic Evening",
    duration: "1 night",
    description: "Suite upgrade, candlelit dinner, and sunrise breakfast on the terrace.",
    price: 12800,
    isFeatured: true,
    bannerMedia: media(fallbackSrc("room", 1), "Romantic evening"),
  },
];

export const demoEvents = [
  {
    id: "demo-event-1",
    slug: "grand-ballroom",
    name: "Grand Ballroom",
    capacity: 250,
    basePrice: 85000,
    description: "Crystal lighting, pre-function foyer, and dedicated event concierge.",
    media: [{ media: media(fallbackSrc("gallery", 1), "Ballroom") }],
  },
  {
    id: "demo-event-2",
    slug: "garden-pavilion-events",
    name: "Garden Pavilion",
    capacity: 120,
    basePrice: 45000,
    description: "Open-air celebrations framed by palms and string-lit evenings.",
    media: [{ media: media(fallbackSrc("gallery", 2), "Garden pavilion") }],
  },
  {
    id: "demo-event-3",
    slug: "boardroom-suite",
    name: "Boardroom Suite",
    capacity: 24,
    basePrice: 12000,
    description: "Executive meetings with AV, breakout lounge, and curated refreshments.",
    media: [{ media: media(fallbackSrc("reception", 0), "Boardroom") }],
  },
];

export const demoBlogPosts = [
  {
    id: "demo-blog-1",
    slug: "slow-mornings-at-the-resort",
    title: "Slow mornings at the resort",
    category: "Journal",
    authorName: "Resort editorial",
    publishedAt: "2025-09-01",
    excerpt: "How we compose breakfast service, garden walks, and pool hours for guests who travel to reset.",
    content:
      "Morning light moves across the courtyard before the kitchen opens. We keep the first hour of the day unhurried — warm bread, filter coffee, and a short walk through the gardens before the pool deck fills.\n\nFor guests who want structure, the concierge shares a simple rhythm: breakfast, a swim, then spa or a nearby drive after lunch.",
    coverMedia: media(fallbackSrc("about", 0), "Slow mornings"),
  },
  {
    id: "demo-blog-2",
    slug: "chef-seasonal-menu",
    title: "A seasonal menu from our kitchen",
    category: "Dining",
    authorName: "Executive chef",
    publishedAt: "2025-08-15",
    excerpt: "Local produce, fire-kissed plates, and the stories behind this month’s signatures.",
    content:
      "The pavilion menu shifts with what arrives from nearby farms each week. Fire-kissed vegetables, coastal broths, and pastries from our morning bake are staples.\n\nAsk the team about chef’s signatures — they pair well with a late lunch by the pool.",
    coverMedia: media(fallbackSrc("gallery", 3), "Seasonal menu"),
  },
  {
    id: "demo-blog-3",
    slug: "weekend-nearby-drives",
    title: "Weekend drives from the property",
    category: "Nearby",
    authorName: "Guest experience",
    publishedAt: "2025-07-22",
    excerpt: "Three easy day trips our concierge team recommends for first-time visitors.",
    content:
      "Heritage Old Town is a short drive for markets and sunset viewpoints. Forest Ridge Trail suits an early start, and Lake Picnic Point is ideal for a quiet afternoon.\n\nReception can arrange a packed breakfast and route notes before you leave.",
    coverMedia: media(fallbackSrc("gallery", 4), "Nearby drives"),
  },
];

export const demoFaqCategories = [
  {
    id: "demo-faq-stay",
    name: "Stays & check-in",
    faqs: [
      {
        id: "demo-faq-1",
        question: "What time is check-in and check-out?",
        answer: "Check-in from 2:00 PM and check-out by 11:00 AM. Early arrival and late departure are available on request when inventory allows.",
      },
      {
        id: "demo-faq-2",
        question: "Do you offer airport transfers?",
        answer: "Yes. Share your flight details when booking or contact reception 24 hours before arrival to arrange a private transfer.",
      },
    ],
  },
  {
    id: "demo-faq-dining",
    name: "Dining",
    faqs: [
      {
        id: "demo-faq-3",
        question: "Is breakfast included?",
        answer: "Breakfast is included with select packages. À la carte breakfast is served daily from 7:00 AM to 10:30 AM.",
      },
      {
        id: "demo-faq-4",
        question: "Can I reserve a table for dinner?",
        answer: "Absolutely. Use the dining inquiry form or call reception to reserve indoor or garden seating.",
      },
    ],
  },
  {
    id: "demo-faq-booking",
    name: "Bookings & payments",
    faqs: [
      {
        id: "demo-faq-5",
        question: "How do I modify or cancel a booking?",
        answer: "Use the booking lookup page with your reference and email or phone. Our team can also assist by phone during business hours.",
      },
    ],
  },
];

export function demoGalleryItems() {
  return allSiteAssetSources().map((asset, index) => ({
    id: `demo-gallery-${index}`,
    src: asset.src,
    alt: asset.alt,
    caption: asset.alt,
    category: asset.roles.includes("room") ? "rooms" : "facilities",
    href: "/gallery",
  }));
}

export function getDemoAboutPage() {
  const brand = siteConfig.name;
  return {
    title: `About ${brand}`,
    bannerMedia: media(fallbackSrc("about", 0), brand),
    sections: [
      {
        id: "demo-about-1",
        title: "Rooted in place, shaped for calm",
        subtitle: "Our philosophy",
        description:
          "We built this retreat around light, landscape, and generous hospitality — spaces that feel personal without losing the ease of a full-service resort.",
        media: media(fallbackSrc("about", 1), "Resort grounds"),
      },
      {
        id: "demo-about-2",
        title: "Crafted stays & thoughtful dining",
        subtitle: "What we offer",
        description:
          "Rooms and suites composed for restful nights, a kitchen that celebrates regional produce, and wellness rituals that slow the pace of your trip.",
        media: media(fallbackSrc("reception", 0), "Lobby"),
        buttonText: "Explore rooms",
        buttonLink: "/rooms",
      },
      {
        id: "demo-about-3",
        title: "A team that anticipates quietly",
        subtitle: "Service",
        description:
          "From arrival to departure, our hosts focus on the details you should not have to ask for — luggage, dining, celebrations, and day-trip planning.",
        media: media(fallbackSrc("gallery", 5), "Guest experience"),
      },
    ],
  };
}

export function getDemoRestaurant() {
  return {
    id: "demo-restaurant",
    name: "The Garden Pavilion",
    description:
      "Regional plates, fire-kissed mains, and a pastry counter for late afternoons — served beside the pool and under the stars.",
    cuisineTypesJson: ["Indian", "Continental", "Farm-to-table"],
    breakfastTime: "7:00 AM – 10:30 AM",
    lunchTime: "12:30 PM – 3:00 PM",
    dinnerTime: "7:00 PM – 11:00 PM",
    reservationEnabled: true,
    media: [
      { media: media(fallbackSrc("gallery", 2), "Dining room") },
      { media: media(fallbackSrc("gallery", 3), "Chef's table") },
      { media: media(fallbackSrc("gallery", 4), "Dessert") },
    ],
    menuCategories: [
      {
        id: "demo-menu-mains",
        name: "Signatures",
        items: [
          {
            id: "demo-dish-1",
            name: "Coastal curry & pearl barley",
            description: "Coconut broth, charred lime, and herbs from our kitchen garden.",
            price: 680,
            media: media(fallbackSrc("gallery", 6), "Curry"),
          },
          {
            id: "demo-dish-2",
            name: "Wood-fired paneer & flatbread",
            description: "Smoked peppers, pickled onion, and hung yogurt.",
            price: 520,
          },
          {
            id: "demo-dish-3",
            name: "Garden greens & citrus dressing",
            description: "Seasonal leaves, toasted seeds, and goat cheese.",
            price: 420,
          },
        ],
      },
      {
        id: "demo-menu-dessert",
        name: "Dessert & coffee",
        items: [
          {
            id: "demo-dish-4",
            name: "Palm jaggery tart",
            description: "Vanilla bean cream and cacao nib brittle.",
            price: 360,
          },
          {
            id: "demo-dish-5",
            name: "Filter coffee & petit fours",
            description: "Single-origin pour-over with daily pastries.",
            price: 280,
          },
        ],
      },
    ],
  };
}

export const demoJournalArticles = [
  {
    id: "demo-journal-1",
    category: "Journal",
    readTime: "4 min read",
    title: "Designing rooms for morning light",
    href: "/journal",
    accent: "lime",
    imageSrc: fallbackSrc("room", 0),
    imageAlt: "Morning light in guest room",
  },
  {
    id: "demo-journal-2",
    category: "Dining",
    readTime: "3 min read",
    title: "Behind the weekend brunch menu",
    href: "/restaurant",
    accent: "warm",
    imageSrc: fallbackSrc("gallery", 2),
    imageAlt: "Brunch spread",
  },
  {
    id: "demo-journal-3",
    category: "Nearby",
    readTime: "5 min read",
    title: "Sunset drives our guests love",
    href: "/attractions",
    accent: "green",
    imageSrc: fallbackSrc("gallery", 4),
    imageAlt: "Scenic drive",
  },
];

export const demoRoomAmenities = [
  "High-speed Wi‑Fi",
  "Smart climate control",
  "Rain shower",
  "In-room safe",
  "Daily housekeeping",
  "24-hour room service",
];

export function findDemoRoom(slug) {
  return demoRooms.find((item) => item.slug === slug) || null;
}

export function findDemoFacility(slug) {
  return demoFacilities.find((item) => item.slug === slug) || null;
}

export function findDemoAttraction(slug) {
  return demoAttractions.find((item) => item.slug === slug) || null;
}

export function findDemoEvent(slug) {
  return demoEvents.find((item) => item.slug === slug) || null;
}

export function findDemoPackage(slug) {
  return demoPackages.find((item) => item.slug === slug) || null;
}

export function findDemoBlog(slug) {
  return demoBlogPosts.find((item) => item.slug === slug) || null;
}

export const demoContactSettings = {
  phone: "+91 98765 43210",
  email: "reservations@hotellms.example",
  whatsapp: "+91 98765 43210",
  address: "12 Palm Grove Road, Green Valley, Karnataka 560001, India",
  receptionHours: "Front desk open 24 hours",
  mapUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d500!2d77.5946!3d12.9716!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTLCsDU4JzE3LjgiTiA3N8KwMzUnNDAuNiJF!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin",
  websiteName: siteConfig.name,
};

const demoPoliciesBySlug = {
  privacy: {
    title: "Privacy Policy",
    type: "Legal",
    content:
      "We collect contact details and stay preferences to confirm reservations and improve service. Data is stored securely and shared only with payment and email providers required to operate your booking.\n\nYou may request access or deletion of personal data by contacting reception.",
  },
  terms: {
    title: "Terms & Conditions",
    type: "Legal",
    content:
      "Reservations are confirmed upon written confirmation or successful payment. Rates are quoted in INR unless stated otherwise. Guests are responsible for charges incurred during their stay.\n\nThe property may refuse service in cases of safety concerns or policy violations.",
  },
  cancellation: {
    title: "Cancellation Policy",
    type: "Stays",
    content:
      "Cancellations made 48 hours or more before check-in receive a full refund of prepaid amounts. Later cancellations may incur one night’s charge.\n\nNo-shows are charged in full for the reserved stay period.",
  },
  refund: {
    title: "Refund Policy",
    type: "Payments",
    content:
      "Eligible refunds are returned to the original payment method within 7–10 business days. Pay-at-hotel bookings are settled at checkout.\n\nPartial refunds may apply when packages include non-refundable inclusions.",
  },
  "hotel-rules": {
    title: "Hotel Rules",
    type: "Property",
    content:
      "Quiet hours begin at 10:00 PM. Smoking is permitted only in designated outdoor areas. Pets are welcome in select rooms with prior notice.\n\nGuests must present valid ID at check-in.",
  },
  "check-in-check-out": {
    title: "Check-in / Check-out",
    type: "Stays",
    content:
      "Check-in from 2:00 PM · Check-out by 11:00 AM. Early arrival and late departure are subject to availability.\n\nLuggage storage and express checkout are available at reception.",
  },
};

export function findDemoPolicy(slug) {
  const policy = demoPoliciesBySlug[slug];
  if (!policy) return null;
  return {
    id: `demo-policy-${slug}`,
    slug,
    ...policy,
    updatedAt: "2025-01-15",
  };
}
