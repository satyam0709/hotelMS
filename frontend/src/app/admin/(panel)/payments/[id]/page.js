import AdminPaymentDetail from "@/components/admin/AdminPaymentDetail";

export const metadata = { title: "Payment detail" };

export default async function AdminPaymentDetailPage({ params }) {
  const { id } = await params;
  return <AdminPaymentDetail paymentId={id} />;
}
