import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import EmptyState from "@/components/ui/EmptyState";

export default function AttractionNotFound() {
  return (
    <div className="section-pad">
      <Container>
        <EmptyState
          title="Attraction not found"
          description="This attraction may have been unpublished or the link is incorrect."
          action={<Button href="/attractions">Browse attractions</Button>}
        />
      </Container>
    </div>
  );
}
