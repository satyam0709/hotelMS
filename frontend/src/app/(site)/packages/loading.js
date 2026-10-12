import Container from "@/components/ui/Container";
import LoadingState from "@/components/ui/LoadingState";

export default function PackagesLoading() {
  return (
    <div className="section-pad">
      <Container>
        <LoadingState label="Loading packages" className="min-h-72" />
      </Container>
    </div>
  );
}
