/** Persistent indicator that the branch's data is synthetic (FR-F-004, NFR-017). */
export function SyntheticDataBanner() {
  return (
    <div
      role="note"
      className="border-b border-border bg-synthetic px-4 py-1.5 text-xs text-synthetic-foreground"
    >
      <strong className="font-semibold">Synthetic data.</strong> This branch, its people and its
      records are fictional demonstration data. Nothing here reflects a real branch or customer.
    </div>
  )
}
