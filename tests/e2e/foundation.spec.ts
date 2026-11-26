import { expect, test, type Page } from "@playwright/test"

/** Switch to a synthetic development identity and finish on the home page. */
async function useIdentity(page: Page, displayName: string) {
  await page.goto("/dev/identity")
  const row = page.getByRole("listitem").filter({ hasText: displayName })
  // The list streams in; wait for it before deciding whether a switch is needed.
  await expect(row).toBeVisible()
  const button = row.getByRole("button", { name: "Use this identity" })
  if (await button.isVisible()) {
    await button.click()
    await page.waitForURL("/")
  } else {
    await expect(row).toContainText("Current")
    await page.goto("/")
  }
  await expect(page.getByRole("banner")).toContainText(displayName)
}

test.describe("branch access", () => {
  test("a multi-branch manager sees only their own branches", async ({ page }) => {
    await useIdentity(page, "Avery Manager")
    const main = page.getByRole("main")
    await expect(main.getByRole("link", { name: /Lakeshore/ })).toBeVisible()
    await expect(main.getByRole("link", { name: /Harbourfront/ })).toBeVisible()
    await expect(main).not.toContainText("Riverside")
  })

  test("the branch overview shows synthetic labelling, branch time and data freshness", async ({
    page,
  }) => {
    await useIdentity(page, "Avery Manager")
    await page.goto("/o/northshore/lakeshore")
    await expect(page.getByRole("note")).toContainText("Synthetic data.")
    await expect(page.getByRole("main")).toContainText("America/Toronto")
    await expect(page.getByRole("main")).toMatchAriaSnapshot(`
      - table:
        - rowgroup:
          - row:
            - columnheader "Source"
            - columnheader "Status"
            - columnheader "Data as of"
            - columnheader "Freshness"
            - columnheader "Rows"
    `)
    await expect(page.getByRole("cell", { name: /Current/ })).toBeVisible()
  })

  test("another organization's branch is indistinguishable from a missing one", async ({
    page,
  }) => {
    await useIdentity(page, "Avery Manager")
    await page.goto("/o/prairie-wheels/riverside")
    await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible()
    await expect(page.locator("body")).not.toContainText("Riverside")

    await page.goto("/o/northshore/does-not-exist")
    await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible()
  })

  test("a branch manager in one branch cannot open a sibling branch", async ({ page }) => {
    await useIdentity(page, "Riley Manager")
    await page.goto("/o/northshore/lakeshore")
    await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible()
  })
})

test.describe("permissions", () => {
  test("a management trainee has no audit log link and cannot open it directly", async ({
    page,
  }) => {
    await useIdentity(page, "Sam Trainee")
    await page.goto("/o/northshore/lakeshore")
    const nav = page.getByRole("navigation", { name: "Branch" })
    await expect(nav.getByRole("link", { name: "Overview" })).toBeVisible()
    await expect(nav.getByRole("link", { name: "Audit log" })).toHaveCount(0)

    await page.goto("/o/northshore/lakeshore/audit")
    await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible()
  })

  test("a branch manager can read the audit log, including identity switches", async ({ page }) => {
    await useIdentity(page, "Sam Trainee")
    await useIdentity(page, "Avery Manager")
    await page.goto("/o/northshore/lakeshore")
    await page
      .getByRole("navigation", { name: "Branch" })
      .getByRole("link", { name: "Audit log" })
      .click()
    await expect(page.getByRole("heading", { name: "Audit log" })).toBeVisible()
    await expect(page.getByRole("cell", { name: "synthetic_seed.applied" })).toBeVisible()
  })
})

test.describe("states", () => {
  test("a user without memberships sees an explanatory empty state", async ({ page }) => {
    await useIdentity(page, "Morgan Unassigned")
    await expect(page.getByText("You don't have access to any branches")).toBeVisible()
  })

  test("the branch overview has no horizontal scroll at phone width", async ({ page }) => {
    await useIdentity(page, "Avery Manager")
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto("/o/northshore/lakeshore")
    await expect(page.getByRole("heading", { name: "Lakeshore" })).toBeVisible()
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )
    expect(overflow).toBeLessThanOrEqual(0)
  })
})
