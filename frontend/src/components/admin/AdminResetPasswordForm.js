"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { adminResetPassword } from "@/lib/api/admin-auth";
import { ApiError } from "@/lib/api/client";

export default function AdminResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function onSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!token || !/^[a-f\d]{64}$/i.test(token)) {
      setError("Reset link is missing or invalid. Request a new one.");
      return;
    }
    if (password.length < 12) {
      setError("Password must be at least 12 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    startTransition(async () => {
      try {
        await adminResetPassword({ token, password });
        setMessage("Password updated. You can sign in now.");
        setTimeout(() => router.replace("/admin/login"), 1200);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Unable to reset password.");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label htmlFor="reset-password" className="text-sm font-medium text-ink">
          New password
        </label>
        <Input
          id="reset-password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={12}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mt-2"
        />
      </div>
      <div>
        <label htmlFor="reset-confirm" className="text-sm font-medium text-ink">
          Confirm password
        </label>
        <Input
          id="reset-confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
          minLength={12}
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
          className="mt-2"
        />
      </div>
      {!token ? (
        <p className="rounded-lg bg-red-50 p-2.5 text-xs text-red-600" role="alert">
          Reset token is missing from this link. Please request a new password reset link.
        </p>
      ) : null}
      {error ? (
        <p className="text-sm text-red-600" role="alert">{error}</p>
      ) : null}
      {message ? (
        <p className="text-sm text-accent" role="status">{message}</p>
      ) : null}
      <Button type="submit" variant="bronze" className="w-full rounded-xl" disabled={isPending || !token}>
        {isPending ? "Saving…" : "Set new password"}
      </Button>
      <p className="text-center text-xs text-muted">
        <Link href="/admin/forgot-password" className="hover:text-accent">Request a new link</Link>
        {" · "}
        <Link href="/admin/login" className="hover:text-accent">Sign in</Link>
      </p>
    </form>
  );
}
