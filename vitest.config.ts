import { defineVitestConfig } from "@nuxt/test-utils/config";

export default defineVitestConfig({
  test: {
    environment: "happy-dom",
    exclude: ["oldtests/**", "node_modules/**"],
  },
});
