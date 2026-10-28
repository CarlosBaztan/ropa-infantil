/*
 * Las transiciones de un anuncio: reservar, vender, retirar y volver a
 * publicar.
 *
 * Son las acciones de «Mis anuncios», y la más importante del proyecto
 * entero es marcar vendido: la fecha que deja es el dato con el que se
 * medirá si esto funciona. Por eso se prueba que la escribe la base de
 * datos sola y que nadie de fuera puede tocarla.
 */

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buscarMisAnuncios } from "@/lib/anuncios/consulta";
import {
  borrarUsuarioDePrueba,
  clienteAdministrador,
  clienteAnonimo,
  crearUsuarioDePrueba,
  HAY_BASE_DE_DATOS,
  type UsuarioDePrueba,
} from "./entorno";

describe.skipIf(!HAY_BASE_DE_DATOS)("las transiciones de un anuncio", () => {
  let ana: UsuarioDePrueba;
  let berta: UsuarioDePrueba;

  async function unAnuncioDe(
    quien: UsuarioDePrueba,
    titulo = "Pijama de invierno",
  ) {
    const { data, error } = await quien.cliente
      .from("anuncios")
      .insert({
        vendedor: quien.id,
        tipo: "prenda",
        titulo,
        slug: "pijama-de-invierno",
        talla: "12-18-meses",
        categoria: "pijamas",
        estado: "buen-estado",
        precio_centimos: 900,
        acepta_entrega_mano: true,
      })
      .select("id, id_publico, publicado_el")
      .single();
    if (error) throw error;
    return data as { id: string; id_publico: string; publicado_el: string };
  }

  beforeAll(async () => {
    ana = await crearUsuarioDePrueba("ana-transiciones");
    berta = await crearUsuarioDePrueba("berta-transiciones");
  }, 40_000);

  afterAll(async () => {
    if (ana) await borrarUsuarioDePrueba(ana.id);
    if (berta) await borrarUsuarioDePrueba(berta.id);
  }, 30_000);

  it("la dueña reserva su anuncio", async () => {
    const anuncio = await unAnuncioDe(ana);
    const { error } = await ana.cliente
      .from("anuncios")
      .update({ situacion: "reservada" })
      .eq("id", anuncio.id);
    expect(error).toBeNull();
  });

  it("marcar vendido deja la fecha, y la pone la base de datos", async () => {
    const anuncio = await unAnuncioDe(ana);
    await ana.cliente
      .from("anuncios")
      .update({ situacion: "vendida" })
      .eq("id", anuncio.id);

    const { data } = await ana.cliente
      .from("anuncios")
      .select("situacion, vendido_el")
      .eq("id", anuncio.id)
      .single();

    expect(data?.situacion).toBe("vendida");
    expect(data?.vendido_el).not.toBeNull();
  });

  it("NADIE puede marcar vendido el anuncio de otra persona", async () => {
    const anuncio = await unAnuncioDe(ana);
    await berta.cliente
      .from("anuncios")
      .update({ situacion: "vendida" })
      .eq("id", anuncio.id);

    const { data } = await clienteAdministrador()
      .from("anuncios")
      .select("situacion")
      .eq("id", anuncio.id)
      .single();
    expect(data?.situacion).toBe("activa");
  });

  it("NADIE puede falsear la fecha de venta, ni siquiera la dueña", async () => {
    const anuncio = await unAnuncioDe(ana);
    // La columna no está en el grant, así que PostgREST la rechaza de
    // plano: es la primera de las dos cerraduras.
    const { error } = await ana.cliente
      .from("anuncios")
      .update({ vendido_el: "2020-01-01T00:00:00Z" })
      .eq("id", anuncio.id);
    expect(error).not.toBeNull();
  });

  it("NADIE puede retocar las columnas protegidas de su propio anuncio", async () => {
    /*
     * Esta prueba existe por un agujero real. Supabase concede por omisión
     * TODOS los permisos sobre cada tabla nueva a quien tiene sesión, y
     * nuestro `grant update (columna, columna…)` solo añade: no quita nada.
     * Resultado: la lista cuidadosa de la migración 0008 no restringía
     * nada y desde el navegador se podía falsear la fecha de venta, dejar
     * un anuncio siempre arriba cambiando su fecha de publicación, o
     * cambiarle la talla después de que la gente se hubiera interesado.
     * Lo cerró la migración 0010; si alguien la deshace, esto se entera.
     */
    const anuncio = await unAnuncioDe(ana);

    const intentos = [
      { publicado_el: "2020-01-01T00:00:00Z" },
      { id_publico: "aaaaaa" },
      { slug: "otro-slug" },
      { tipo: "lote" },
      { talla: "9-12-meses" },
      { provincia: "08" },
    ];
    for (const intento of intentos) {
      const { error } = await ana.cliente
        .from("anuncios")
        .update(intento)
        .eq("id", anuncio.id);
      expect(error, `deberia rechazar ${JSON.stringify(intento)}`).not.toBeNull();
    }

    const { data } = await clienteAdministrador()
      .from("anuncios")
      .select("id_publico, slug, tipo, talla, publicado_el")
      .eq("id", anuncio.id)
      .single();
    expect(data?.id_publico).toBe(anuncio.id_publico);
    expect(data?.publicado_el).toBe(anuncio.publicado_el);
    expect(data?.tipo).toBe("prenda");
  });

  it("deshacer una venta marcada por error borra la fecha", async () => {
    // La fecha de venta es el numero con el que se mide el proyecto: un
    // anuncio vivo no puede quedarse con una puesta.
    const anuncio = await unAnuncioDe(ana);
    await ana.cliente
      .from("anuncios")
      .update({ situacion: "vendida" })
      .eq("id", anuncio.id);
    await ana.cliente
      .from("anuncios")
      .update({ situacion: "activa" })
      .eq("id", anuncio.id);

    const { data } = await ana.cliente
      .from("anuncios")
      .select("situacion, vendido_el")
      .eq("id", anuncio.id)
      .single();
    expect(data?.situacion).toBe("activa");
    expect(data?.vendido_el).toBeNull();
  });

  it("NADIE puede cambiar de dueño un anuncio", async () => {
    const anuncio = await unAnuncioDe(ana);
    const { error } = await ana.cliente
      .from("anuncios")
      .update({ vendedor: berta.id })
      .eq("id", anuncio.id);
    expect(error).not.toBeNull();
  });

  it("retirar lo esconde de quien no es su dueña", async () => {
    const anuncio = await unAnuncioDe(ana);
    await ana.cliente
      .from("anuncios")
      .update({ situacion: "retirada" })
      .eq("id", anuncio.id);

    const { data: desdeFuera } = await clienteAnonimo()
      .from("anuncios")
      .select("id")
      .eq("id", anuncio.id);
    expect(desdeFuera).toHaveLength(0);

    const { data: paraElla } = await ana.cliente
      .from("anuncios")
      .select("id")
      .eq("id", anuncio.id);
    expect(paraElla).toHaveLength(1);
  });

  it("un anuncio retirado se puede volver a publicar", async () => {
    const anuncio = await unAnuncioDe(ana);
    await ana.cliente
      .from("anuncios")
      .update({ situacion: "retirada" })
      .eq("id", anuncio.id);
    await ana.cliente
      .from("anuncios")
      .update({ situacion: "activa" })
      .eq("id", anuncio.id);

    const { data } = await clienteAnonimo()
      .from("anuncios")
      .select("situacion")
      .eq("id", anuncio.id)
      .single();
    expect(data?.situacion).toBe("activa");
  });

  it("la dueña borra su anuncio", async () => {
    const anuncio = await unAnuncioDe(ana);
    await ana.cliente.from("anuncios").delete().eq("id", anuncio.id);

    const { data } = await clienteAdministrador()
      .from("anuncios")
      .select("id")
      .eq("id", anuncio.id);
    expect(data).toHaveLength(0);
  });

  it("NADIE puede borrar el anuncio de otra persona", async () => {
    const anuncio = await unAnuncioDe(ana);
    await berta.cliente.from("anuncios").delete().eq("id", anuncio.id);

    const { data } = await clienteAdministrador()
      .from("anuncios")
      .select("id")
      .eq("id", anuncio.id);
    expect(data).toHaveLength(1);
  });

  it("cada quien ve en su listado sus anuncios y solo los suyos", async () => {
    await unAnuncioDe(berta, "El pijama de Berta");

    const deBerta = await buscarMisAnuncios(berta.cliente, berta.id);
    expect(deBerta.length).toBeGreaterThan(0);
    expect(deBerta.every((a) => a.titulo === "El pijama de Berta")).toBe(true);

    const deAna = await buscarMisAnuncios(ana.cliente, ana.id);
    expect(deAna.some((a) => a.titulo === "El pijama de Berta")).toBe(false);
  });

  it("el listado propio incluye los retirados, que es donde se recuperan", async () => {
    const anuncio = await unAnuncioDe(ana, "Para recuperar");
    await ana.cliente
      .from("anuncios")
      .update({ situacion: "retirada" })
      .eq("id", anuncio.id);

    const mios = await buscarMisAnuncios(ana.cliente, ana.id);
    const encontrado = mios.find((a) => a.id === anuncio.id);
    expect(encontrado?.situacion).toBe("retirada");
  });
});
