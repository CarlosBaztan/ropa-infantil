/*
 * La ficha pública, contra la base de datos de verdad.
 *
 * Aquí no se prueba la pantalla: se prueba la consulta que la pantalla
 * ejecuta, con un cliente anónimo, que es lo que de verdad decide qué ve
 * un visitante. Las tres situaciones del diseño —viva, vendida y
 * retirada— tienen que contestar cosas distintas.
 */

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  buscarAlternativas,
  buscarAnuncio,
} from "@/lib/anuncios/consulta";
import { urlDeFoto } from "@/lib/anuncios/fotos";
import {
  borrarUsuarioDePrueba,
  clienteAnonimo,
  crearUsuarioDePrueba,
  HAY_BASE_DE_DATOS,
  type UsuarioDePrueba,
} from "./entorno";

/** Un WebP de un píxel: lo justo para comprobar que el almacén sirve. */
const WEBP_DE_UN_PIXEL = Buffer.from(
  "UklGRh4AAABXRUJQVlA4TBEAAAAvAAAAAAfQ//73v/+BiOh/AAA=",
  "base64",
);

describe.skipIf(!HAY_BASE_DE_DATOS)("la ficha pública de un anuncio", () => {
  let ana: UsuarioDePrueba;
  let alias: string;
  let viva: { id: string; id_publico: string };
  let vendida: { id: string; id_publico: string };
  let retirada: { id: string; id_publico: string };

  async function crearAnuncio(
    titulo: string,
    extra: Record<string, unknown> = {},
  ) {
    const { data, error } = await ana.cliente
      .from("anuncios")
      .insert({
        vendedor: ana.id,
        tipo: "lote",
        titulo,
        slug: "lote-de-prueba",
        talla: "3-6-meses",
        talla_hasta: "6-9-meses",
        numero_piezas: 12,
        categoria: "bodies",
        estado: "buen-estado",
        precio_centimos: 4500,
        acepta_entrega_mano: true,
        provincia: "28",
        ciudad: "Alcobendas",
        ...extra,
      })
      .select("id, id_publico")
      .single();
    if (error) throw error;
    return data as { id: string; id_publico: string };
  }

  beforeAll(async () => {
    ana = await crearUsuarioDePrueba("ana-ficha");

    // El alias no lo pone el registro automaticamente, y es el unico
    // nombre con el que se puede llamar a quien vende.
    alias = `ana-${Math.random().toString(36).slice(2, 8)}`;
    await ana.cliente.from("perfiles").update({ alias }).eq("id", ana.id);

    viva = await crearAnuncio("Lote de 12 bodies");
    vendida = await crearAnuncio("Lote vendido");
    retirada = await crearAnuncio("Lote retirado", { situacion: "retirada" });

    await ana.cliente
      .from("anuncios")
      .update({ situacion: "vendida" })
      .eq("id", vendida.id);

    // Dos fotos, insertadas al revés para comprobar que la consulta las
    // devuelve ordenadas y no según le apetezca a la base.
    for (const orden of [2, 1]) {
      const ruta = `${viva.id}/${orden}.webp`;
      const { error } = await ana.cliente.storage
        .from("anuncios")
        .upload(ruta, WEBP_DE_UN_PIXEL, { contentType: "image/webp" });
      if (error) throw error;
      const { error: errorFila } = await ana.cliente.from("fotos").insert({
        anuncio: viva.id,
        ruta,
        orden,
        ancho: 1600,
        alto: 1200,
      });
      if (errorFila) throw errorFila;
    }
  }, 60_000);

  afterAll(async () => {
    if (ana) await borrarUsuarioDePrueba(ana.id);
  }, 30_000);

  it("un anuncio vivo lo ve cualquiera, sin cuenta", async () => {
    const anuncio = await buscarAnuncio(clienteAnonimo(), viva.id_publico);
    expect(anuncio).not.toBeNull();
    expect(anuncio!.titulo).toBe("Lote de 12 bodies");
    expect(anuncio!.numero_piezas).toBe(12);
    expect(anuncio!.precio_centimos).toBe(4500);
  });

  it("trae el alias de quien vende, que es la única forma de llamarla", async () => {
    const anuncio = await buscarAnuncio(clienteAnonimo(), viva.id_publico);
    expect(anuncio!.perfil?.alias).toBe(alias);
  });

  it("trae las fotos en su orden, no en el que estén guardadas", async () => {
    const anuncio = await buscarAnuncio(clienteAnonimo(), viva.id_publico);
    expect(anuncio!.fotos.map((f) => f.orden)).toEqual([1, 2]);
    expect(anuncio!.fotos[0]!.ancho).toBe(1600);
  });

  it("las fotos se sirven de verdad desde el almacén público", async () => {
    const anonimo = clienteAnonimo();
    const anuncio = await buscarAnuncio(anonimo, viva.id_publico);
    const url = urlDeFoto(anuncio!.fotos[0]!.ruta);

    const respuesta = await fetch(url);
    expect(respuesta.ok).toBe(true);
    expect(respuesta.headers.get("content-type")).toContain("image");
  }, 20_000);

  it("un anuncio vendido NO desaparece: su página sigue viva", async () => {
    const anuncio = await buscarAnuncio(clienteAnonimo(), vendida.id_publico);
    expect(anuncio).not.toBeNull();
    expect(anuncio!.situacion).toBe("vendida");
    expect(anuncio!.vendido_el).not.toBeNull();
  });

  it("un anuncio retirado no lo ve nadie de fuera", async () => {
    const anuncio = await buscarAnuncio(clienteAnonimo(), retirada.id_publico);
    expect(anuncio).toBeNull();
  });

  it("pero su dueña sí lo ve, para poder recuperarlo", async () => {
    const anuncio = await buscarAnuncio(ana.cliente, retirada.id_publico);
    expect(anuncio).not.toBeNull();
    expect(anuncio!.situacion).toBe("retirada");
  });

  it("un identificador que no existe no revienta, devuelve nada", async () => {
    expect(await buscarAnuncio(clienteAnonimo(), "zzzzzz")).toBeNull();
  });

  it("las alternativas son de la misma talla, vivas, y sin repetir la que se mira", async () => {
    // Con un límite amplio a propósito: la base de pruebas es una sola y
    // otras pruebas siembran anuncios de esta misma talla a la vez. Con
    // el límite de cuatro de la ficha, los suyos desplazaban al nuestro y
    // esta prueba fallaba por una carrera, no por un fallo del código.
    const otras = await buscarAlternativas(
      clienteAnonimo(),
      "3-6-meses",
      vendida.id_publico,
      50,
    );
    const codigos = otras.map((o) => o.id_publico);
    expect(codigos).toContain(viva.id_publico);
    expect(codigos).not.toContain(vendida.id_publico);
    expect(codigos).not.toContain(retirada.id_publico);
  });
});
