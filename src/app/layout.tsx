import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"

import { IdentityIndicator } from "./_components/identity-indicator"
import "./globals.css"

export const metadata: Metadata = {
  title: { default: "BranchFlow", template: "%s · BranchFlow" },
  description: "Rental operations intelligence",
  robots: { index: false, follow: false },
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-CA" className="h-full">
      <body className="flex min-h-full flex-col">
        <header className="flex h-11 shrink-0 items-center justify-between gap-4 border-b border-border bg-surface px-4">
          <Link href="/" className="text-sm font-semibold tracking-tight">
            BranchFlow
          </Link>
          <Suspense fallback={null}>
            <IdentityIndicator />
          </Suspense>
        </header>
        <div className="flex flex-1 flex-col">{children}</div>
      </body>
    </html>
  )
}
