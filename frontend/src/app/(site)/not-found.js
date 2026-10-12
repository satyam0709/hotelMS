import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import EmptyState from "@/components/ui/EmptyState";

export const metadata = {
  title: "Page not found",
};

export default function SiteNotFound() {
  return (
    <div className="section-pad">
      <Container>
        <EmptyState
          title="Page not found"
          description="The link may be outdated, or the page is not published yet."
          action={
            <div className="flex flex-wrap justify-center gap-3">
              <Button href="/">Back home</Button>
              <Button href="/contact" variant="secondary">Contact us</Button>
            </div>
          }
        />
      </Container>
    </div>
  );
}
