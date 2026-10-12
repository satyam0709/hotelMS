"use client";

import { LogOut } from "lucide-react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import Button from "@/components/ui/Button";
import { useAdminAuth } from "@/contexts/AdminAuthContext";

export default function AdminShell({ children }) {
  const { admin, logout } = useAdminAuth();

  return (
    <div className="flex min-h-screen flex-col bg-[#f7f5ef] md:flex-row">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-line bg-elevated/95 px-4 py-3 backdrop-blur-sm md:px-6">
          <div className="min-w-0 md:hidden">
            <p className="truncate text-sm font-medium text-ink">{admin?.name}</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button
              href="/"
              target="_blank"
              rel="noreferrer"
              variant="secondary"
              size="sm"
              className="hidden h-9 rounded-xl px-3 text-xs sm:inline-flex"
            >
              View website
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => logout()}
              className="h-9 rounded-xl px-3 text-xs"
            >
              <LogOut className="size-3.5" />
              Sign out
            </Button>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
