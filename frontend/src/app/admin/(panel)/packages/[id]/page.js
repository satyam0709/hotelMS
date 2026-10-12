import AdminPackageForm from "@/components/admin/AdminPackageForm";

export const metadata = { title: "Edit package" };

export default async function AdminPackageEditPage({ params }) {
  const { id } = await params;
  return <AdminPackageForm packageId={id} />;
}
