/*
 * La consulta del catálogo, contra la base de verdad.
 *
 * Es la que alimenta la portada, las páginas de aterrizaje, el buscador
 * y el armario público, así que un fallo aquí se ve en todas partes a la
 * vez. Y es la que decide qué NO se enseña, que importa más: un anuncio
 * retirado no puede aparecer en ninguna rejilla, ni siquiera en la de su
 * dueña.
 */

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buscarCatalogo } from "@/lib/anuncios/catalogo";
import {
  borrarUsuarioDePrueba,
  clienteAnonimo,
  crearUsuarioDePrueba,
  HAY_BASE_DE_DATOS,
  type UsuarioDePrueba,
} from "./entorno";

describe.skipIf(!HAY_BASE_DE_DATOS)("la consulta del catálogo", () => {
  let ana: UsuarioDePrueba;
  const marca = `Marca${Math.random().toString(36).slice(2, 8)}`;

  async function sembrar(
    titulo: string,
    extra: Record<string, unknown> = {},
  ): Promise<string> {
    const { data, error } = await ana.cliente
      .from("anuncios")
      .insert({
        vendedor: ana.id,
        tipo: "prenda",
        titulo,
        slug: "sembrado",
        talla: "3-6-meses",
        categoria: "bodies",
        estado: "buen-estado",
        precio_centimos: 1000,
        acepta_entrega_mano: true,
        marca,
        provincia: "28",
        ...extra,
      })
      .select("id_publico")
      .single();
    if (error) throw error;
    return data.id_publico as string;
  }

  beforeAll(async () => {
    ana = await crearUsuarioDePrueba("ana-catalogo");

    await sembrar("Body de algodón");
    await sembrar("Pijama de invierno", {
      talla: "9-12-meses",
      categoria: "pijamas",
      precio_centimos: 2500,
      provincia: "08",
    });
    await sembrar("Lote de 10 bodies", {
      tipo: "lote",
      numero_piezas: 10,
      talla_hasta: "6-9-meses",
      precio_centimos: 3000,
    });
    await sembrar("Vestido de niña", {
      categoria: "vestidos",
      genero: "nina",
      talla: "2-anos",
    });
    const vendido = await sembrar("Abrigo vendido", { talla: "2-anos" });
    const retirado = await sembrar("Jersey retirado", { talla: "2-anos" });

    await ana.cliente
      .from("anuncios")
      .update({ situacion: "vendida" })
      .eq("id_publico", vendido);
    await ana.cliente
      .from("anuncios")
      .update({ situacion: "retirada" })
      .eq("id_publico", retirado);
  }, 60_000);

  afterAll(async () => {
    if (ana) await borrarUsuarioDePrueba(ana.id);
  }, 30_000);

  /** Solo lo sembrado aquí: la base de pruebas guarda cosas de otras. */
  async function mias(filtros: Parameters<typeof buscarCatalogo>[1] = {}) {
    const pagina = await buscarCatalogo(clienteAnonimo(), { ...filtros, marca });
    return pagina;
  }

  it("trae los anuncios vivos", async () => {
    const { anuncios } = await mias();
    const titulos = anuncios.map((a) => a.titulo);
    expect(titulos).toContain("Body de algodón");
    expect(titulos).toContain("Lote de 10 bodies");
  });

  it("un anuncio RETIRADO no sale en ninguna rejilla", async () => {
    const { anuncios } = await mias();
    expect(anuncios.map((a) => a.titulo)).not.toContain("Jersey retirado");
  });

  it("ni siquiera a su dueña, que lo ve en sus anuncios y no aquí", async () => {
    const pagina = await buscarCatalogo(ana.cliente, { marca });
    expect(pagina.anuncios.map((a) => a.titulo)).not.toContain(
      "Jersey retirado",
    );
  });

  it("un anuncio vendido sí sale, porque su página captura búsquedas", async () => {
    const { anuncios } = await mias();
    expect(anuncios.map((a) => a.titulo)).toContain("Abrigo vendido");
  });

  it("pero va detrás de lo que todavía se puede comprar", async () => {
    const { anuncios } = await mias({ tallas: ["2-anos"] });
    const posicionVendido = anuncios.findIndex(
      (a) => a.titulo === "Abrigo vendido",
    );
    const posicionVivo = anuncios.findIndex(
      (a) => a.titulo === "Vestido de niña",
    );
    expect(posicionVivo).toBeGreaterThanOrEqual(0);
    expect(posicionVendido).toBeGreaterThan(posicionVivo);
  });

  it("filtra por varias tallas a la vez, que es como busca una madre", async () => {
    const { anuncios } = await mias({ tallas: ["3-6-meses", "9-12-meses"] });
    const titulos = anuncios.map((a) => a.titulo);
    expect(titulos).toContain("Body de algodón");
    expect(titulos).toContain("Pijama de invierno");
    expect(titulos).not.toContain("Vestido de niña");
  });

  it("deja fuera las prendas sueltas cuando se piden lotes", async () => {
    const { anuncios } = await mias({ tipo: "lote" });
    expect(anuncios).toHaveLength(1);
    expect(anuncios[0]!.titulo).toBe("Lote de 10 bodies");
    expect(anuncios[0]!.numero_piezas).toBe(10);
  });

  it("filtra por categoría y por género", async () => {
    expect((await mias({ categoria: "pijamas" })).anuncios).toHaveLength(1);
    expect((await mias({ genero: "nina" })).anuncios).toHaveLength(1);
  });

  it("la provincia ordena, pero no deja a nadie fuera", async () => {
    // El catálogo es nacional desde el día uno: con poca oferta, esconder
    // lo de otra provincia sería absurdo.
    const { anuncios } = await mias({ provincia: "08" });
    expect(anuncios.length).toBeGreaterThan(1);
    expect(anuncios[0]!.titulo).toBe("Pijama de invierno");
  });

  it("respeta el precio máximo", async () => {
    const { anuncios } = await mias({ precioMaximoCentimos: 1500 });
    expect(anuncios.every((a) => a.precio_centimos <= 1500)).toBe(true);
    expect(anuncios.length).toBeGreaterThan(0);
  });

  it("busca por texto en el título", async () => {
    const { anuncios } = await mias({ texto: "pijama" });
    expect(anuncios).toHaveLength(1);
    expect(anuncios[0]!.titulo).toBe("Pijama de invierno");
  });

  it("los comodines de PostgreSQL no se cuelan en la búsqueda", async () => {
    // En un like, % y _ son comodines. Sin escaparlos, buscar "%" devuelve
    // el catálogo entero y "100% algodón" devuelve cualquier cosa.
    expect((await mias({ texto: "%" })).anuncios).toHaveLength(0);
    expect((await mias({ texto: "_" })).anuncios).toHaveLength(0);
    expect((await mias({ texto: "pijama%invierno" })).anuncios).toHaveLength(0);
  });

  it("una comilla en la búsqueda no rompe la consulta", async () => {
    const { anuncios } = await mias({ texto: "d'Hondt' or 1=1 --" });
    expect(anuncios).toHaveLength(0);
  });

  it("el total cuenta lo que hay, no lo que cabe en la página", async () => {
    const pagina = await mias();
    expect(pagina.total).toBe(pagina.anuncios.length);
    expect(pagina.hayMas).toBe(false);
  });

  it("una página más allá del final devuelve vacío, no un error", async () => {
    const pagina = await mias({ pagina: 7 });
    expect(pagina.anuncios).toHaveLength(0);
    expect(pagina.hayMas).toBe(false);
    expect(pagina.total).toBeGreaterThan(0);
  });

  it("una página cero o negativa se trata como la primera", async () => {
    const primera = await mias({ pagina: 1 });
    expect((await mias({ pagina: 0 })).anuncios).toHaveLength(
      primera.anuncios.length,
    );
    expect((await mias({ pagina: -3 })).anuncios).toHaveLength(
      primera.anuncios.length,
    );
  });

  it("una talla que no existe no devuelve el catálogo entero", async () => {
    const { anuncios } = await mias({ tallas: ["talla-inventada"] });
    expect(anuncios).toHaveLength(0);
  });
});
