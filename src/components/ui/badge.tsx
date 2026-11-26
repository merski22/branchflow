import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1 whitespace-nowrap rounded-sm px-1.5 py-0.5 text-xs font-medium",
  {
    variants: {
      tone: {
        neutral: "bg-muted text-muted-foreground",
        ok: "bg-status-ok text-status-ok-foreground",
        warn: "bg-status-warn text-status-warn-foreground",
        danger: "bg-status-danger text-status-danger-foreground",
        unknown: "bg-status-unknown text-status-unknown-foreground",
        synthetic: "bg-synthetic text-synthetic-foreground",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
)

function Badge({
  className,
  tone,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />
}

export { Badge, badgeVariants }
