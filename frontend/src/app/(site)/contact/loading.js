import Container from "@/components/ui/Container";
import LoadingState from "@/components/ui/LoadingState";

export default function ContactLoading() {
  return (
    <div className="section-pad">
      <Container>
        <LoadingState label="Loading contact" className="min-h-72" />
      </Container>
    </div>
  );
}
