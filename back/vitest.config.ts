import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["src/modules/**/*.ts", "src/lib/**/*.ts"],
      exclude: ["src/**/*.test.ts"],
    },
  },
  resolve: {
    // Permet d'importer des fichiers .ts en résolvant les extensions .js (NodeNext)
    extensionAlias: {
      ".js": [".ts", ".js"],
    },
  },
});
