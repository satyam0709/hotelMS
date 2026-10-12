import AdminRoomEditor from "@/components/admin/AdminRoomEditor";

export const metadata = { title: "Edit room" };

export default async function AdminRoomEditPage({ params }) {
  const { id } = await params;
  return <AdminRoomEditor roomId={id} />;
}
