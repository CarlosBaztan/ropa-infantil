/*
 * El catálogo, recorrido como lo haría quien llega desde Google.
 *
 * Se siembra por la vía administrativa en vez de publicar por pantalla:
 * publicar ya tiene su propia prueba de recorrido, y aquí lo que se
 * comprueba es lo de después —que lo publicado se encuentra—.
 */

import { createClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });

const URL = process.env.SUPABASE_TEST_URL;
const SECRETA = process.env.SUPABASE_TEST_SECRET_KEY;
const HAY_BASE = Boolean(URL && SECRETA);
const CONTRASENA = "contrasena-de-prueba-1234";

function admin() {
  return createClient(URL!, SECRETA!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

test.skip(!HAY_BASE, "faltan las claves del proyecto de pruebas en .env.local");

test.describe("el catálogo", () => {
  let idUsuario: string | null = null;
  // Una palabra que no está en ningún otro anuncio: la base de pruebas
  // es una sola y otras pruebas siembran a la vez.
  const palabra = `zumbambico${Date.now().toString(36)}`;
  let direccionDelLote = "";

  test.beforeAll(async () => {
    const { data, error } = await admin().auth.admin.createUser({
      email: `catalogo-${Date.now()}@ejemplo.test`,
      password: CONTRASENA,
      email_confirm: true,
      user_metadata: { fecha_nacimiento: "1990-05-04" },
    });
    expect(error).toBeNull();
    idUsuario = data.user!.id;

    const { data: creado } = await admin()
      .from("anuncios")
      .insert({
        vendedor: idUsuario,
        tipo: "lote",
        titulo: `Lote de 10 bodies ${palabra}`,
        slug: "lote-de-10-bodies",
        talla: "3-6-meses",
        talla_hasta: "6-9-meses",
        numero_piezas: 10,
        categoria: "bodies",
        estado: "como-nuevo",
        precio_centimos: 2500,
        acepta_entrega_mano: true,
        provincia: "28",
        marca: "Zara",
      })
      .select("id_publico, slug")
      .single();

    direccionDelLote = `/anuncio/${creado!.slug}-${creado!.id_publico}`;
  });

  test.afterAll(async () => {
    if (idUsuario) await admin().auth.admin.deleteUser(idUsuario);
  });

  test("la portada enseña por dónde entrar", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Ropa de bebé y niño, entre familias" }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "¿Qué talla usa?" })).toBeVisible();
    // La franja de lotes es el argumento del nicho y tiene sitio propio.
    await expect(
      page.getByRole("heading", { name: "Lotes", exact: true }),
    ).toBeVisible();
    // Exacto: el nombre de una tarjeta de lote también contiene la talla.
    await expect(
      page.getByRole("link", { name: "3-6 meses", exact: true }),
    ).toBeVisible();
  });

  test("la página de una talla enseña lo que hay, con su precio por pieza", async ({
    page,
  }) => {
    await page.goto("/ropa/talla/3-6-meses");
    await expect(
      page.getByRole("heading", { name: "Ropa de la talla 3-6 meses" }),
    ).toBeVisible();

    // Se busca la tarjeta entera, no el enlace: el enlace es solo el
    // titulo, para que su nombre accesible no sea el parrafo completo.
    const tarjeta = page
      .getByRole("article")
      .filter({ hasText: new RegExp(palabra) });
    await expect(tarjeta).toBeVisible();
    // 25,00 € entre 10 piezas: la cuenta que nadie hace de cabeza.
    await expect(tarjeta).toContainText("2,50 € la pieza");
    await expect(tarjeta).toContainText("Lote · 10 piezas");
  });

  test("desde la tarjeta se llega a la ficha", async ({ page }) => {
    await page.goto("/ropa/talla/3-6-meses");
    await page.getByRole("link", { name: new RegExp(palabra) }).click();
    await expect(page).toHaveURL(new RegExp(direccionDelLote));
  });

  test("el mes suelto lleva a su rango", async ({ page }) => {
    // Una madre busca «ropa bebé 4 meses», no «3-6 meses».
    await page.goto("/ropa/talla/4-meses");
    await expect(page).toHaveURL("/ropa/talla/3-6-meses");
  });

  test("una talla inventada es un 404, no una página vacía", async ({
    page,
  }) => {
    const respuesta = await page.goto("/ropa/talla/talla-inventada");
    expect(respuesta?.status()).toBe(404);
  });

  test("una página con pocos anuncios no se le ofrece a Google", async ({
    page,
  }) => {
    // El umbral de existencia: por debajo de diez, la página existe pero
    // no pide ser indexada.
    await page.goto("/ropa/talla/3-6-meses");
    const robots = page.locator('meta[name="robots"]');
    await expect(robots).toHaveAttribute("content", /noindex/);
  });

  test("/lotes deja fuera las prendas sueltas", async ({ page }) => {
    await admin()
      .from("anuncios")
      .insert({
        vendedor: idUsuario,
        tipo: "prenda",
        titulo: `Camiseta suelta ${palabra}`,
        slug: "camiseta-suelta",
        talla: "3-6-meses",
        categoria: "camisetas",
        estado: "buen-estado",
        precio_centimos: 500,
        acepta_entrega_mano: true,
      });

    await page.goto("/lotes");
    await expect(
      page.getByRole("link", { name: new RegExp(`Lote de 10 bodies ${palabra}`) }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: new RegExp(`Camiseta suelta ${palabra}`) }),
    ).toHaveCount(0);
  });

  test("las páginas de género funcionan, con talla y con categoría", async ({
    page,
  }) => {
    /*
     * Esta prueba existe por un fallo que la compilación no vio. Next
     * exige que un mismo sitio de la ruta se llame igual en todas las
     * rutas que pasan por él, y /ropa/<categoria> y /ropa/<genero>/<algo>
     * tenían nombres distintos. Compilaba perfectamente y luego el
     * servidor devolvía 500 en TODAS las páginas, no solo en esas.
     */
    for (const direccion of ["/ropa/nina/3-6-meses", "/ropa/nina/vestidos"]) {
      const respuesta = await page.goto(direccion);
      expect(respuesta?.status(), direccion).toBe(200);
    }

    await page.goto("/ropa/nina/4-meses");
    await expect(page).toHaveURL("/ropa/nina/3-6-meses");

    for (const direccion of ["/ropa/nina/inventado", "/ropa/perro/vestidos"]) {
      const respuesta = await page.goto(direccion);
      expect(respuesta?.status(), direccion).toBe(404);
    }
  });

  test("la página de una provincia ordena pero no esconde el resto", async ({
    page,
  }) => {
    await page.goto("/ropa-segunda-mano/madrid");
    await expect(
      page.getByRole("heading", {
        name: "Ropa infantil de segunda mano en Madrid",
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: new RegExp(palabra) }).first(),
    ).toBeVisible();

    const respuesta = await page.goto("/ropa-segunda-mano/inventada");
    expect(respuesta?.status()).toBe(404);
  });

  test("el buscador encuentra por texto", async ({ page }) => {
    await page.goto(`/buscar?texto=${palabra}`);
    await expect(
      page.getByRole("link", { name: new RegExp(palabra) }).first(),
    ).toBeVisible();
  });

  test("y nunca se ofrece a Google, tenga lo que tenga", async ({ page }) => {
    await page.goto("/buscar");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      /noindex/,
    );
  });

  test("buscar un comodín no devuelve el catálogo entero", async ({ page }) => {
    // En un like de PostgreSQL, % lo encaja todo.
    await page.goto("/buscar?texto=%25");
    await expect(page.getByText("Ningún anuncio")).toBeVisible();
  });

  test("el robots deja fuera lo que no es catálogo", async ({ page }) => {
    const respuesta = await page.goto("/robots.txt");
    const texto = (await respuesta!.text()).toLowerCase();
    expect(texto).toContain("disallow: /buscar");
    expect(texto).toContain("disallow: /perfil");
    expect(texto).toContain("sitemap:");
  });

  test("el mapa del sitio no ofrece páginas por debajo del umbral", async ({
    page,
  }) => {
    const respuesta = await page.goto("/sitemap.xml");
    const xml = await respuesta!.text();
    expect(xml).toContain("/lotes");
    // Con menos de diez anuncios, la página de esa talla no entra.
    expect(xml).not.toContain("/ropa/talla/3-6-meses");
  });
});
