"use client";

import { useEffect, useState, useTransition } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { updateAdminProfile } from "@/lib/api/admin-auth";
import { ApiError } from "@/lib/api/client";
import { useAdminAuth } from "@/contexts/AdminAuthContext";

export default function AdminProfileForm() {
  const { admin, refresh } = useAdminAuth();
  const [name, setName] = useState("");
  const [profileImageMediaId, setProfileImageMediaId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setName(admin?.name || "");
    setProfileImageMediaId(admin?.profileImageMediaId || "");
  }, [admin]);

  function onSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!name.trim()) {
      setError("Name is required.");
      return;
    }

    startTransition(async () => {
      try {
        await updateAdminProfile({
          name: name.trim(),
          profileImageMediaId: profileImageMediaId.trim() || null,
        });
        await refresh();
        setMessage("Profile updated.");
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Unable to update profile.");
      }
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 rounded-2xl border border-line bg-elevated p-5 shadow-soft"
    >
      <div>
        <h2 className="font-display text-xl text-ink">Your profile</h2>
        <p className="mt-1 text-sm text-muted">
          Update the display name and optional profile image media ID for your admin account.
        </p>
      </div>
      <Input
        label="Display name"
        name="name"
        required
        value={name}
        onChange={(event) => setName(event.target.value)}
      />
      <Input
        label="Profile image media ID"
        name="profileImageMediaId"
        value={profileImageMediaId}
        onChange={(event) => setProfileImageMediaId(event.target.value)}
        placeholder="Paste a media asset ID from the library"
      />
      {admin?.email ? (
        <p className="text-xs text-muted">Signed in as {admin.email}</p>
      ) : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {message ? <p className="text-sm text-accent">{message}</p> : null}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving…" : "Save profile"}
      </Button>
    </form>
  );
}
