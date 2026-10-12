import { MessageCircle, Phone } from "lucide-react";
import { siteConfig } from "@/lib/config";

function digitsOnly(value) {
  return String(value || "").replace(/\D/g, "");
}

function whatsappHref(number, message) {
  const normalized = digitsOnly(number);
  if (!normalized) return null;
  const text = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${normalized}${text}`;
}

export default function BookingContactFab({
  phone,
  whatsapp,
  brandName = siteConfig.name,
}) {
  const callNumber = phone || whatsapp;
  const waNumber = whatsapp || phone;
  const callDigits = digitsOnly(callNumber);
  const waHref = whatsappHref(
    waNumber,
    `Hello ${brandName}, I would like help with a room booking.`,
  );

  if (!callDigits && !waHref) return null;

  return (
    <div
      className="fixed right-4 bottom-4 z-40 flex flex-col items-end gap-3 md:right-6 md:bottom-6"
      aria-label="Quick booking contact"
    >
      {callDigits ? (
        <a
          href={`tel:${callDigits}`}
          aria-label="Call to book"
          className="inline-flex size-14 items-center justify-center rounded-full border border-line bg-elevated text-ink shadow-soft transition-transform hover:scale-105 hover:border-accent hover:text-accent"
        >
          <Phone className="size-6" strokeWidth={2} />
        </a>
      ) : null}
      {waHref ? (
        <a
          href={waHref}
          target="_blank"
          rel="noreferrer"
          aria-label="WhatsApp booking enquiry"
          className="inline-flex size-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-soft transition-transform hover:scale-105"
        >
          <MessageCircle className="size-6" />
        </a>
      ) : null}
    </div>
  );
}
