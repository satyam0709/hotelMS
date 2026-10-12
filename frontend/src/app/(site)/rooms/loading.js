import Container from "@/components/ui/Container";
import LoadingState from "@/components/ui/LoadingState";

export default function RoomsLoading() {
  return (
    <div className="section-pad">
      <Container>
        <LoadingState label="Loading rooms" className="min-h-72" />
      </Container>
    </div>
  );
}
