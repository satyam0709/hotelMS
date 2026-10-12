import AdminBookingInvoice from "@/components/admin/AdminBookingInvoice";

export const metadata = { title: "Booking invoice" };

export default async function AdminBookingInvoicePage({ params }) {
  const { id } = await params;
  return <AdminBookingInvoice bookingId={id} />;
}
