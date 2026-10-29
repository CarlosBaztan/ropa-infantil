/*
 * Que nadie se quede sin alias.
 *
 * El alias es la única forma de nombrar a quien vende y el enlace a su
 * armario. Antes era opcional y nada lo exigía para publicar, así que una
 * ficha podía quedarse sin nombre; desde la migración 0011 cada perfil
 * nace con uno puesto.
 *
 * Se comprobó la salida contraria —exigirlo al publicar— y se descartó:
 * mandar a quien acaba de registrarse a inventarse un apodo antes de
 * dejarle subir la primera foto es el tropiezo que vacía un catálogo.
 */

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  borrarUsuarioDePrueba,
  clienteAnonimo,
  crearUsuarioDePrueba,
  HAY_BASE_DE_DATOS,
  type UsuarioDePrueba,
} from "./entorno";

/** La misma forma que exige la restricción de la tabla. */
const FORMA_DEL_ALIAS = /^[a-z0-9][a-z0-9_-]{1,28}[a-z0-9]$/;

describe.skipIf(!HAY_BASE_DE_DATOS)("el alias de cada perfil", () => {
  let ana: UsuarioDePrueba;
  let berta: UsuarioDePrueba;

  async function aliasDe(quien: UsuarioDePrueba): Promise<string | null> {
    const { data } = await quien.cliente
      .from("perfiles")
      .select("alias")
      .eq("id", quien.id)
      .single();
    return (data?.alias as string | null) ?? null;
  }

  beforeAll(async () => {
    ana = await crearUsuarioDePrueba("ana-alias");
    berta = await crearUsuarioDePrueba("berta-alias");
  }, 40_000);

  afterAll(async () => {
    if (ana) await borrarUsuarioDePrueba(ana.id);
    if (berta) await borrarUsuarioDePrueba(berta.id);
  }, 30_000);

  it("un perfil recién creado ya trae alias", async () => {
    expect(await aliasDe(ana)).toBeTruthy();
  });

  it("el alias generado vale como dirección pública", async () => {
    const alias = await aliasDe(ana);
    expect(alias).toMatch(FORMA_DEL_ALIAS);
    expect(alias!.length).toBeLessThanOrEqual(30);
  });

  it("no sale del correo, que llevaría el nombre de alguien", async () => {
    const alias = await aliasDe(ana);
    const antesDeLaArroba = ana.correo.split("@")[0]!;
    expect(alias).not.toContain(antesDeLaArroba);
    expect(alias).not.toContain("ana-alias");
  });

  it("dos cuentas no comparten alias", async () => {
    expect(await aliasDe(ana)).not.toBe(await aliasDe(berta));
  });

  it("NADIE puede dejarse sin alias, ni siquiera a sí misma", async () => {
    const { error } = await ana.cliente
      .from("perfiles")
      .update({ alias: null })
      .eq("id", ana.id);
    expect(error).not.toBeNull();
    expect(await aliasDe(ana)).toBeTruthy();
  });

  it("el armario de ese alias se puede buscar sin cuenta", async () => {
    const alias = await aliasDe(ana);
    const { data } = await clienteAnonimo()
      .from("perfiles")
      .select("alias")
      .eq("alias", alias!)
      .maybeSingle();
    expect(data?.alias).toBe(alias);
  });

  it("un anuncio recién publicado ya sabe decir quién lo vende", async () => {
    const { data: creado } = await ana.cliente
      .from("anuncios")
      .insert({
        vendedor: ana.id,
        tipo: "prenda",
        titulo: "Jersey de lana",
        slug: "jersey-de-lana",
        talla: "2-anos",
        categoria: "jerseis",
        estado: "buen-estado",
        precio_centimos: 1200,
        acepta_entrega_mano: true,
      })
      .select("id")
      .single();

    const { data } = await clienteAnonimo()
      .from("anuncios")
      .select("titulo, perfil:perfiles!vendedor ( alias )")
      .eq("id", creado!.id)
      .single();

    const perfil = data?.perfil as unknown as { alias: string } | null;
    expect(perfil?.alias).toBeTruthy();
  });
});
