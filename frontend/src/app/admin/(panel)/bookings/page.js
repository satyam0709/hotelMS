import { Suspense } from "react";
import AdminBookingsTable from "@/components/admin/AdminBookingsTable";
import LoadingState from "@/components/ui/LoadingState";

export const metadata = { title: "Bookings" };

export default function AdminBookingsPage() {
  return (
    <Suspense fallback={<LoadingState label="Loading bookings" />}>
      <AdminBookingsTable />
    </Suspense>
  );
}
