import path from "node:path"
import { defineConfig } from "vitest/config"

const alias = { "@": path.resolve(__dirname, "src") }

export default defineConfig({
  test: {
    projects: [
      {
        resolve: { alias },
        test: {
          name: "unit",
          environment: "node",
          include: ["src/**/*.test.ts"],
          exclude: ["src/**/*.integration.test.ts"],
        },
      },
      {
        resolve: {
          alias: { ...alias, "server-only": path.resolve(__dirname, "tests/stubs/server-only.ts") },
        },
        test: {
          name: "integration",
          environment: "node",
          include: ["src/**/*.integration.test.ts"],
          globalSetup: ["tests/integration/global-setup.ts"],
          // Integration test files share one database; run them one at a time.
          fileParallelism: false,
        },
      },
    ],
  },
})
