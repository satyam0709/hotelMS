import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import EmptyState from "@/components/ui/EmptyState";

export default function RoomNotFound() {
  return (
    <div className="section-pad">
      <Container>
        <EmptyState
          title="Room not found"
          description="This room may have been unpublished or the link is incorrect."
          action={<Button href="/rooms">Browse rooms</Button>}
        />
      </Container>
    </div>
  );
}
