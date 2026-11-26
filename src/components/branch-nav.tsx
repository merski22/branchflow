"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"

export interface BranchNavItem {
  href: string
  label: string
}

/** Branch-level navigation. Only routes that exist and the user may open are passed in. */
export function BranchNav({ items }: { items: BranchNavItem[] }) {
  const pathname = usePathname()
  return (
    <nav aria-label="Branch" className="flex gap-1">
      {items.map((item) => {
        const active = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-md px-2.5 py-1 text-sm text-muted-foreground hover:bg-muted hover:text-foreground",
              active && "bg-muted font-medium text-foreground",
            )}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
