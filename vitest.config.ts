import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    exclude: ["**/node_modules/**", "**/e2e/**", "**/.next/**"],
    // The countdown UI ships hidden by default (NEXT_PUBLIC_SHOW_COUNTDOWN);
    // its own unit tests still exercise the component with it enabled.
    env: {
      NEXT_PUBLIC_SHOW_COUNTDOWN: "true",
    },
  },
});
