import Container from "@/components/ui/Container";
import LoadingState from "@/components/ui/LoadingState";

export default function BookingLookupLoading() {
  return (
    <div className="section-pad">
      <Container>
        <LoadingState label="Loading" className="min-h-48" />
      </Container>
    </div>
  );
}
