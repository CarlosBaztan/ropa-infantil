import { defineConfig } from "vitest/config";

export default defineConfig({
  // Vite resuelve por sí solo el alias "@/..." de tsconfig.json desde la
  // versión 8, así que ya no hace falta el complemento que lo hacía antes.
  resolve: { tsconfigPaths: true },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
