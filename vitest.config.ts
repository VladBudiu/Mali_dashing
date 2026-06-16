import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./apps/web/src", import.meta.url)),
      "@mali/config": fileURLToPath(new URL("./packages/config/src/index.ts", import.meta.url)),
      "@mali/types": fileURLToPath(new URL("./packages/types/src/index.ts", import.meta.url)),
      "@mali/utils": fileURLToPath(new URL("./packages/utils/src/index.ts", import.meta.url)),
      "server-only": fileURLToPath(new URL("./node_modules/server-only/empty.js", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["apps/**/*.test.{ts,tsx}", "packages/**/*.test.ts"],
    exclude: ["**/node_modules/**", "**/.next/**"],
  },
});
