import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // tsconfigPaths hace que el alias "@/..." de tsconfig.json funcione
  // también en las pruebas, sin repetirlo aquí.
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
