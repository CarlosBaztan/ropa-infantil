/*
 * «Mis anuncios», recorrido por pantalla.
 *
 * Las transiciones ya tienen pruebas de permisos contra la base, que
 * comprueban quién puede hacer qué. Esto comprueba la otra mitad: que
 * los botones existen, que hacen lo que dicen y que después se ve lo que
 * ha pasado. Marcar vendido es la acción más importante del proyecto
 * —su fecha es el número con el que se decide si esto sigue— y hasta
 * ahora ninguna prueba la había pulsado de verdad.
 */

import { createClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";
import { config } from "dotenv";

// El orden importa: las variables se leen DESPUES de cargar el archivo.
// Al reves, las claves salen vacias y las pruebas se saltan enteras sin
// que nadie se entere.
config({ path: ".env.local", quiet: true });

const URL = process.env.SUPABASE_TEST_URL;
const SECRETA = process.env.SUPABASE_TEST_SECRET_KEY;
const CONTRASENA = "contrasena-de-prueba-1234";

function admin() {
  return createClient(URL!, SECRETA!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

test.skip(
  !Boolean(URL && SECRETA),
  "faltan las claves del proyecto de pruebas en .env.local",
);

test.describe("mis anuncios", () => {
  let idUsuario: string | null = null;
  let titulo = "";

  test.beforeEach(async ({ page }) => {
    const correo = `mios-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}@ejemplo.test`;
    titulo = `Lote de bodies ${Math.random().toString(36).slice(2, 8)}`;

    const { data } = await admin().auth.admin.createUser({
      email: correo,
      password: CONTRASENA,
      email_confirm: true,
      user_metadata: { fecha_nacimiento: "1990-05-04" },
    });
    idUsuario = data.user!.id;

    await admin().from("anuncios").insert({
      vendedor: idUsuario,
      tipo: "lote",
      titulo,
      slug: "lote-de-bodies",
      numero_piezas: 12,
      talla: "3-6-meses",
      categoria: "bodies",
      estado: "buen-estado",
      precio_centimos: 3500,
      acepta_entrega_mano: true,
      provincia: "28",
    });

    await page.goto("/acceso");
    await page.getByLabel("Correo electrónico").fill(correo);
    await page.getByLabel("Contraseña").fill(CONTRASENA);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page).toHaveURL(/\/perfil/);
  });

  test.afterEach(async () => {
    if (idUsuario) {
      await admin().auth.admin.deleteUser(idUsuario);
      idUsuario = null;
    }
  });

  test("lo lista con su precio por pieza y sus acciones", async ({ page }) => {
    await page.goto("/mis-anuncios");
    await expect(page.getByRole("heading", { name: "En venta (1)" })).toBeVisible();
    await expect(page.getByText(titulo)).toBeVisible();
    // 35,00 € entre 12 piezas, redondeando hacia arriba.
    await expect(page.getByText("2,92 € la pieza")).toBeVisible();
    await expect(page.getByRole("button", { name: `Reservar «${titulo}»` })).toBeVisible();
  });

  test("reservar y quitar la reserva", async ({ page }) => {
    await page.goto("/mis-anuncios");
    await page.getByRole("button", { name: `Reservar «${titulo}»` }).click();
    await expect(page.getByText("Marcado como reservado.")).toBeVisible();

    await page
      .getByRole("button", { name: `Quitar la reserva «${titulo}»` })
      .click();
    await expect(page.getByText("Ya está en venta otra vez.")).toBeVisible();
  });

  test("vender pide confirmación y deja la página del anuncio viva", async ({
    page,
  }) => {
    await page.goto("/mis-anuncios");

    // El botón de vender está detrás de una confirmación a propósito: es
    // la acción que más escuece deshacer.
    await expect(
      page.getByRole("button", { name: `Sí, lo he vendido «${titulo}»` }),
    ).toBeHidden();
    await page.getByRole("group").filter({ hasText: "Vender" }).click();
    await page
      .getByRole("button", { name: `Sí, lo he vendido «${titulo}»` })
      .click();

    await expect(page.getByText("¡Vendido!")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Vendidos (1)" })).toBeVisible();

    // Y la ficha sigue en pie, marcada: es lo que captura las búsquedas.
    await page.getByRole("link", { name: new RegExp(titulo) }).first().click();
    await expect(page.getByText("Vendido", { exact: true })).toBeVisible();
  });

  test("deshacer una venta marcada por error", async ({ page }) => {
    await page.goto("/mis-anuncios");
    await page.getByRole("group").filter({ hasText: "Vender" }).click();
    await page
      .getByRole("button", { name: `Sí, lo he vendido «${titulo}»` })
      .click();
    await expect(page.getByText("¡Vendido!")).toBeVisible();

    await page
      .getByRole("button", { name: `No estaba vendido «${titulo}»` })
      .click();
    await expect(page.getByText("Ya está en venta otra vez.")).toBeVisible();
    await expect(page.getByRole("heading", { name: "En venta (1)" })).toBeVisible();
  });

  test("retirar lo esconde, y se recupera desde aquí", async ({ page }) => {
    await page.goto("/mis-anuncios");
    await page.getByRole("button", { name: `Retirar «${titulo}»` }).click();
    await expect(page.getByText("Retirado. Solo lo ves tú.")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Retirados (1)" })).toBeVisible();

    // Y deja de verse desde fuera.
    const fuera = await page.context().newPage();
    await fuera.goto("/ropa/talla/3-6-meses");
    await expect(fuera.getByText(titulo)).toHaveCount(0);
    await fuera.close();

    await page
      .getByRole("button", { name: `Volver a publicar «${titulo}»` })
      .click();
    await expect(page.getByText("Ya está en venta otra vez.")).toBeVisible();
  });

  test("borrar solo se ofrece una vez retirado, y con confirmación", async ({
    page,
  }) => {
    await page.goto("/mis-anuncios");
    // Mientras está en venta no hay forma de borrarlo de un toque.
    await expect(page.getByRole("group").filter({ hasText: "Borrar" })).toHaveCount(0);

    await page.getByRole("button", { name: `Retirar «${titulo}»` }).click();
    await expect(page.getByText("Retirado. Solo lo ves tú.")).toBeVisible();

    await page.getByRole("group").filter({ hasText: "Borrar" }).click();
    await page
      .getByRole("button", { name: `Borrar para siempre «${titulo}»` })
      .click();

    await expect(page.getByText("Anuncio borrado.")).toBeVisible();
    await expect(page.getByText(titulo)).toHaveCount(0);
  });
});
