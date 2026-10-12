import Container from "@/components/ui/Container";
import LoadingState from "@/components/ui/LoadingState";

export default function RoomDetailLoading() {
  return (
    <div className="section-pad">
      <Container>
        <LoadingState label="Loading room details" className="min-h-80" />
      </Container>
    </div>
  );
}
