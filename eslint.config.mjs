import { defineConfig, globalIgnores } from "eslint/config"
import nextVitals from "eslint-config-next/core-web-vitals"
import nextTs from "eslint-config-next/typescript"

/**
 * Architecture boundaries (docs/ARCHITECTURE.md). Each layer lists the imports it may NOT use.
 * `domain` must stay pure: no framework, UI, database or server code.
 */
const restrict = (patterns) => ({
  "no-restricted-imports": ["error", { patterns }],
})

const APP = { group: ["@/app/*"], message: "Layer boundary: do not import routes." }
const COMPONENTS = { group: ["@/components/*"], message: "Layer boundary: UI is not allowed here." }
const SERVER = {
  group: ["@/server/*"],
  message: "Layer boundary: server code is not allowed here.",
}
const DB = { group: ["@/db/*"], message: "Layer boundary: database code is not allowed here." }
const FRAMEWORK = {
  group: [
    "next",
    "next/*",
    "react",
    "react-dom",
    "react/*",
    "drizzle-orm",
    "drizzle-orm/*",
    "postgres",
  ],
  message: "Layer boundary: domain code must be pure TypeScript.",
}

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  { files: ["src/domain/**"], rules: restrict([APP, COMPONENTS, SERVER, DB, FRAMEWORK]) },
  { files: ["src/synthetic/**"], rules: restrict([APP, COMPONENTS, SERVER, FRAMEWORK]) },
  { files: ["src/db/**"], rules: restrict([APP, COMPONENTS, SERVER]) },
  { files: ["src/server/**"], rules: restrict([APP, COMPONENTS]) },
  { files: ["src/components/**"], rules: restrict([APP, SERVER, DB]) },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "playwright-report/**",
    "test-results/**",
    "src/db/migrations/**",
  ]),
])

export default eslintConfig
