import Container from "@/components/ui/Container";
import LoadingState from "@/components/ui/LoadingState";

export default function BookingInvoiceLoading() {
  return (
    <div className="section-pad">
      <Container>
        <LoadingState label="Loading invoice" className="min-h-48" />
      </Container>
    </div>
  );
}
