import Container from "@/components/ui/Container";
import LoadingState from "@/components/ui/LoadingState";

export default function TestimonialsLoading() {
  return (
    <div className="section-pad">
      <Container>
        <LoadingState label="Loading reviews" className="min-h-72" />
      </Container>
    </div>
  );
}
