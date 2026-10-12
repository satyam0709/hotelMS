import Container from "@/components/ui/Container";
import LoadingState from "@/components/ui/LoadingState";

export default function EventDetailLoading() {
  return (
    <div className="section-pad">
      <Container>
        <LoadingState label="Loading venue" className="min-h-80" />
      </Container>
    </div>
  );
}
