import Container from "@/components/ui/Container";
import LoadingState from "@/components/ui/LoadingState";

export default function GalleryLoading() {
  return (
    <div className="section-pad">
      <Container>
        <LoadingState label="Loading gallery" className="min-h-72" />
      </Container>
    </div>
  );
}
