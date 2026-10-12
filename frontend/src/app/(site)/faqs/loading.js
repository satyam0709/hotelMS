import Container from "@/components/ui/Container";
import LoadingState from "@/components/ui/LoadingState";

export default function FaqsLoading() {
  return (
    <div className="section-pad">
      <Container>
        <LoadingState label="Loading FAQs" className="min-h-72" />
      </Container>
    </div>
  );
}
