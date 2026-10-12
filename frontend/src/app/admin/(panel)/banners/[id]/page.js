import AdminBannerForm from "@/components/admin/AdminBannerForm";

export const metadata = { title: "Edit banner" };

export default async function AdminBannerEditPage({ params }) {
  const { id } = await params;
  return <AdminBannerForm bannerId={id} />;
}
