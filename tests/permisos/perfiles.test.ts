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
  crearUsuarioSinConfirmar,
  HAY_BASE_DE_DATOS,
  intentarAcceso,
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

  it("el perfil no guarda una copia del estado de verificación", async () => {
    // Si alguien vuelve a añadir esa columna, esta prueba lo caza: un dato
    // duplicado del esquema auth acabaría desfasado, y ya pasó una vez.
    const { error } = await clienteAdministrador()
      .from("perfiles")
      .select("correo_verificado")
      .limit(1);
    expect(error).not.toBeNull();
  });

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

  it("la base de datos rechaza una provincia que no existe", async () => {
    const { error } = await ana.cliente
      .from("perfiles")
      .update({ provincia: "99" })
      .eq("id", ana.id);
    expect(error).not.toBeNull();
  });

  it("acepta una provincia de la lista", async () => {
    const { error } = await ana.cliente
      .from("perfiles")
      .update({ provincia: "48" })
      .eq("id", ana.id);
    expect(error).toBeNull();
  });

  it("la fecha de nacimiento del registro llega al perfil", async () => {
    const usuario = await crearUsuarioDePrueba("con-fecha", true, {
      fecha_nacimiento: "1990-05-04",
      acepta_marketing: true,
    });
    try {
      const { data } = await clienteAdministrador()
        .from("perfiles")
        .select("fecha_nacimiento, acepta_marketing")
        .eq("id", usuario.id)
        .single();
      expect(data?.fecha_nacimiento).toBe("1990-05-04");
      expect(data?.acepta_marketing).toBe(true);
    } finally {
      await borrarUsuarioDePrueba(usuario.id);
    }
  }, 30_000);

  it("una fecha de nacimiento corrupta no rompe el registro", async () => {
    // Si alguien manda basura por la API, la cuenta debe crearse igual con
    // la fecha vacía, no fallar el registro entero.
    const usuario = await crearUsuarioDePrueba("fecha-mala", true, {
      fecha_nacimiento: "no-es-una-fecha",
    });
    try {
      const { data } = await clienteAdministrador()
        .from("perfiles")
        .select("id, fecha_nacimiento")
        .eq("id", usuario.id)
        .single();
      expect(data?.id).toBe(usuario.id);
      expect(data?.fecha_nacimiento).toBeNull();
    } finally {
      await borrarUsuarioDePrueba(usuario.id);
    }
  }, 30_000);
});

describe.skipIf(!HAY_BASE_DE_DATOS)("verificación del correo", () => {
  it("quien no ha verificado el correo no puede ni iniciar sesión", async () => {
    // La plataforma lo corta un escalón antes de lo que esperábamos: sin
    // confirmar no hay sesión, así que no hay nada que negar después.
    const usuario = await crearUsuarioSinConfirmar("sin-confirmar");
    try {
      const error = await intentarAcceso(usuario.correo);
      expect(error).toMatch(/not confirmed/i);
    } finally {
      await borrarUsuarioDePrueba(usuario.id);
    }
  }, 30_000);

  it("quien sí lo ha verificado, puede escribir", async () => {
    const usuario = await crearUsuarioDePrueba("verificada", true);
    try {
      const { data } = await usuario.cliente.rpc("tiene_correo_verificado");
      expect(data).toBe(true);
    } finally {
      await borrarUsuarioDePrueba(usuario.id);
    }
  }, 30_000);

  it("a alguien bloqueado se le niega, aunque tenga el correo verificado", async () => {
    const usuario = await crearUsuarioDePrueba("bloqueada", true);
    try {
      await clienteAdministrador()
        .from("perfiles")
        .update({ bloqueado: true })
        .eq("id", usuario.id);

      const { data } = await usuario.cliente.rpc("tiene_correo_verificado");
      expect(data).toBe(false);
    } finally {
      await borrarUsuarioDePrueba(usuario.id);
    }
  }, 30_000);
});

describe.skipIf(!HAY_BASE_DE_DATOS)("los datos de referencia de la base", () => {
  it("las tallas coinciden con la lista del código, etiquetas incluidas", async () => {
    // La etiqueta se compara a propósito: lleva acentos ("2 años") y es
    // donde se vio que una migración mal codificada los destrozaba sin que
    // ninguna prueba se enterara.
    const { TALLAS } = await import("@/lib/tallas");
    const { data, error } = await clienteAnonimo()
      .from("tallas")
      .select("codigo, etiqueta, talla_eu, edad_meses_min, edad_meses_max, orden")
      .order("orden");

    expect(error).toBeNull();
    expect(data).toEqual(
      TALLAS.map((t) => ({
        codigo: t.codigo,
        etiqueta: t.etiqueta,
        talla_eu: t.tallaEu,
        edad_meses_min: t.edadMesesMin,
        edad_meses_max: t.edadMesesMax,
        orden: t.orden,
      })),
    );
  });

  it("las provincias coinciden con la lista del código, acentos incluidos", async () => {
    const { PROVINCIAS } = await import("@/lib/provincias");
    const { data, error } = await clienteAnonimo()
      .from("provincias")
      .select("codigo, nombre, slug")
      .order("codigo");

    expect(error).toBeNull();
    expect(data).toEqual(
      PROVINCIAS.map((p) => ({
        codigo: p.codigo,
        nombre: p.nombre,
        slug: p.slug,
      })),
    );
  });

  it("los títulos de los textos legales conservan los acentos", async () => {
    const { data } = await clienteAnonimo()
      .from("documentos_legales")
      .select("slug, titulo")
      .eq("slug", "privacidad")
      .eq("version", "2026-10-22")
      .single();

    expect(data?.titulo).toBe("Política de privacidad");
  });
});

if (!HAY_BASE_DE_DATOS) {
  describe("pruebas de permisos", () => {
    it.skip(`saltadas: ${MOTIVO_SALTO}`, () => {});
  });
}
