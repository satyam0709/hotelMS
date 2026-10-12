import Container from "@/components/ui/Container";
import LoadingState from "@/components/ui/LoadingState";

export default function AttractionsLoading() {
  return (
    <div className="section-pad">
      <Container>
        <LoadingState label="Loading attractions" className="min-h-72" />
      </Container>
    </div>
  );
}
