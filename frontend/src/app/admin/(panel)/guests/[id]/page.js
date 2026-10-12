import AdminGuestDetail from "@/components/admin/AdminGuestDetail";

export const metadata = { title: "Guest" };

export default async function AdminGuestDetailPage({ params }) {
  const { id } = await params;
  return <AdminGuestDetail guestId={id} />;
}
