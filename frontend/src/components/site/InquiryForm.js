"use client";

import { useCallback, useState, useTransition } from "react";
import Button from "@/components/ui/Button";
import FormFeedback from "@/components/ui/FormFeedback";
import Input from "@/components/ui/Input";
import TurnstileWidget, { isTurnstileEnabled } from "@/components/site/TurnstileWidget";
import { createInquiry } from "@/lib/api/content";
import { cn } from "@/lib/utils";

const TYPES = [
  { value: "CONTACT", label: "General contact" },
  { value: "BOOKING", label: "Booking help" },
  { value: "RESTAURANT", label: "Dining" },
  { value: "EVENT", label: "Events" },
  { value: "PACKAGE", label: "Packages" },
  { value: "GENERAL", label: "Other" },
];

export default function InquiryForm({
  defaultType = "CONTACT",
  className,
  sourceRefType,
  sourceRefId,
}) {
  const [type, setType] = useState(defaultType);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [status, setStatus] = useState("idle");
  const [feedback, setFeedback] = useState("");
  const [isPending, startTransition] = useTransition();
  const turnstileOn = isTurnstileEnabled();
  const onToken = useCallback((token) => setCaptchaToken(token || ""), []);

  function onSubmit(event) {
    event.preventDefault();
    setStatus("idle");
    setFeedback("");

    if (!email.trim() && !phone.trim()) {
      setStatus("error");
      setFeedback("Please provide an email or phone number.");
      return;
    }

    if (turnstileOn && !captchaToken) {
      setStatus("error");
      setFeedback("Please complete the CAPTCHA verification.");
      return;
    }

    startTransition(async () => {
      try {
        await createInquiry({
          type,
          name: name.trim(),
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          subject: subject.trim() || null,
          message: message.trim(),
          sourceRefType: sourceRefType || null,
          sourceRefId: sourceRefId || null,
          ...(captchaToken ? { captchaToken } : {}),
        });
        setStatus("success");
        setFeedback("Thank you. Our team will get back to you shortly.");
        setName("");
        setEmail("");
        setPhone("");
        setSubject("");
        setMessage("");
        setCaptchaToken("");
      } catch (error) {
        setStatus("error");
        setFeedback(error.message || "Unable to send your message right now.");
      }
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className={cn(
        "rounded-[1.75rem] border border-line bg-elevated p-5 shadow-soft md:p-6",
        className
      )}
    >
      <p className="text-xs font-semibold tracking-[0.18em] text-accent uppercase">
        Send a message
      </p>
      <h2 className="mt-2 font-display text-2xl text-ink md:text-3xl">
        We would love to hear from you
      </h2>
      <p className="mt-2 text-sm text-muted">
        Share your dates or question and our team will reply shortly.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <label className="flex w-full flex-col gap-1.5 sm:col-span-2">
          <span className="text-xs font-medium tracking-[0.08em] text-muted uppercase">
            Inquiry type
          </span>
          <select
            name="type"
            value={type}
            onChange={(event) => setType(event.target.value)}
            className="h-12 w-full rounded-xl border border-line bg-elevated px-4 text-sm text-ink outline-none transition-[border-color,box-shadow] focus:border-accent focus:shadow-[0_0_0_3px_var(--focus-ring)]"
          >
            {TYPES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <Input
          label="Full name"
          name="name"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="sm:col-span-2"
        />
        <Input
          label="Email"
          type="email"
          name="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Email address"
        />
        <Input
          label="Mobile"
          type="tel"
          name="phone"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          placeholder="+91…"
        />
        <Input
          label="Subject"
          name="subject"
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
          className="sm:col-span-2"
        />
        <label className="flex w-full flex-col gap-1.5 sm:col-span-2">
          <span className="text-xs font-medium tracking-[0.08em] text-muted uppercase">
            Message
          </span>
          <textarea
            name="message"
            required
            rows={5}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            className="w-full rounded-xl border border-line bg-elevated px-4 py-3 text-sm text-ink outline-none transition-[border-color,box-shadow] placeholder:text-muted/70 focus:border-accent focus:shadow-[0_0_0_3px_var(--focus-ring)]"
            placeholder="How can we help?"
          />
        </label>
      </div>

      {turnstileOn ? (
        <TurnstileWidget onToken={onToken} className="mt-4" />
      ) : null}

      <FormFeedback status={status} message={feedback} />

      <Button type="submit" className="mt-5 w-full sm:w-auto" disabled={isPending}>
        {isPending ? "Sending…" : "Submit inquiry"}
      </Button>
    </form>
  );
}
