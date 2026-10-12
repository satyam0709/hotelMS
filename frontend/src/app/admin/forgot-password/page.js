import AdminAuthCard from "@/components/admin/AdminAuthCard";
import AdminForgotPasswordForm from "@/components/admin/AdminForgotPasswordForm";

export const metadata = {
  title: "Forgot password",
};

export default function AdminForgotPasswordPage() {
  return (
    <AdminAuthCard
      title="Forgot password"
      description="Enter your admin email. If an account exists, we will send a reset link."
    >
      <AdminForgotPasswordForm />
    </AdminAuthCard>
  );
}
