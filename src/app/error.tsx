"use client"

import { Button } from "@/components/ui/button"

/** Never shows error details to the user (NFR-019); the digest correlates with server logs. */
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-16">
      <h1 className="text-lg font-semibold">Something went wrong</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        BranchFlow couldn&apos;t load this page. Nothing was changed.
        {error.digest ? ` Reference: ${error.digest}` : null}
      </p>
      <Button className="mt-4" variant="outline" onClick={reset}>
        Try again
      </Button>
    </main>
  )
}
