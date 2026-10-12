import Container from "@/components/ui/Container";
import LoadingState from "@/components/ui/LoadingState";

export default function BookingLoading() {
  return (
    <div className="section-pad">
      <Container>
        <LoadingState label="Loading booking" className="min-h-72" />
      </Container>
    </div>
  );
}
