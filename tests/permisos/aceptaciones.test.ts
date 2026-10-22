/*
 * Una aceptación es la prueba de que alguien aceptó unas condiciones
 * concretas en una fecha concreta. Si se pudiera editar o borrar, no
 * serviría como prueba de nada, así que eso también se comprueba aquí.
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

const VERSION = "2026-10-22";

describe.skipIf(!HAY_BASE_DE_DATOS)("permisos de las aceptaciones", () => {
  let ana: UsuarioDePrueba;
  let berta: UsuarioDePrueba;

  beforeAll(async () => {
    ana = await crearUsuarioDePrueba("ana-legal");
    berta = await crearUsuarioDePrueba("berta-legal");
  }, 30_000);

  afterAll(async () => {
    if (ana) await borrarUsuarioDePrueba(ana.id);
    if (berta) await borrarUsuarioDePrueba(berta.id);
  }, 30_000);

  it("los textos legales los lee cualquiera, sin sesión", async () => {
    const { data, error } = await clienteAnonimo()
      .from("documentos_legales")
      .select("slug, version");
    expect(error).toBeNull();
    expect(data?.length).toBeGreaterThanOrEqual(4);
  });

  it("cada quien puede registrar que ha aceptado", async () => {
    const { error } = await ana.cliente.from("aceptaciones").insert({
      usuario: ana.id,
      documento_slug: "condiciones",
      documento_version: VERSION,
    });
    expect(error).toBeNull();
  });

  it("NADIE puede aceptar en nombre de otra persona", async () => {
    const { error } = await berta.cliente.from("aceptaciones").insert({
      usuario: ana.id,
      documento_slug: "privacidad",
      documento_version: VERSION,
    });
    expect(error).not.toBeNull();
  });

  it("cada quien ve solo sus propias aceptaciones", async () => {
    const { data } = await berta.cliente.from("aceptaciones").select("usuario");
    expect(data?.every((fila) => fila.usuario === berta.id)).toBe(true);
  });

  it("una aceptación no se puede modificar: es un hecho con fecha", async () => {
    const antes = await clienteAdministrador()
      .from("aceptaciones")
      .select("fecha")
      .eq("usuario", ana.id)
      .single();

    await ana.cliente
      .from("aceptaciones")
      .update({ fecha: "2000-01-01T00:00:00Z" })
      .eq("usuario", ana.id);

    const despues = await clienteAdministrador()
      .from("aceptaciones")
      .select("fecha")
      .eq("usuario", ana.id)
      .single();

    expect(despues.data?.fecha).toBe(antes.data?.fecha);
  });

  it("una aceptación no se puede borrar", async () => {
    await ana.cliente.from("aceptaciones").delete().eq("usuario", ana.id);

    const { data } = await clienteAdministrador()
      .from("aceptaciones")
      .select("id")
      .eq("usuario", ana.id);
    expect(data?.length).toBeGreaterThan(0);
  });

  it("no se puede aceptar una versión que no existe", async () => {
    const { error } = await ana.cliente.from("aceptaciones").insert({
      usuario: ana.id,
      documento_slug: "condiciones",
      documento_version: "version-inventada",
    });
    expect(error).not.toBeNull();
  });
});
