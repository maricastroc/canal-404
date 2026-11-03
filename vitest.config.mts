import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const SERVER_TESTS = ["src/server/**/*.test.ts", "src/app/api/**/*.test.ts"];

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    restoreMocks: true,
    unstubGlobals: true,
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          environment: "jsdom",
          setupFiles: ["./vitest.setup.ts"],
          include: ["src/**/*.test.{ts,tsx}"],
          exclude: SERVER_TESTS,
        },
      },
      {
        extends: true,
        test: {
          name: "server",
          environment: "node",
          include: SERVER_TESTS,
          globalSetup: ["./vitest.db-setup.ts"],
          setupFiles: ["./vitest.server-setup.ts"],
          fileParallelism: false,
          testTimeout: 20_000,
          hookTimeout: 60_000,
        },
      },
    ],
  },
});
