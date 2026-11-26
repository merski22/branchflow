import Link from "next/link"

export default function NotFound() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-16">
      <h1 className="text-lg font-semibold">Page not found</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        This page doesn&apos;t exist, or you don&apos;t have access to it.
      </p>
      <Link href="/" className="mt-4 inline-block text-sm underline underline-offset-4">
        Back to your branches
      </Link>
    </main>
  )
}
