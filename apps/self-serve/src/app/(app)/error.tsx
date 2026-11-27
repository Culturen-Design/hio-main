"use client";

import { Button, Card, CardTitle, Container } from "@hio/ui/admin";
import { useEffect } from "react";

/** Catches an unexpected failure in a signed-in screen without losing the shell. */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Container size="narrow">
      <Card className="mt-8">
        <CardTitle>Something went wrong</CardTitle>
        <p className="m-0 text-muted-foreground text-sm">
          Your page is safe — nothing was lost. Try again, and if it keeps happening, reload the
          page.
        </p>
        <div className="mt-4">
          <Button type="button" onClick={reset}>
            Try again
          </Button>
        </div>
      </Card>
    </Container>
  );
}
