"use client";

import Image from "next/image";
import Link from "next/link";
import { Mail, Phone } from "lucide-react";
import { motion } from "motion/react";
import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import NewsletterForm from "@/components/site/NewsletterForm";
import { containerVariants, itemVariants } from "@/lib/motion/presets";
import { mediaAlt, mediaUrl } from "@/lib/utils";

const SOCIAL_NETWORKS = [
  {
    key: "facebook",
    label: "Facebook",
    href: "https://facebook.com/",
    icon: "/assets/fb-icon.webp",
    match: /facebook|fb|\bf\b/i,
  },
  {
    key: "instagram",
    label: "Instagram",
    href: "https://instagram.com/",
    icon: "/assets/insta-icon.webp",
    match: /instagram|insta|\bi\b/i,
  },
  {
    key: "twitter",
    label: "Twitter",
    href: "https://twitter.com/",
    icon: "/assets/twitter-icon-sm.webp",
    match: /twitter|x\.com|\bx\b/i,
  },
];

function FooterLinkList({ items }) {
  return (
    <ul className="mt-4 space-y-2.5">
      {items.map((item) => (
        <li key={item.id || item.href}>
          <Link
            href={item.href}
            className="text-sm text-ink/75 transition-colors hover:text-brand-green"
          >
            {item.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function resolveSocials(socials = []) {
  return SOCIAL_NETWORKS.map((network) => {
    const found = socials.find((item) => {
      const label = String(item.label || "").trim();
      const href = String(item.href || "");
      return network.match.test(label) || network.match.test(href);
    });
    return {
      ...network,
      href: found?.href || network.href,
    };
  });
}

function SocialButtons({ socials }) {
  const items = resolveSocials(socials);

  return (
    <div className="mt-5 flex flex-wrap items-center gap-3.5">
      {items.map((item) => (
        <a
          key={item.key}
          href={item.href}
          target="_blank"
          rel="noreferrer"
          aria-label={item.label}
          title={item.label}
          className="group relative block size-12 overflow-hidden rounded-full shadow-[0_10px_24px_rgba(26,32,24,0.1)] ring-1 ring-black/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_32px_rgba(45,106,79,0.22)] hover:ring-2 hover:ring-brand-green/50"
        >
          <Image
            src={item.icon}
            alt={item.label}
            width={48}
            height={48}
            className="size-full object-cover transition-transform duration-300 group-hover:scale-110"
            unoptimized
          />
        </a>
      ))}
    </div>
  );
}

export default function FooterContent({
  brand,
  settings,
  quickLinks,
  packageLinks,
  supportLinks,
  socials,
  copyright,
}) {
  const logo = settings?.footerLogoMedia || settings?.headerLogoMedia || settings?.logoMedia;
  const logoSrc = mediaUrl(logo);

  return (
    <motion.footer
      className="border-t border-line bg-[#f4f3ee]"
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.12 }}
      variants={containerVariants}
    >
      <Container className="section-pad">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 xl:gap-8">
          <motion.div variants={itemVariants} className="sm:col-span-2 lg:col-span-1 xl:col-span-1">
            <Link href="/" className="inline-flex items-center gap-3">
              {logoSrc ? (
                <Image
                  src={logoSrc}
                  alt={mediaAlt(logo, brand)}
                  width={120}
                  height={40}
                  className="h-10 w-auto max-w-[140px] object-contain object-left"
                />
              ) : (
                <span className="font-display text-2xl text-ink md:text-3xl">{brand}</span>
              )}
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted">
              A calm retreat for unhurried mornings and thoughtful stays.
            </p>

            <div className="mt-6 space-y-4">
              {settings?.phone ? (
                <div>
                  <p className="text-sm font-semibold text-ink">Call us</p>
                  <a
                    href={`tel:${settings.phone}`}
                    className="mt-1 flex items-center gap-2 text-sm text-ink/80 hover:text-brand-green"
                  >
                    <Phone className="size-4 shrink-0" />
                    {settings.phone}
                  </a>
                </div>
              ) : null}
              {settings?.email ? (
                <div>
                  <p className="text-sm font-semibold text-ink">Email</p>
                  <a
                    href={`mailto:${settings.email}`}
                    className="mt-1 flex items-center gap-2 text-sm text-ink/80 hover:text-brand-green"
                  >
                    <Mail className="size-4 shrink-0" />
                    {settings.email}
                  </a>
                </div>
              ) : null}
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <h2 className="text-sm font-semibold text-ink">Quick links</h2>
            <FooterLinkList items={quickLinks} />
          </motion.div>

          <motion.div variants={itemVariants}>
            <h2 className="text-sm font-semibold text-ink">Packages</h2>
            <FooterLinkList items={packageLinks} />
          </motion.div>

          <motion.div variants={itemVariants}>
            <h2 className="text-sm font-semibold text-ink">Support</h2>
            <FooterLinkList items={supportLinks} />
          </motion.div>

          <motion.div variants={itemVariants} className="sm:col-span-2 lg:col-span-1 xl:col-span-1">
            <h2 className="text-sm font-semibold text-ink">Connect with us</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Follow along for seasonal stays and resort moments.
            </p>
            <SocialButtons socials={socials} />

            <h2 className="mt-8 text-sm font-semibold text-ink">
              Newsletter
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Seasonal offers and stay inspiration.
            </p>
            <NewsletterForm className="mt-4" layout="stack" />

            <div className="mt-8">
              <p className="text-sm font-semibold text-ink">Book your stay</p>
              <Button href="/booking" className="mt-3 w-full sm:w-auto">
                Reserve now
              </Button>
              <p className="mt-2 text-xs text-muted">Secure checkout when online pay is enabled.</p>
            </div>
          </motion.div>
        </div>
      </Container>

      <div className="border-t border-line/80 bg-[#eeede8]">
        <Container className="flex flex-col gap-2 py-5 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>{copyright}</p>
          <p>Crafted for calm, considered hospitality.</p>
        </Container>
      </div>
    </motion.footer>
  );
}
