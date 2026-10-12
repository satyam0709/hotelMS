import AdminPageEditor from "@/components/admin/AdminPageEditor";

export default async function AdminEditPage({ params }) {
  const { id } = await params;
  return <AdminPageEditor pageId={id} />;
}
