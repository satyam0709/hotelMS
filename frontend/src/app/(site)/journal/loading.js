import Container from "@/components/ui/Container";

export default function JournalLoading() {
  return (
    <Container className="section-pad">
      <div className="h-10 w-48 animate-pulse rounded-lg bg-brand-cream" />
      <div className="mt-6 h-16 max-w-xl animate-pulse rounded-lg bg-brand-cream" />
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-80 animate-pulse rounded-2xl bg-brand-cream" />
        ))}
      </div>
    </Container>
  );
}
