import Container from "@/components/ui/Container";
import LoadingState from "@/components/ui/LoadingState";

export default function FacilitiesLoading() {
  return (
    <div className="section-pad">
      <Container>
        <LoadingState label="Loading facilities" className="min-h-72" />
      </Container>
    </div>
  );
}
