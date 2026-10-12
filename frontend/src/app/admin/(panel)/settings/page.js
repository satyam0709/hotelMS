import AdminChangePasswordForm from "@/components/admin/AdminChangePasswordForm";
import AdminProfileForm from "@/components/admin/AdminProfileForm";
import AdminSettingsForm from "@/components/admin/AdminSettingsForm";

export const metadata = { title: "Settings" };

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-ink">Website settings</h1>
        <p className="mt-2 text-sm text-muted">
          Contact details, branding text, and social links shown on the public site.
        </p>
      </div>
      <AdminSettingsForm />
      <AdminProfileForm />
      <AdminChangePasswordForm />
    </div>
  );
}
