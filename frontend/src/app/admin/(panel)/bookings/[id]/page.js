import AdminBookingDetail from "@/components/admin/AdminBookingDetail";

export const metadata = { title: "Booking detail" };

export default async function AdminBookingDetailPage({ params }) {
  const { id } = await params;
  return <AdminBookingDetail bookingId={id} />;
}
