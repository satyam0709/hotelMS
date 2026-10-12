import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import EmptyState from "@/components/ui/EmptyState";

export default function FacilityNotFound() {
  return (
    <div className="section-pad">
      <Container>
        <EmptyState
          title="Facility not found"
          description="This facility may have been unpublished or the link is incorrect."
          action={<Button href="/facilities">Browse facilities</Button>}
        />
      </Container>
    </div>
  );
}
