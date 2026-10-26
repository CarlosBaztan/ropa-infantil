/*
 * Permisos de las fotos. Las imágenes en sí viven en el almacén; esta
 * tabla es el índice que dice qué foto pertenece a qué anuncio y en qué
 * orden se muestran.
 */

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  borrarUsuarioDePrueba,
  clienteAdministrador,
  clienteAnonimo,
  crearUsuarioDePrueba,
  HAY_BASE_DE_DATOS,
  type UsuarioDePrueba,
} from "./entorno";

describe.skipIf(!HAY_BASE_DE_DATOS)("permisos de las fotos", () => {
  let ana: UsuarioDePrueba;
  let berta: UsuarioDePrueba;
  let anuncioDeAna: string;

  beforeAll(async () => {
    ana = await crearUsuarioDePrueba("ana-fotos");
    berta = await crearUsuarioDePrueba("berta-fotos");

    const { data, error } = await ana.cliente
      .from("anuncios")
      .insert({
        vendedor: ana.id,
        tipo: "prenda",
        titulo: "Prenda con fotos",
        slug: "prenda-con-fotos",
        talla: "3-6-meses",
        categoria: "vestidos",
        estado: "como-nuevo",
        precio_centimos: 1000,
        acepta_entrega_mano: true,
      })
      .select("id")
      .single();
    if (error) throw error;
    anuncioDeAna = data.id;
  }, 40_000);

  afterAll(async () => {
    if (ana) await borrarUsuarioDePrueba(ana.id);
    if (berta) await borrarUsuarioDePrueba(berta.id);
  }, 30_000);

  function unaFoto(anuncio: string, orden: number) {
    return {
      anuncio,
      ruta: `${anuncio}/${orden}.webp`,
      orden,
      ancho: 1600,
      alto: 1200,
    };
  }

  it("cada quien registra fotos en sus anuncios", async () => {
    const { error } = await ana.cliente
      .from("fotos")
      .insert(unaFoto(anuncioDeAna, 1));
    expect(error).toBeNull();
  });

  it("NADIE puede colgar fotos en el anuncio de otra persona", async () => {
    const { error } = await berta.cliente
      .from("fotos")
      .insert(unaFoto(anuncioDeAna, 2));
    expect(error).not.toBeNull();
  });

  it("las fotos las ve cualquiera, sin cuenta", async () => {
    const { data, error } = await clienteAnonimo()
      .from("fotos")
      .select("ruta")
      .eq("anuncio", anuncioDeAna);
    expect(error).toBeNull();
    expect(data?.length).toBeGreaterThan(0);
  });

  it("NADIE puede borrar las fotos de otra persona", async () => {
    await berta.cliente.from("fotos").delete().eq("anuncio", anuncioDeAna);

    const { data } = await clienteAdministrador()
      .from("fotos")
      .select("id")
      .eq("anuncio", anuncioDeAna);
    expect(data?.length).toBeGreaterThan(0);
  });

  it("no admite más de cinco", async () => {
    const { error } = await ana.cliente
      .from("fotos")
      .insert(unaFoto(anuncioDeAna, 6));
    expect(error).not.toBeNull();
  });

  it("no admite dos fotos en la misma posición", async () => {
    const { error } = await ana.cliente
      .from("fotos")
      .insert(unaFoto(anuncioDeAna, 1));
    expect(error).not.toBeNull();
  });

  it("exige ancho y alto, porque sin ellos la página salta al cargar", async () => {
    const { error } = await ana.cliente.from("fotos").insert({
      anuncio: anuncioDeAna,
      ruta: `${anuncioDeAna}/3.webp`,
      orden: 3,
      ancho: 0,
      alto: 1200,
    });
    expect(error).not.toBeNull();
  });

  it("al borrar el anuncio se van sus fotos con él", async () => {
    const { data: otro } = await ana.cliente
      .from("anuncios")
      .insert({
        vendedor: ana.id,
        tipo: "prenda",
        titulo: "Para borrar con fotos",
        slug: "para-borrar",
        talla: "3-6-meses",
        categoria: "vestidos",
        estado: "como-nuevo",
        precio_centimos: 1000,
        acepta_entrega_mano: true,
      })
      .select("id")
      .single();

    await ana.cliente.from("fotos").insert(unaFoto(otro!.id, 1));
    await ana.cliente.from("anuncios").delete().eq("id", otro!.id);

    const { data } = await clienteAdministrador()
      .from("fotos")
      .select("id")
      .eq("anuncio", otro!.id);
    expect(data).toHaveLength(0);
  });

  it("el cubo de fotos existe y tiene límite de tamaño", async () => {
    const { data } = await clienteAdministrador()
      .storage.listBuckets();
    const cubo = data?.find((c) => c.id === "anuncios");
    expect(cubo).toBeDefined();
    expect(cubo?.public).toBe(true);
  });
});
