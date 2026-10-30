/*
 * El recorrido completo de publicar: subir fotos, describir un lote,
 * publicarlo, verlo en su ficha, marcarlo vendido y comprobar que su
 * página sigue viva.
 *
 * Aquí se comprueba también lo que más daño haría si fallara: que una
 * foto hecha con el móvil llega al almacén SIN las coordenadas de dónde
 * se tomó. Publicarlas sería publicar dónde vive una familia con niños
 * pequeños. La prueba sube a propósito una imagen con GPS dentro y mira
 * los bytes del archivo que ha quedado guardado.
 *
 * Lo que esta prueba NO sustituye, anotado en el plan: publicar un lote
 * de verdad desde un móvil de verdad, con una mano y el cronómetro en
 * marcha. Si pasa de un minuto, el flujo necesita otra vuelta.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });

const URL = process.env.SUPABASE_TEST_URL;
const PUBLICABLE = process.env.SUPABASE_TEST_PUBLISHABLE_KEY;
const SECRETA = process.env.SUPABASE_TEST_SECRET_KEY;
const HAY_BASE = Boolean(URL && PUBLICABLE && SECRETA);

const CONTRASENA = "contrasena-de-prueba-1234";
const FIXTURES = join(process.cwd(), "tests", "e2e", "fixtures");

function admin() {
  return createClient(URL!, SECRETA!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

test.skip(!HAY_BASE, "faltan las claves del proyecto de pruebas en .env.local");

test.describe("publicar un lote", () => {
  let idUsuario: string | null = null;

  test.afterEach(async () => {
    if (idUsuario) {
      await admin().auth.admin.deleteUser(idUsuario);
      idUsuario = null;
    }
  });

  async function entrar(page: import("@playwright/test").Page) {
    const correo = `publica-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}@ejemplo.test`;

    const { data, error } = await admin().auth.admin.createUser({
      email: correo,
      password: CONTRASENA,
      email_confirm: true,
      user_metadata: { fecha_nacimiento: "1990-05-04" },
    });
    expect(error).toBeNull();
    idUsuario = data.user!.id;

    await page.goto("/acceso");
    await page.getByLabel("Correo electrónico").fill(correo);
    await page.getByLabel("Contraseña").fill(CONTRASENA);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page).toHaveURL(/\/perfil/);

    return data.user!.id;
  }

  test("se publica, se ve, se vende y la página sigue viva", async ({
    page,
  }) => {
    await entrar(page);

    // 1. Las fotos, que es por donde empieza el formulario
    await page.goto("/publicar");
    await page
      .getByLabel("Añadir fotos (hasta 5)")
      .setInputFiles([
        join(FIXTURES, "prenda-1.jpg"),
        join(FIXTURES, "prenda-2.jpg"),
      ]);

    const continuarFotos = page.getByRole("button", { name: "Continuar" });
    await expect(continuarFotos).toBeEnabled({ timeout: 20_000 });
    await continuarFotos.click();

    // 2. Qué es
    await page.getByText("Un lote de varias").click();
    await page.getByLabel("¿Cuántas piezas?").fill("14");
    await page.getByLabel("Talla (desde)").selectOption({ label: "3-6 meses" });
    await page
      .getByLabel("Hasta la talla (opcional)")
      .selectOption({ label: "9-12 meses" });
    await page.getByLabel("Qué prenda es").selectOption({ label: "Bodies" });
    await page.getByRole("button", { name: "Continuar" }).click();

    // 3. Precio y entrega
    await page.getByLabel("Precio").fill("45");
    await page
      .getByLabel("En qué estado está")
      .selectOption({ label: "Como nuevo — usado dos o tres veces" });
    await page.getByLabel("Provincia").selectOption({ label: "Madrid" });
    await page.getByLabel("Ciudad o pueblo (opcional)").fill("Alcobendas");

    // El título se escribe solo a partir de lo anterior: eso es media
    // razón de ser del formulario, así que se comprueba.
    await expect(page.getByLabel("Título")).toHaveValue(/Lote de 14 bodies/);

    // Y el precio por pieza, que es el argumento de venta del nicho.
    await expect(page.getByText("3,22 € la pieza").first()).toBeVisible();

    await page.getByRole("button", { name: "Publicar" }).click();

    // 4. La ficha pública
    await expect(page).toHaveURL(/\/anuncio\/lote-de-14-bodies/, {
      timeout: 30_000,
    });
    await expect(page.getByText("Lote de 14 piezas")).toBeVisible();
    await expect(page.getByText("45,00 €").first()).toBeVisible();
    await expect(page.getByText("3,22 € la pieza")).toBeVisible();
    await expect(page.getByText("De 3-6 meses a 9-12 meses")).toBeVisible();
    const direccionDeLaFicha = page.url();

    // Dos fotos, y con sus medidas puestas para que la página no salte
    const fotos = page.locator(".galeria img");
    await expect(fotos).toHaveCount(2);
    await expect(fotos.first()).toHaveAttribute("width", /\d+/);

    // 5. Marcar vendido desde «Mis anuncios»
    await page.goto("/mis-anuncios");
    await expect(page.getByText("Lote de 14 bodies")).toBeVisible();
    await page.getByRole("group").filter({ hasText: "Vender" }).click();
    await page.getByRole("button", { name: "Sí, lo he vendido" }).click();
    await expect(page.getByText("¡Vendido!")).toBeVisible();

    // 6. La página del anuncio vendido sigue viva y marcada
    await page.goto(direccionDeLaFicha);
    await expect(page.getByText("Vendido", { exact: true })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /hay más de la misma talla/ }),
    ).toBeVisible();
  });

  test("una foto con GPS llega al almacén sin las coordenadas", async ({
    page,
  }) => {
    const usuario = await entrar(page);

    // Primero: que la foto de partida lleve GPS de verdad. Sin esto la
    // prueba pasaría siempre y no estaría comprobando nada.
    const original = readFileSync(join(FIXTURES, "prenda-con-gps.jpg"));
    expect(original.includes(Buffer.from("Exif"))).toBe(true);
    // 0x8825 es la etiqueta EXIF que abre el bloque de GPS. Va al revés
    // porque este archivo es «II», de bytes en orden pequeño primero.
    expect(original.includes(Buffer.from([0x25, 0x88]))).toBe(true);
    expect(original.includes(Buffer.from("Camara de prueba"))).toBe(true);

    await page.goto("/publicar");
    await page
      .getByLabel("Añadir fotos (hasta 5)")
      .setInputFiles(join(FIXTURES, "prenda-con-gps.jpg"));

    const continuar = page.getByRole("button", { name: "Continuar" });
    await expect(continuar).toBeEnabled({ timeout: 20_000 });
    await continuar.click();

    await page.getByLabel("Talla").selectOption({ label: "3-6 meses" });
    await page.getByLabel("Qué prenda es").selectOption({ label: "Pijamas" });
    await page.getByRole("button", { name: "Continuar" }).click();

    await page.getByLabel("Precio").fill("9,50");
    await page
      .getByLabel("En qué estado está")
      .selectOption({ label: "Buen estado — usado, sin desperfectos" });
    await page.getByLabel("Provincia").selectOption({ label: "Madrid" });
    await page.getByRole("button", { name: "Publicar" }).click();
    await expect(page).toHaveURL(/\/anuncio\//, { timeout: 30_000 });

    // Ahora los bytes de lo que ha quedado guardado
    const { data: filas } = await admin()
      .from("fotos")
      .select("ruta, anuncio, anuncios!inner(vendedor)")
      .eq("anuncios.vendedor", usuario);
    expect(filas?.length).toBe(1);

    const { data: archivo } = await admin()
      .storage.from("anuncios")
      .download(filas![0]!.ruta as string);
    expect(archivo).not.toBeNull();

    const bytes = Buffer.from(await archivo!.arrayBuffer());

    // Se ha vuelto a dibujar como WebP: del original solo sobreviven los
    // píxeles, y los metadatos se quedan por el camino.
    expect(bytes.subarray(0, 4).toString("latin1")).toBe("RIFF");
    expect(bytes.subarray(8, 12).toString("latin1")).toBe("WEBP");
    expect(bytes.includes(Buffer.from("EXIF"))).toBe(false);
    expect(bytes.includes(Buffer.from("Exif"))).toBe(false);
    // El modelo de cámara iba en el original: si apareciera aquí, es que
    // los metadatos han viajado con la imagen.
    expect(bytes.includes(Buffer.from("Camara de prueba"))).toBe(false);
  });
});
