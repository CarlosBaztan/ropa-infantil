import { defineConfig, devices } from "@playwright/test";

/*
 * Pruebas de recorrido completo: recorren la web como lo haría una persona.
 *
 * Se ejecutan contra la versión COMPILADA, no contra el servidor de
 * desarrollo. El proyecto vive dentro de OneDrive, que se pelea con los
 * archivos temporales que el servidor de desarrollo escribe sin parar; la
 * versión compilada se escribe una vez y no da ese problema. Una prueba que
 * falla a veces por el entorno es peor que no tenerla.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  // Vitest solo mira los *.test.ts, así que los *.spec.ts son de Playwright
  // y no se pisan.
  testMatch: "**/*.spec.ts",
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  timeout: 60_000,

  use: {
    baseURL: "http://localhost:3000",
    locale: "es-ES",
    timezoneId: "Europe/Madrid",
    trace: "retain-on-failure",
  },

  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],

  /*
   * Siempre compila de cero, aunque haya un servidor levantado.
   *
   * Antes reutilizaba el que hubiera, que es lo que trae la plantilla, y
   * eso ha costado ya dos ratos largos: un servidor con la compilacion
   * de hace media hora hace que las pruebas fallen por codigo que ya no
   * existe, o peor, que pasen por codigo que ya no es el que hay. Media
   * hora buscando un fallo que no estaba vale mas que el minuto que
   * tarda en compilar.
   */
  webServer: {
    command: "npm run build && npm start",
    url: "http://localhost:3000",
    reuseExistingServer: false,
    timeout: 240_000,
  },
});
