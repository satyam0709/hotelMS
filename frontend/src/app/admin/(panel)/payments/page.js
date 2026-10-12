import { Suspense } from "react";
import AdminPaymentsTable from "@/components/admin/AdminPaymentsTable";
import LoadingState from "@/components/ui/LoadingState";

export const metadata = { title: "Payments" };

export default function AdminPaymentsPage() {
  return (
    <Suspense fallback={<LoadingState label="Loading payments" />}>
      <AdminPaymentsTable />
    </Suspense>
  );
}
