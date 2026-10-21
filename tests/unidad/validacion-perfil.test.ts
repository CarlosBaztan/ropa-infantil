import { describe, expect, it } from "vitest";
import {
  edadEnAnios,
  normalizarCorreo,
  validarAlias,
  validarRegistro,
} from "@/lib/validacion/perfil";

const base = {
  correo: "ana@ejemplo.com",
  contrasena: "contrasena-larga-1234",
  fechaNacimiento: "1990-05-04",
  aceptaMarketing: false,
};

describe("normalizarCorreo", () => {
  it("quita espacios y pasa a minúsculas", () => {
    expect(normalizarCorreo("  Ana@Ejemplo.COM ")).toBe("ana@ejemplo.com");
  });

  it("dos escrituras del mismo correo acaban igual", () => {
    expect(normalizarCorreo("ANA@ejemplo.com")).toBe(
      normalizarCorreo("ana@Ejemplo.com"),
    );
  });
});

describe("edadEnAnios", () => {
  const hoy = new Date("2026-10-21T12:00:00Z");

  it("cumplir 18 hoy cuenta como 18", () => {
    expect(edadEnAnios("2008-10-21", hoy)).toBe(18);
  });

  it("cumplirlos mañana cuenta como 17", () => {
    expect(edadEnAnios("2008-10-22", hoy)).toBe(17);
  });

  it("una fecha futura devuelve null", () => {
    expect(edadEnAnios("2030-01-01", hoy)).toBeNull();
  });

  it("mañana devuelve null, aunque sea solo un día", () => {
    expect(edadEnAnios("2026-10-22", hoy)).toBeNull();
  });

  it("una fecha imposible devuelve null", () => {
    expect(edadEnAnios("1800-01-01", hoy)).toBeNull();
    expect(edadEnAnios("no-es-fecha", hoy)).toBeNull();
    expect(edadEnAnios("2008-02-30", hoy)).toBeNull();
    expect(edadEnAnios("2008-13-01", hoy)).toBeNull();
    expect(edadEnAnios("", hoy)).toBeNull();
  });
});

describe("validarRegistro", () => {
  it("acepta un registro correcto y devuelve el correo normalizado", () => {
    const r = validarRegistro({ ...base, correo: " Ana@Ejemplo.com " });
    expect(r.valido).toBe(true);
    if (r.valido) expect(r.valor.correo).toBe("ana@ejemplo.com");
  });

  it("rechaza a quien tiene 17 años", () => {
    const r = validarRegistro({ ...base, fechaNacimiento: "2010-01-01" });
    expect(r.valido).toBe(false);
    if (!r.valido) expect(r.error).toContain("18");
  });

  it("rechaza una fecha de nacimiento futura", () => {
    expect(validarRegistro({ ...base, fechaNacimiento: "2030-01-01" }).valido).toBe(
      false,
    );
  });

  it("rechaza un correo sin arroba", () => {
    expect(validarRegistro({ ...base, correo: "ana" }).valido).toBe(false);
  });

  it("rechaza un correo con espacios dentro", () => {
    expect(validarRegistro({ ...base, correo: "an a@ejemplo.com" }).valido).toBe(
      false,
    );
  });

  it("rechaza una contraseña corta", () => {
    expect(validarRegistro({ ...base, contrasena: "1234" }).valido).toBe(false);
  });

  it("el marketing es opcional y por defecto no se acepta", () => {
    const r = validarRegistro(base);
    expect(r.valido).toBe(true);
    if (r.valido) expect(r.valor.aceptaMarketing).toBe(false);
  });
});

describe("validarAlias", () => {
  it("acepta un alias normal", () => {
    expect(validarAlias("ana-garcia").valido).toBe(true);
  });

  it("rechaza el alias vacío", () => {
    expect(validarAlias("").valido).toBe(false);
  });

  it("rechaza un alias de solo espacios", () => {
    expect(validarAlias("   ").valido).toBe(false);
  });

  it("rechaza etiquetas HTML", () => {
    expect(validarAlias("<script>alert(1)</script>").valido).toBe(false);
  });

  it("rechaza un alias con barras, que rompería la dirección", () => {
    expect(validarAlias("ana/berta").valido).toBe(false);
  });

  it("pasa a minúsculas y quita los espacios de los extremos", () => {
    const r = validarAlias("  Ana-Garcia  ");
    expect(r.valido).toBe(true);
    if (r.valido) expect(r.valor).toBe("ana-garcia");
  });

  it("rechaza un alias demasiado largo", () => {
    expect(validarAlias("a".repeat(40)).valido).toBe(false);
  });

  it("rechaza acentos y eñes, que no caben en una dirección limpia", () => {
    expect(validarAlias("begoña").valido).toBe(false);
    expect(validarAlias("maría").valido).toBe(false);
  });
});
