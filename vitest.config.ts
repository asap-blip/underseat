import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
      // `server-only` is a build-time marker resolved by Next; map it to a
      // no-op so server modules guarded by it stay importable under vitest.
      "server-only": resolve(__dirname, "node_modules/next/dist/compiled/server-only/empty.js"),
    },
  },
  test: {
    include: ["tests/unit/**/*.spec.ts"],
    environment: "node",
  },
});
