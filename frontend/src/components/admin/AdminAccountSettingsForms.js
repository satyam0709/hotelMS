"use client";

import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { isReadOnlyDemo } from "@/lib/admin/permissions";

export default function AdminAccountSettingsForms({ profileForm, passwordForm }) {
  const { admin } = useAdminAuth();

  if (isReadOnlyDemo(admin)) {
    return (
      <p className="text-sm text-muted">
        The shared demo account cannot edit account or website details.
      </p>
    );
  }

  return (
    <>
      {profileForm}
      {passwordForm}
    </>
  );
}
