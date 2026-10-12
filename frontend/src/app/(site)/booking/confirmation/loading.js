import Container from "@/components/ui/Container";
import LoadingState from "@/components/ui/LoadingState";

export default function BookingConfirmationLoading() {
  return (
    <div className="section-pad">
      <Container>
        <LoadingState label="Loading confirmation" className="min-h-72" />
      </Container>
    </div>
  );
}
