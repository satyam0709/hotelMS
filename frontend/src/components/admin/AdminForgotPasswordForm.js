"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { adminForgotPassword } from "@/lib/api/admin-auth";
import { ApiError } from "@/lib/api/client";

export default function AdminForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function onSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    startTransition(async () => {
      try {
        await adminForgotPassword(email.trim());
        setMessage("If an account exists for that email, a reset link has been sent.");
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Unable to request a reset.");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label htmlFor="forgot-email" className="text-sm font-medium text-ink">
          Email
        </label>
        <Input
          id="forgot-email"
          name="email"
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-2"
        />
      </div>
      {error ? (
        <p className="text-sm text-red-600" role="alert">{error}</p>
      ) : null}
      {message ? (
        <p className="text-sm text-accent" role="status">{message}</p>
      ) : null}
      <Button type="submit" variant="bronze" className="w-full rounded-xl" disabled={isPending}>
        {isPending ? "Sending…" : "Send reset link"}
      </Button>
      <p className="text-center text-xs text-muted">
        <Link href="/admin/login" className="font-medium text-accent underline-offset-2 hover:underline">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
