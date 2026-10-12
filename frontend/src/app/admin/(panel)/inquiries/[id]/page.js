import AdminInquiryDetail from "@/components/admin/AdminInquiryDetail";

export const metadata = { title: "Inquiry detail" };

export default async function AdminInquiryDetailPage({ params }) {
  const { id } = await params;
  return <AdminInquiryDetail inquiryId={id} />;
}
