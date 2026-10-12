"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import LoadingState from "@/components/ui/LoadingState";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { hasPermission } from "@/lib/admin/permissions";
import { requiredPermissionForPath } from "@/lib/admin/nav";

export default function AdminAuthGate({ children }) {
  const { admin, loading } = useAdminAuth();
  const router = useRouter();
  const pathname = usePathname();

  const requiredPermission = useMemo(
    () => requiredPermissionForPath(pathname || "/admin"),
    [pathname],
  );

  const forbidden = Boolean(
    admin && requiredPermission && !hasPermission(admin, requiredPermission),
  );

  useEffect(() => {
    if (loading) return;
    if (!admin) {
      router.replace(`/admin/login?next=${encodeURIComponent(pathname || "/admin")}`);
    }
  }, [admin, loading, pathname, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-green">
        <LoadingState label="Checking session" className="text-white/80" />
      </div>
    );
  }

  if (!admin) return null;

  if (forbidden) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-canvas px-6 text-center">
        <p className="text-xs font-semibold tracking-[0.18em] text-muted uppercase">Access denied</p>
        <h1 className="font-display text-3xl text-ink">You do not have permission for this area</h1>
        <p className="max-w-md text-sm text-muted">
          This page requires <code className="rounded bg-accent-soft px-1.5 py-0.5 text-ink">{requiredPermission}</code>.
          Ask a Super Admin to grant access, or return to the dashboard.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button href="/admin" size="sm">Go to dashboard</Button>
          <Link href="/admin" className="text-sm font-medium text-accent hover:underline">
            Back
          </Link>
        </div>
      </div>
    );
  }

  return children;
}
