import Container from "@/components/ui/Container";
import LoadingState from "@/components/ui/LoadingState";

export default function RestaurantLoading() {
  return (
    <div className="section-pad">
      <Container>
        <LoadingState label="Loading dining" className="min-h-72" />
      </Container>
    </div>
  );
}
