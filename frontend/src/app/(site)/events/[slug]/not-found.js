import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import EmptyState from "@/components/ui/EmptyState";

export default function EventNotFound() {
  return (
    <div className="section-pad">
      <Container>
        <EmptyState
          title="Venue not found"
          description="This event venue may have been unpublished or the link is incorrect."
          action={<Button href="/events">Browse venues</Button>}
        />
      </Container>
    </div>
  );
}
