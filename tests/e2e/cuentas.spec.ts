/*
 * El recorrido completo de una persona: entrar, ponerse alias, que su
 * armario se vea, y salir.
 *
 * Lo que esta prueba NO cubre, a propósito: que el correo de verificación
 * llegue de verdad. Eso depende del servicio de correo y no se puede
 * automatizar sin un buzón de pruebas; hay que comprobarlo a mano antes de
 * cada lanzamiento. Aquí la cuenta se confirma por la vía administrativa,
 * que es el mismo efecto que tiene abrir el enlace del correo.
 */

import { createClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });

const URL = process.env.SUPABASE_TEST_URL;
const PUBLICABLE = process.env.SUPABASE_TEST_PUBLISHABLE_KEY;
const SECRETA = process.env.SUPABASE_TEST_SECRET_KEY;
const HAY_BASE = Boolean(URL && PUBLICABLE && SECRETA);

const CONTRASENA = "contrasena-de-prueba-1234";

function admin() {
  return createClient(URL!, SECRETA!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function correoUnico(prefijo: string) {
  return `${prefijo}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}@ejemplo.test`;
}

test.skip(
  !HAY_BASE,
  "faltan las claves del proyecto de pruebas en .env.local",
);

test.describe("el formulario de registro", () => {
  test("rechaza a quien no llega a los 18 años", async ({ page }) => {
    await page.goto("/registro");
    await page.getByLabel("Correo electrónico").fill(correoUnico("menor"));
    await page.getByLabel("Contraseña").fill(CONTRASENA);
    await page.getByLabel("Fecha de nacimiento").fill("2015-06-01");
    await page.getByRole("button", { name: "Crear cuenta" }).click();

    // Se acota al aviso del formulario: la página tiene algún otro
    // elemento con rol de alerta y el selector genérico encontraba dos.
    await expect(page.locator("p[role=alert]")).toContainText("18 años o más");
  });

  test("no ofrece ninguna casilla de aceptar la privacidad", async ({
    page,
  }) => {
    // La privacidad se informa, no se consiente. Si alguien añade esa
    // casilla alguna vez, esta prueba lo caza.
    await page.goto("/registro");
    const casillas = page.getByRole("checkbox");
    await expect(casillas).toHaveCount(1);
    await expect(casillas.first()).not.toBeChecked();
  });
});

test.describe("el recorrido de una cuenta", () => {
  let idUsuario: string | null = null;

  test.afterEach(async () => {
    if (idUsuario) {
      await admin().auth.admin.deleteUser(idUsuario);
      idUsuario = null;
    }
  });

  test("entra, se pone alias, su armario se ve y sale", async ({ page }) => {
    const correo = correoUnico("recorrido");

    // La cuenta se crea ya confirmada: equivale a haber abierto el enlace
    // del correo de verificación.
    const { data, error } = await admin().auth.admin.createUser({
      email: correo,
      password: CONTRASENA,
      email_confirm: true,
      user_metadata: { fecha_nacimiento: "1990-05-04" },
    });
    expect(error).toBeNull();
    idUsuario = data.user!.id;

    // 1. Entrar
    await page.goto("/acceso");
    await page.getByLabel("Correo electrónico").fill(correo);
    await page.getByLabel("Contraseña").fill(CONTRASENA);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page).toHaveURL(/\/perfil/);

    // 2. Ponerse alias y provincia
    const alias = `prueba-${Date.now().toString(36)}`;
    await page.getByLabel("Alias").fill(alias);
    await page.getByLabel("Provincia").selectOption({ label: "Bizkaia" });
    await page.getByLabel("Ciudad o pueblo (opcional)").fill("Getxo");
    await page.getByRole("button", { name: "Guardar" }).click();
    await expect(page.getByText("Cambios guardados")).toBeVisible();

    // 3. El armario público se ve, y lo ve cualquiera
    await page.goto(`/armario/${alias}`);
    await expect(
      page.getByRole("heading", { name: `El armario de ${alias}` }),
    ).toBeVisible();
    await expect(page.getByText("Bizkaia")).toBeVisible();

    // 4. Salir
    await page.goto("/perfil");
    await page.getByRole("button", { name: "Cerrar sesión" }).click();
    await expect(page).toHaveURL("/");

    // 5. Y ya no se entra al perfil sin sesión
    await page.goto("/perfil");
    await expect(page).toHaveURL(/\/acceso/);
  });

  test("un armario que no existe da 404, no un error del servidor", async ({
    page,
  }) => {
    const respuesta = await page.goto("/armario/nadie-con-este-alias");
    expect(respuesta?.status()).toBe(404);
  });
});

test.describe("las páginas legales", () => {
  for (const ruta of [
    "/legal/aviso-legal",
    "/legal/condiciones",
    "/legal/privacidad",
    "/legal/cookies",
  ]) {
    test(`${ruta} responde y avisa de que es un borrador`, async ({ page }) => {
      const respuesta = await page.goto(ruta);
      expect(respuesta?.status()).toBe(200);
      await expect(page.getByText("Borrador sin publicar")).toBeVisible();
    });
  }

  test("el pie enlaza las cuatro desde la portada", async ({ page }) => {
    await page.goto("/");
    const pie = page.getByRole("navigation", { name: "Información legal" });
    await expect(pie.getByRole("link")).toHaveCount(4);
  });
});
