import type { Metadata } from "next"

import "./globals.css"

export const metadata: Metadata = {
  title: { default: "BranchFlow", template: "%s · BranchFlow" },
  description: "Rental operations intelligence",
  robots: { index: false, follow: false },
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-CA" className="h-full">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  )
}
