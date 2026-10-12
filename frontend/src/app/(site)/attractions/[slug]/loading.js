import Container from "@/components/ui/Container";
import LoadingState from "@/components/ui/LoadingState";

export default function AttractionDetailLoading() {
  return (
    <div className="section-pad">
      <Container>
        <LoadingState label="Loading attraction" className="min-h-80" />
      </Container>
    </div>
  );
}
