import { Suspense } from "react";
import AdminAuthCard from "@/components/admin/AdminAuthCard";
import AdminResetPasswordForm from "@/components/admin/AdminResetPasswordForm";
import LoadingState from "@/components/ui/LoadingState";

export const metadata = {
  title: "Reset password",
};

export default function AdminResetPasswordPage() {
  return (
    <AdminAuthCard
      title="Reset password"
      description="Choose a new password for your admin account (minimum 12 characters)."
    >
      <Suspense fallback={<LoadingState label="Loading" />}>
        <AdminResetPasswordForm />
      </Suspense>
    </AdminAuthCard>
  );
}
