import Container from "@/components/ui/Container";
import LoadingState from "@/components/ui/LoadingState";

export default function AboutLoading() {
  return (
    <div className="section-pad">
      <Container>
        <LoadingState label="Loading about" className="min-h-72" />
      </Container>
    </div>
  );
}
