import { Suspense } from "react";
import AdminLoginPage from "@/components/admin/AdminLoginPage";
import LoadingState from "@/components/ui/LoadingState";

export const metadata = {
  title: "Sign in",
};

export default function AdminLoginRoute() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-brand-green">
          <LoadingState label="Loading" />
        </div>
      }
    >
      <AdminLoginPage />
    </Suspense>
  );
}
