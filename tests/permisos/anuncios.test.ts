/*
 * Permisos de los anuncios. Es la tabla sobre la que escribirán los cuatro
 * planes siguientes, así que lo que se cierre mal aquí se arrastra.
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

function unAnuncio(vendedor: string) {
  return {
    vendedor,
    tipo: "prenda" as const,
    titulo: "Vestido de flores",
    slug: "vestido-de-flores",
    talla: "3-6-meses",
    categoria: "vestidos",
    estado: "como-nuevo",
    precio_centimos: 1250,
    acepta_entrega_mano: true,
    acepta_envio: false,
  };
}

describe.skipIf(!HAY_BASE_DE_DATOS)("permisos de los anuncios", () => {
  let ana: UsuarioDePrueba;
  let berta: UsuarioDePrueba;
  let anuncioDeAna: string;

  beforeAll(async () => {
    ana = await crearUsuarioDePrueba("ana-anuncios");
    berta = await crearUsuarioDePrueba("berta-anuncios");

    const { data, error } = await ana.cliente
      .from("anuncios")
      .insert(unAnuncio(ana.id))
      .select("id")
      .single();
    if (error) throw error;
    anuncioDeAna = data.id;
  }, 40_000);

  afterAll(async () => {
    if (ana) await borrarUsuarioDePrueba(ana.id);
    if (berta) await borrarUsuarioDePrueba(berta.id);
  }, 30_000);

  it("cualquiera ve un anuncio activo, sin tener cuenta", async () => {
    const { data, error } = await clienteAnonimo()
      .from("anuncios")
      .select("id, titulo")
      .eq("id", anuncioDeAna);
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
  });

  it("NADIE puede editar el anuncio de otra persona", async () => {
    await berta.cliente
      .from("anuncios")
      .update({ precio_centimos: 100 })
      .eq("id", anuncioDeAna);

    const { data } = await clienteAdministrador()
      .from("anuncios")
      .select("precio_centimos")
      .eq("id", anuncioDeAna)
      .single();
    expect(data?.precio_centimos).toBe(1250);
  });

  it("NADIE puede borrar el anuncio de otra persona", async () => {
    await berta.cliente.from("anuncios").delete().eq("id", anuncioDeAna);

    const { data } = await clienteAdministrador()
      .from("anuncios")
      .select("id")
      .eq("id", anuncioDeAna);
    expect(data).toHaveLength(1);
  });

  it("nadie puede publicar en nombre de otra persona", async () => {
    const { error } = await berta.cliente
      .from("anuncios")
      .insert(unAnuncio(ana.id));
    expect(error).not.toBeNull();
  });

  it("quien no ha declarado su edad no puede publicar", async () => {
    // Es el caso de quien entra con Google. Tiene cuenta, pero contratar
    // exige ser mayor de edad.
    const sinFecha = await crearUsuarioDePrueba("sin-fecha-anuncio", true, {});
    try {
      const { error } = await sinFecha.cliente
        .from("anuncios")
        .insert(unAnuncio(sinFecha.id));
      expect(error).not.toBeNull();
    } finally {
      await borrarUsuarioDePrueba(sinFecha.id);
    }
  }, 30_000);

  it("rechaza un precio de cero o negativo", async () => {
    const a = await ana.cliente
      .from("anuncios")
      .insert({ ...unAnuncio(ana.id), precio_centimos: 0 });
    expect(a.error).not.toBeNull();

    const b = await ana.cliente
      .from("anuncios")
      .insert({ ...unAnuncio(ana.id), precio_centimos: -500 });
    expect(b.error).not.toBeNull();
  });

  it("rechaza un precio absurdo para ropa infantil", async () => {
    const { error } = await ana.cliente
      .from("anuncios")
      .insert({ ...unAnuncio(ana.id), precio_centimos: 500_000 });
    expect(error).not.toBeNull();
  });

  it("rechaza un anuncio sin ninguna forma de entrega", async () => {
    const { error } = await ana.cliente.from("anuncios").insert({
      ...unAnuncio(ana.id),
      acepta_entrega_mano: false,
      acepta_envio: false,
    });
    expect(error).not.toBeNull();
  });

  it("rechaza una categoría inventada", async () => {
    const { error } = await ana.cliente
      .from("anuncios")
      .insert({ ...unAnuncio(ana.id), categoria: "pijamitas" });
    expect(error).not.toBeNull();
  });

  it("rechaza una talla que no existe", async () => {
    const { error } = await ana.cliente
      .from("anuncios")
      .insert({ ...unAnuncio(ana.id), talla: "4-meses" });
    expect(error).not.toBeNull();
  });

  it("un lote necesita al menos dos piezas", async () => {
    const { error } = await ana.cliente.from("anuncios").insert({
      ...unAnuncio(ana.id),
      tipo: "lote",
      numero_piezas: 1,
    });
    expect(error).not.toBeNull();
  });

  it("rechaza un lote con el rango de tallas al revés", async () => {
    // Se compara por el orden de la tabla de tallas, no por el texto:
    // "12-18-meses" es mayor que "3-6-meses" aunque alfabéticamente no.
    const { error } = await ana.cliente.from("anuncios").insert({
      ...unAnuncio(ana.id),
      tipo: "lote",
      numero_piezas: 8,
      talla: "6-9-meses",
      talla_hasta: "3-6-meses",
    });
    expect(error).not.toBeNull();
  });

  it("acepta un lote bien formado", async () => {
    const { error } = await ana.cliente.from("anuncios").insert({
      ...unAnuncio(ana.id),
      tipo: "lote",
      titulo: "Lote de 12 bodies",
      numero_piezas: 12,
      talla: "3-6-meses",
      talla_hasta: "9-12-meses",
      categoria: "bodies",
      precio_centimos: 4500,
    });
    expect(error).toBeNull();
  });

  it("una prenda suelta no admite número de piezas", async () => {
    const { error } = await ana.cliente
      .from("anuncios")
      .insert({ ...unAnuncio(ana.id), numero_piezas: 3 });
    expect(error).not.toBeNull();
  });

  it("un anuncio retirado solo lo ve su dueña", async () => {
    const { data: creado } = await ana.cliente
      .from("anuncios")
      .insert({ ...unAnuncio(ana.id), titulo: "Para retirar" })
      .select("id")
      .single();

    await ana.cliente
      .from("anuncios")
      .update({ situacion: "retirada" })
      .eq("id", creado!.id);

    const { data: paraAnonimo } = await clienteAnonimo()
      .from("anuncios")
      .select("id")
      .eq("id", creado!.id);
    expect(paraAnonimo).toHaveLength(0);

    const { data: paraElla } = await ana.cliente
      .from("anuncios")
      .select("id")
      .eq("id", creado!.id);
    expect(paraElla).toHaveLength(1);
  });

  it("un anuncio vendido sigue siendo visible para todo el mundo", async () => {
    // Su página tiene que seguir viva: es lo que captura las búsquedas
    // muy concretas, que serán el único tráfico al principio.
    const { data: creado } = await ana.cliente
      .from("anuncios")
      .insert({ ...unAnuncio(ana.id), titulo: "Para vender" })
      .select("id")
      .single();

    await ana.cliente
      .from("anuncios")
      .update({ situacion: "vendida" })
      .eq("id", creado!.id);

    const { data } = await clienteAnonimo()
      .from("anuncios")
      .select("id")
      .eq("id", creado!.id);
    expect(data).toHaveLength(1);
  });

  it("las categorías de la base coinciden con las del código", async () => {
    const { CATEGORIAS } = await import("@/lib/anuncios/modelo");
    const { data, error } = await clienteAnonimo()
      .from("categorias")
      .select("codigo, etiqueta")
      .order("orden");

    expect(error).toBeNull();
    expect(data).toEqual(
      CATEGORIAS.map((c) => ({ codigo: c.codigo, etiqueta: c.etiqueta })),
    );
  });
});
