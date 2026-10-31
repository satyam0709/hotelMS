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

function FacebookIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
    </svg>
  );
}

function InstagramIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

function TwitterXIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function YouTubeIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

const SOCIAL_NETWORKS = [
  {
    key: "facebook",
    label: "Facebook",
    href: "https://facebook.com/",
    Icon: FacebookIcon,
    match: /facebook|fb|\bf\b/i,
  },
  {
    key: "instagram",
    label: "Instagram",
    href: "https://instagram.com/",
    Icon: InstagramIcon,
    match: /instagram|insta|\bi\b/i,
  },
  {
    key: "twitter",
    label: "X (Twitter)",
    href: "https://twitter.com/",
    Icon: TwitterXIcon,
    match: /twitter|x\.com|\bx\b/i,
  },
  {
    key: "youtube",
    label: "YouTube",
    href: "https://youtube.com/",
    Icon: YouTubeIcon,
    match: /youtube|yt/i,
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
    <div className="mt-5 flex flex-wrap items-center gap-3">
      {items.map((item) => {
        const Icon = item.Icon;
        return (
          <a
            key={item.key}
            href={item.href}
            target="_blank"
            rel="noreferrer"
            aria-label={item.label}
            title={item.label}
            className="group flex size-10 items-center justify-center rounded-full border border-line bg-surface text-ink/70 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-green hover:bg-brand-green hover:text-white hover:shadow-md"
          >
            <Icon className="size-4.5 transition-transform duration-200 group-hover:scale-110" />
          </a>
        );
      })}
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
  const logoSrc = mediaUrl(logo) || "/assets/logo.jpg";

  return (
    <motion.footer
      className="border-t border-line bg-[#f4f3ee]"
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.12 }}
      variants={containerVariants}
    >
      <Container className="py-10 md:py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8 items-start">
          {/* Brand Column */}
          <motion.div variants={itemVariants} className="sm:col-span-2 lg:col-span-4 flex flex-col items-start">
            <Link href="/" className="inline-flex items-center gap-3 group">
              <div className="relative flex h-9 w-auto items-center">
                <Image
                  src={logoSrc}
                  alt={mediaAlt(logo, `${brand} Logo`)}
                  width={140}
                  height={38}
                  className="h-8 md:h-9 w-auto max-w-[150px] object-contain object-left transition-transform group-hover:scale-[1.02]"
                  priority={false}
                />
              </div>
            </Link>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted font-normal">
              A calm retreat for unhurried mornings and thoughtful stays.
            </p>

            <div className="mt-5 space-y-3">
              {settings?.phone ? (
                <div>
                  <p className="text-xs font-semibold tracking-wider text-ink uppercase">Call us</p>
                  <a
                    href={`tel:${settings.phone}`}
                    className="mt-0.5 inline-flex items-center gap-2 text-sm text-ink/80 transition-colors hover:text-brand-green"
                  >
                    <Phone className="size-3.5 shrink-0 text-brand-green" />
                    {settings.phone}
                  </a>
                </div>
              ) : null}
              {settings?.email ? (
                <div>
                  <p className="text-xs font-semibold tracking-wider text-ink uppercase">Email</p>
                  <a
                    href={`mailto:${settings.email}`}
                    className="mt-0.5 inline-flex items-center gap-2 text-sm text-ink/80 transition-colors hover:text-brand-green"
                  >
                    <Mail className="size-3.5 shrink-0 text-brand-green" />
                    {settings.email}
                  </a>
                </div>
              ) : null}
            </div>
          </motion.div>

          {/* Quick Links Column */}
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <h2 className="text-xs font-semibold tracking-wider text-ink uppercase">Quick links</h2>
            <FooterLinkList items={quickLinks} />
          </motion.div>

          {/* Packages Column */}
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <h2 className="text-xs font-semibold tracking-wider text-ink uppercase">Packages</h2>
            <FooterLinkList items={packageLinks} />
          </motion.div>

          {/* Support Column */}
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <h2 className="text-xs font-semibold tracking-wider text-ink uppercase">Support</h2>
            <FooterLinkList items={supportLinks} />
          </motion.div>

          {/* Connect / Newsletter Column */}
          <motion.div variants={itemVariants} className="sm:col-span-2 lg:col-span-2 flex flex-col">
            <h2 className="text-xs font-semibold tracking-wider text-ink uppercase">Connect</h2>
            <SocialButtons socials={socials} />

            <h2 className="mt-6 text-xs font-semibold tracking-wider text-ink uppercase">
              Newsletter
            </h2>
            <p className="mt-1.5 text-xs leading-relaxed text-muted">
              Seasonal offers and stay inspiration.
            </p>
            <NewsletterForm className="mt-3" layout="stack" />
          </motion.div>
        </div>
      </Container>

      <div className="border-t border-line/80 bg-[#eeede8]">
        <Container className="flex flex-col gap-2 py-5 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>{copyright}</p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <p>Crafted for calm, considered hospitality.</p>
            <span className="hidden text-line sm:inline">•</span>
            <p>
              Design &amp; Developed by{" "}
              <a
                href="https://rndtechnosoft.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-ink transition-colors hover:text-brand-green"
              >
                RnD Technosoft
              </a>
            </p>
          </div>
        </Container>
      </div>
    </motion.footer>
  );
}
