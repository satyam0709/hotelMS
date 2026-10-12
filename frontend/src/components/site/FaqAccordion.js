"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown } from "lucide-react";
import { smoothSpring } from "@/lib/motion/presets";
import { cn } from "@/lib/utils";

function FaqItem({ faq, open, onToggle }) {
  return (
    <div className="border-b border-line last:border-b-0">
      <motion.button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        whileHover={{ x: 4 }}
        whileTap={{ scale: 0.99 }}
        transition={smoothSpring}
        className="flex w-full items-center justify-between gap-4 rounded-xl py-4 text-left transition-colors hover:bg-brand-warm/30"
      >
        <span className="font-medium text-ink md:text-lg">{faq.question}</span>
        <ChevronDown
          className={cn(
            "size-5 shrink-0 text-muted transition-transform duration-300",
            open && "rotate-180 text-accent"
          )}
        />
      </motion.button>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={smoothSpring}
            className="overflow-hidden"
          >
            <p className="pb-5 text-sm leading-relaxed text-muted md:text-base whitespace-pre-line">
              {faq.answer}
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export default function FaqAccordion({ categories = [] }) {
  const [openId, setOpenId] = useState(null);

  if (!categories.length) return null;

  return (
    <div className="space-y-8">
      {categories.map((category) => {
        const faqs = Array.isArray(category.faqs) ? category.faqs : [];
        if (!faqs.length) return null;
        return (
          <section key={category.id} className="rounded-[1.75rem] border border-line bg-elevated px-5 md:px-6">
            <h2 className="border-b border-line py-5 font-display text-2xl text-ink">
              {category.name}
            </h2>
            <div>
              {faqs.map((faq) => (
                <FaqItem
                  key={faq.id}
                  faq={faq}
                  open={openId === faq.id}
                  onToggle={() => setOpenId((current) => (current === faq.id ? null : faq.id))}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
