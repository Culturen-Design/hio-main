import { Container, Spinner } from "@hio/ui/admin";

/** Shown inside the app shell while a signed-in screen loads. */
export default function Loading() {
  return (
    <Container size="narrow">
      <div className="flex items-center gap-2 py-10 text-muted-foreground text-sm">
        <Spinner label="Loading…" />
        <span aria-hidden="true">Loading…</span>
      </div>
    </Container>
  );
}
