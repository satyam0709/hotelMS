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
      className="fixed right-3 bottom-3 z-40 flex flex-col items-end gap-2.5 sm:right-5 sm:bottom-5 pointer-events-none"
      aria-label="Quick booking contact"
    >
      {callDigits ? (
        <a
          href={`tel:${callDigits}`}
          aria-label="Call to book"
          className="pointer-events-auto inline-flex size-11 sm:size-12 items-center justify-center rounded-full border border-line bg-elevated/95 text-ink shadow-[0_8px_24px_rgba(26,46,10,0.14)] backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-accent hover:text-accent hover:shadow-[0_12px_28px_rgba(44,103,0,0.22)] active:scale-95"
        >
          <Phone className="size-5" strokeWidth={2} />
        </a>
      ) : null}
      {waHref ? (
        <a
          href={waHref}
          target="_blank"
          rel="noreferrer"
          aria-label="WhatsApp booking enquiry"
          className="pointer-events-auto inline-flex size-11 sm:size-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_8px_24px_rgba(37,211,102,0.3)] backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:bg-[#20ba5a] hover:shadow-[0_12px_28px_rgba(37,211,102,0.4)] active:scale-95"
        >
          <MessageCircle className="size-5 sm:size-5.5" />
        </a>
      ) : null}
    </div>
  );
}
