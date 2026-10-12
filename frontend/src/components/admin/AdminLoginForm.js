"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { useAdminAuth } from "@/contexts/AdminAuthContext";

export default function AdminLoginForm() {
  const { login } = useAdminAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function onSubmit(event) {
    event.preventDefault();
    setError("");

    startTransition(async () => {
      try {
        await login({ email: email.trim(), password });
        router.replace(nextPath.startsWith("/admin") ? nextPath : "/admin");
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Login failed.");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <label className="block">
        <span className="mb-2 block text-sm font-medium text-[#5c5a52]">Email</span>
        <input
          id="admin-email"
          name="email"
          type="email"
          autoComplete="username"
          required
          placeholder="admin@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="h-14 w-full rounded-full border border-[#e8e4d8] bg-white px-5 text-sm text-ink shadow-[0_2px_10px_rgba(28,25,23,0.04)] outline-none transition focus:border-[#d4a017] focus:shadow-[0_0_0_4px_rgba(212,160,23,0.18)]"
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-medium text-[#5c5a52]">Password</span>
        <div className="relative">
          <input
            id="admin-password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            placeholder="••••••••••••"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="h-14 w-full rounded-full border border-[#e8e4d8] bg-white px-5 pr-12 text-sm text-ink shadow-[0_2px_10px_rgba(28,25,23,0.04)] outline-none transition focus:border-[#d4a017] focus:shadow-[0_0_0_4px_rgba(212,160,23,0.18)]"
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            className="absolute top-1/2 right-4 -translate-y-1/2 rounded-full p-1 text-[#8a8678] transition hover:text-ink"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </label>

      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="ui-button-motion relative h-14 w-full overflow-hidden rounded-full bg-[linear-gradient(135deg,#f5c842_0%,#e0a820_55%,#c99212_100%)] text-base font-semibold text-[#1c1917] shadow-[0_12px_28px_rgba(201,146,18,0.35)] transition hover:brightness-105 disabled:opacity-60"
      >
        <span className="relative z-[3]">{isPending ? "Signing in…" : "Sign in"}</span>
      </button>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-sm text-[#6b675c]">
        <p>
          Staff access only.{" "}
          <Link href="/admin/forgot-password" className="font-medium text-ink underline underline-offset-2">
            Forgot password?
          </Link>
        </p>
        <Link href="/policies/terms" className="font-medium text-ink underline underline-offset-2">
          Terms & Conditions
        </Link>
      </div>
    </form>
  );
}
