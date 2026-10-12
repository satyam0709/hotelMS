import Container from "@/components/ui/Container";
import LoadingState from "@/components/ui/LoadingState";

export default function FacilityDetailLoading() {
  return (
    <div className="section-pad">
      <Container>
        <LoadingState label="Loading facility" className="min-h-80" />
      </Container>
    </div>
  );
}
