"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, BedDouble, CalendarDays, CheckCircle2, X } from "lucide-react";
import AdminLoginForm from "@/components/admin/AdminLoginForm";
import LoadingState from "@/components/ui/LoadingState";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { fallbackSrc } from "@/lib/site-assets";

const WEEK = [
  { day: "Sun", date: "22" },
  { day: "Mon", date: "23" },
  { day: "Tue", date: "24" },
  { day: "Wed", date: "25", active: true },
  { day: "Thu", date: "26" },
  { day: "Fri", date: "27" },
  { day: "Sat", date: "28" },
];

export default function AdminLoginPage() {
  const { admin, loading } = useAdminAuth();
  const router = useRouter();
  const heroSrc = fallbackSrc("reception", 0) || fallbackSrc("hero", 0);
  const avatarA = fallbackSrc("gallery", 10);
  const avatarB = fallbackSrc("gallery", 11);
  const avatarC = fallbackSrc("room", 0);

  useEffect(() => {
    if (!loading && admin) router.replace("/admin");
  }, [admin, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f1e8]">
        <LoadingState label="Loading" />
      </div>
    );
  }

  if (admin) return null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#eceae4] px-4 py-6 md:px-6 md:py-10">
      <div className="relative grid w-full max-w-6xl overflow-hidden rounded-[2rem] bg-[linear-gradient(145deg,#fffef9_0%,#fff7e4_48%,#ffe9b8_120%)] shadow-[0_30px_80px_rgba(28,25,23,0.12)] lg:grid-cols-[1.05fr_0.95fr]">
        {/* Left — form */}
        <div className="flex flex-col px-6 py-7 sm:px-10 sm:py-10 lg:px-12 lg:py-12">
          <div className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center rounded-full border border-[#d9d4c6] bg-white/70 px-4 py-1.5 text-sm font-semibold tracking-wide text-ink">
              HotelMS
            </span>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-full border border-[#d9d4c6] bg-white/70 px-3 py-1.5 text-xs font-medium text-[#5c5a52] transition hover:border-[#c99212] hover:text-ink"
            >
              <ArrowLeft className="size-3.5" aria-hidden />
              Back to website
            </Link>
          </div>

          <div className="mt-10 max-w-md">
            <h1 className="font-display text-4xl tracking-tight text-ink md:text-[2.75rem]">
              Welcome back
            </h1>
            <p className="mt-2 text-base text-[#6b675c]">
              Sign in to the operations dashboard and manage stays, rooms, and guests.
            </p>
          </div>

          <div className="mt-8 max-w-md flex-1">
            <AdminLoginForm />
          </div>
        </div>

        {/* Right — image + floating cards */}
        <div className="relative min-h-[340px] p-4 sm:p-5 lg:min-h-full lg:p-6">
          <div className="relative h-full min-h-[320px] overflow-hidden rounded-[1.75rem] lg:min-h-[560px]">
            <Image
              src={heroSrc}
              alt="Hotel lobby and guest experience"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/10" />

            <Link
              href="/"
              aria-label="Close and return to website"
              className="absolute top-4 right-4 z-20 inline-flex size-10 items-center justify-center rounded-full bg-white/90 text-ink shadow-md backdrop-blur transition hover:scale-105"
            >
              <X className="size-4" />
            </Link>

            {/* Floating ops widgets */}
            <div className="absolute top-5 left-4 z-10 max-w-[220px] rounded-2xl bg-[#f5c842] px-4 py-3 text-[#1c1917] shadow-[0_14px_30px_rgba(0,0,0,0.18)] sm:left-6">
              <p className="text-xs font-semibold uppercase tracking-wide opacity-80">Front desk</p>
              <p className="mt-1 text-sm font-semibold leading-snug">Guest check-in walkthrough</p>
              <p className="mt-1 text-xs opacity-80">09:30am – 10:00am</p>
            </div>

            <div className="absolute top-[38%] right-4 z-10 flex -space-x-2 sm:right-8">
              {[avatarA, avatarB, avatarC].map((src, index) => (
                <span
                  key={`${src}-${index}`}
                  className="relative size-10 overflow-hidden rounded-full border-2 border-white shadow-md"
                >
                  <Image src={src} alt="" fill className="object-cover" sizes="40px" />
                </span>
              ))}
            </div>

            <div className="absolute right-4 bottom-[42%] left-4 z-10 overflow-hidden rounded-2xl border border-white/40 bg-white/25 px-3 py-3 shadow-[0_12px_40px_rgba(0,0,0,0.18)] backdrop-blur-md sm:left-auto sm:w-[min(100%,320px)]">
              <div className="grid grid-cols-7 gap-1 text-center text-white">
                {WEEK.map((item) => (
                  <div
                    key={item.day}
                    className={
                      item.active
                        ? "rounded-xl bg-white/90 px-1 py-1.5 text-ink shadow-sm"
                        : "rounded-xl px-1 py-1.5 text-white/90"
                    }
                  >
                    <p className="text-[10px] font-medium opacity-80">{item.day}</p>
                    <p className="text-sm font-semibold">{item.date}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="absolute bottom-5 left-4 z-10 w-[min(100%,240px)] rounded-2xl bg-white/95 px-4 py-3 shadow-[0_14px_30px_rgba(0,0,0,0.2)] backdrop-blur sm:left-6">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 rounded-xl bg-[#fff4cc] p-2 text-[#9a6b2f]">
                  <CalendarDays className="size-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-ink">Daily briefing</p>
                  <p className="text-xs text-muted">12:00pm – 01:00pm</p>
                  <div className="mt-2 flex items-center gap-2 text-[11px] text-[#5c5a52]">
                    <CheckCircle2 className="size-3.5 text-[#15803d]" />
                    Housekeeping synced
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute right-4 bottom-5 z-10 hidden rounded-2xl bg-[#1c1917]/85 px-3 py-2.5 text-white shadow-lg backdrop-blur sm:flex sm:items-center sm:gap-2">
              <BedDouble className="size-4 text-[#f5c842]" />
              <div>
                <p className="text-[11px] opacity-80">Occupancy</p>
                <p className="text-sm font-semibold">Live ops ready</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
