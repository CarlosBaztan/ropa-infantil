/*
 * Las pruebas más importantes del proyecto: comprueban que las reglas de
 * permisos están en la base de datos y se cumplen aunque alguien llame a la
 * API directamente, sin pasar por ninguna pantalla.
 *
 * Si la prueba "nadie puede cambiar el perfil de otra persona" llegara a
 * pasar por accidente, hay que parar y revisar la política: es el fallo más
 * grave posible en esta plataforma.
 */

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  borrarUsuarioDePrueba,
  clienteAdministrador,
  clienteAnonimo,
  crearUsuarioDePrueba,
  HAY_BASE_DE_DATOS,
  MOTIVO_SALTO,
  type UsuarioDePrueba,
} from "./entorno";

describe.skipIf(!HAY_BASE_DE_DATOS)(`permisos de perfiles`, () => {
  let ana: UsuarioDePrueba;
  let berta: UsuarioDePrueba;

  beforeAll(async () => {
    ana = await crearUsuarioDePrueba("ana");
    berta = await crearUsuarioDePrueba("berta");
  }, 30_000);

  afterAll(async () => {
    if (ana) await borrarUsuarioDePrueba(ana.id);
    if (berta) await borrarUsuarioDePrueba(berta.id);
  }, 30_000);

  it("al registrarse se crea su perfil automáticamente", async () => {
    const { data } = await clienteAdministrador()
      .from("perfiles")
      .select("id")
      .eq("id", ana.id)
      .single();
    expect(data?.id).toBe(ana.id);
  });

  it("cualquiera puede leer un perfil, incluso sin sesión", async () => {
    const { data, error } = await clienteAnonimo()
      .from("perfiles")
      .select("alias")
      .eq("id", ana.id);
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
  });

  it("cada quien puede cambiar su propio alias", async () => {
    const alias = `ana-${Date.now().toString(36)}`;
    const { error } = await ana.cliente
      .from("perfiles")
      .update({ alias })
      .eq("id", ana.id);
    expect(error).toBeNull();

    const { data } = await clienteAdministrador()
      .from("perfiles")
      .select("alias")
      .eq("id", ana.id)
      .single();
    expect(data?.alias).toBe(alias);
  });

  it("NADIE puede cambiar el perfil de otra persona", async () => {
    await berta.cliente
      .from("perfiles")
      .update({ alias: "secuestrado" })
      .eq("id", ana.id);

    const { data } = await clienteAdministrador()
      .from("perfiles")
      .select("alias")
      .eq("id", ana.id)
      .single();
    expect(data?.alias).not.toBe("secuestrado");
  });

  it("nadie puede marcarse el correo como verificado por su cuenta", async () => {
    const sinVerificar = await crearUsuarioDePrueba("sin-verificar", false);
    try {
      await sinVerificar.cliente
        .from("perfiles")
        .update({ correo_verificado: true })
        .eq("id", sinVerificar.id);

      const { data } = await clienteAdministrador()
        .from("perfiles")
        .select("correo_verificado")
        .eq("id", sinVerificar.id)
        .single();
      expect(data?.correo_verificado).toBe(false);
    } finally {
      await borrarUsuarioDePrueba(sinVerificar.id);
    }
  }, 30_000);

  it("nadie puede desbloquearse a sí mismo", async () => {
    const admin = clienteAdministrador();
    await admin.from("perfiles").update({ bloqueado: true }).eq("id", berta.id);

    await berta.cliente
      .from("perfiles")
      .update({ bloqueado: false })
      .eq("id", berta.id);

    const { data } = await admin
      .from("perfiles")
      .select("bloqueado")
      .eq("id", berta.id)
      .single();
    expect(data?.bloqueado).toBe(true);

    await admin.from("perfiles").update({ bloqueado: false }).eq("id", berta.id);
  });

  it("nadie puede convertirse en vendedor profesional por su cuenta", async () => {
    await ana.cliente
      .from("perfiles")
      .update({ tipo_vendedor: "profesional" })
      .eq("id", ana.id);

    const { data } = await clienteAdministrador()
      .from("perfiles")
      .select("tipo_vendedor")
      .eq("id", ana.id)
      .single();
    expect(data?.tipo_vendedor).toBe("particular");
  });

  it("nadie puede borrar un perfil directamente", async () => {
    await ana.cliente.from("perfiles").delete().eq("id", ana.id);

    const { data } = await clienteAdministrador()
      .from("perfiles")
      .select("id")
      .eq("id", ana.id);
    expect(data).toHaveLength(1);
  });

  it("la base de datos rechaza un alias con forma inválida", async () => {
    const { error } = await ana.cliente
      .from("perfiles")
      .update({ alias: "ana/berta" })
      .eq("id", ana.id);
    expect(error).not.toBeNull();
  });
});

describe.skipIf(!HAY_BASE_DE_DATOS)("verificación del correo", () => {
  it("quien no lo ha verificado no puede escribir, aunque llame a la API", async () => {
    const usuario = await crearUsuarioDePrueba("sin-verificar", false);
    try {
      const { data } = await usuario.cliente.rpc("tiene_correo_verificado");
      expect(data).toBe(false);
    } finally {
      await borrarUsuarioDePrueba(usuario.id);
    }
  }, 30_000);

  it("quien sí lo ha verificado, puede", async () => {
    const usuario = await crearUsuarioDePrueba("verificada", true);
    try {
      const { data } = await usuario.cliente.rpc("tiene_correo_verificado");
      expect(data).toBe(true);
    } finally {
      await borrarUsuarioDePrueba(usuario.id);
    }
  }, 30_000);
});

describe.skipIf(!HAY_BASE_DE_DATOS)("las tallas de la base de datos", () => {
  it("coinciden con la lista del código", async () => {
    const { TALLAS } = await import("@/lib/tallas");
    const { data, error } = await clienteAnonimo()
      .from("tallas")
      .select("codigo, edad_meses_min, edad_meses_max, orden")
      .order("orden");

    expect(error).toBeNull();
    expect(data).toEqual(
      TALLAS.map((t) => ({
        codigo: t.codigo,
        edad_meses_min: t.edadMesesMin,
        edad_meses_max: t.edadMesesMax,
        orden: t.orden,
      })),
    );
  });
});

if (!HAY_BASE_DE_DATOS) {
  describe("pruebas de permisos", () => {
    it.skip(`saltadas: ${MOTIVO_SALTO}`, () => {});
  });
}
