import LoadingState from "@/components/ui/LoadingState";
import Container from "@/components/ui/Container";

export default function SiteLoading() {
  return (
    <Container className="py-24">
      <LoadingState label="Loading the resort experience" className="min-h-72" />
    </Container>
  );
}
