import Container from "@/components/ui/Container";
import LoadingState from "@/components/ui/LoadingState";

export default function EventsLoading() {
  return (
    <div className="section-pad">
      <Container>
        <LoadingState label="Loading events" className="min-h-72" />
      </Container>
    </div>
  );
}
