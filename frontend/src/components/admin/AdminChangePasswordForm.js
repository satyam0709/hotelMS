"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { adminChangePassword, adminLogout } from "@/lib/api/admin-auth";
import { ApiError } from "@/lib/api/client";

export default function AdminChangePasswordForm() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function onSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (newPassword.length < 12) {
      setError("New password must be at least 12 characters.");
      return;
    }
    if (newPassword !== confirm) {
      setError("New passwords do not match.");
      return;
    }

    startTransition(async () => {
      try {
        await adminChangePassword({ currentPassword, newPassword });
        setCurrentPassword("");
        setNewPassword("");
        setConfirm("");
        setMessage("Password updated! Logging you out in 3 seconds — please sign in with your new password.");
        // Log out after 3 seconds so the new password is confirmed on next login
        setTimeout(async () => {
          try {
            await adminLogout();
          } catch {
            // ignore logout errors
          }
          router.replace("/admin/login");
        }, 3000);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Unable to change password.");
      }
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 rounded-2xl border border-line bg-elevated p-5 shadow-soft"
    >
      <div>
        <h2 className="font-display text-xl text-ink">Change password</h2>
        <p className="mt-1 text-sm text-muted">
          Update the password for your signed-in admin account. You will be logged out automatically after changing it.
        </p>
      </div>
      <Input
        label="Current password"
        type="password"
        autoComplete="current-password"
        required
        value={currentPassword}
        onChange={(event) => setCurrentPassword(event.target.value)}
      />
      <Input
        label="New password"
        type="password"
        autoComplete="new-password"
        required
        minLength={12}
        value={newPassword}
        onChange={(event) => setNewPassword(event.target.value)}
      />
      <Input
        label="Confirm new password"
        type="password"
        autoComplete="new-password"
        required
        minLength={12}
        value={confirm}
        onChange={(event) => setConfirm(event.target.value)}
      />
      {error ? <p className="text-sm text-red-600" role="alert">{error}</p> : null}
      {message ? <p className="text-sm text-green-600 font-medium" role="status">{message}</p> : null}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving…" : "Update password"}
      </Button>
    </form>
  );
}
