import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import EmptyState from "@/components/ui/EmptyState";

export default function PolicyNotFound() {
  return (
    <div className="section-pad">
      <Container>
        <EmptyState
          title="Policy not found"
          description="This policy may not be published yet. Please check back later or contact the hotel."
          action={<Button href="/contact">Contact us</Button>}
        />
      </Container>
    </div>
  );
}
