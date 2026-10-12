"use client";

import { useCallback, useState, useTransition } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import TurnstileWidget, { isTurnstileEnabled } from "@/components/site/TurnstileWidget";
import { subscribeNewsletter } from "@/lib/api/content";

export default function NewsletterForm({ className, layout = "inline" }) {
  const [email, setEmail] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const turnstileOn = isTurnstileEnabled();
  const onToken = useCallback((token) => setCaptchaToken(token || ""), []);

  function onSubmit(event) {
    event.preventDefault();
    setStatus("idle");
    setMessage("");

    if (turnstileOn && !captchaToken) {
      setStatus("error");
      setMessage("Please complete the CAPTCHA verification.");
      return;
    }

    startTransition(async () => {
      try {
        await subscribeNewsletter(email.trim(), captchaToken || undefined);
        setStatus("success");
        setMessage("You are subscribed. Welcome aboard.");
        setEmail("");
        setCaptchaToken("");
      } catch (error) {
        setStatus("error");
        setMessage(error.message || "Unable to subscribe right now.");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className={className}>
      <div className={layout === "stack" ? "flex flex-col gap-3" : "flex flex-col gap-3 sm:flex-row"}>
        <Input
          type="email"
          name="email"
          required
          autoComplete="email"
          placeholder="Your email address"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="flex-1"
          aria-label="Email address"
        />
        <Button type="submit" disabled={isPending} className={layout === "stack" ? "w-full" : "sm:min-w-36"}>
          {isPending ? "Joining…" : "Subscribe"}
        </Button>
      </div>
      {turnstileOn ? (
        <TurnstileWidget onToken={onToken} className="mt-3" />
      ) : null}
      {message ? (
        <p
          className={`mt-3 text-sm ${status === "error" ? "text-danger" : "text-success"}`}
          role="status"
        >
          {message}
        </p>
      ) : null}
    </form>
  );
}
