import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";

export default function PackageNotFound() {
  return (
    <Container className="section-pad text-center">
      <h1 className="font-display text-3xl text-ink">Package not found</h1>
      <p className="mt-3 text-muted">This offer may have expired or been unpublished.</p>
      <Button href="/packages" className="mt-6">View packages</Button>
    </Container>
  );
}
