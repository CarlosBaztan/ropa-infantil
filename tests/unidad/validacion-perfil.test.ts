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
    // Con reloj fijo: si no, "2010-01-01" deja de tener 17 años con el
    // paso del tiempo y la prueba acaba comprobando otra cosa.
    const r = validarRegistro(
      { ...base, fechaNacimiento: "2009-06-15" },
      new Date("2026-10-21T12:00:00Z"),
    );
    expect(r.valido).toBe(false);
    if (!r.valido) expect(r.error).toContain("18");
  });

  it("deja pasar a quien cumple 18 justo hoy", () => {
    const r = validarRegistro(
      { ...base, fechaNacimiento: "2008-10-21" },
      new Date("2026-10-21T12:00:00Z"),
    );
    expect(r.valido).toBe(true);
  });

  it("rechaza a quien los cumple mañana, por un solo día", () => {
    const r = validarRegistro(
      { ...base, fechaNacimiento: "2008-10-22" },
      new Date("2026-10-21T12:00:00Z"),
    );
    expect(r.valido).toBe(false);
  });

  it("rechaza una fecha de nacimiento futura", () => {
    // También con reloj fijo: con una fecha lejana, la prueba acabaría
    // pasando por la regla de los 18 y no por la de fecha futura.
    const r = validarRegistro(
      { ...base, fechaNacimiento: "2027-01-01" },
      new Date("2026-10-21T12:00:00Z"),
    );
    expect(r.valido).toBe(false);
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

  it("rechaza correos con forma inventada que el patrón flojo aceptaba", () => {
    for (const malo of [
      "ana@ejemplo..com",
      "ana@-.com",
      "ana@ejemplo-.com",
      "ana@[127.0.0.1]",
      "ana@ejemplo",
      "@ejemplo.com",
      `${"a".repeat(300)}@ejemplo.com`,
    ]) {
      expect(validarRegistro({ ...base, correo: malo }).valido).toBe(false);
    }
  });

  it("acepta correos reales con puntos, signos y dominios compuestos", () => {
    for (const bueno of [
      "ana.garcia+bebes@mi-tienda.co.uk",
      "ana_garcia@correo.es",
      "a@b.es",
    ]) {
      expect(validarRegistro({ ...base, correo: bueno }).valido).toBe(true);
    }
  });

  it("rechaza una contraseña que solo son espacios", () => {
    expect(validarRegistro({ ...base, contrasena: " ".repeat(12) }).valido).toBe(
      false,
    );
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

/*
 * La edad se mide por el calendario de España, no por el de Greenwich.
 * Entre las once de la noche y medianoche las dos fechas no coinciden, y
 * medir en UTC rechaza por menor a un adulto que ya ha cumplido años aquí.
 */
describe("edadEnAnios con el reloj de España", () => {
  it("a las 01:30 de Madrid ya es el día siguiente, y cumple 18", () => {
    // 2026-10-20T23:30Z son las 01:30 del 21 en Madrid (horario de verano).
    expect(edadEnAnios("2008-10-21", new Date("2026-10-20T23:30:00Z"))).toBe(18);
  });

  it("en invierno pasa lo mismo, con una hora de diferencia", () => {
    // 2027-01-20T23:30Z son las 00:30 del 21 en Madrid.
    expect(edadEnAnios("2009-01-21", new Date("2027-01-20T23:30:00Z"))).toBe(18);
  });

  it("a las 22:00 de Madrid todavía es el día de antes", () => {
    // 2026-10-20T20:00Z son las 22:00 del 20 en Madrid: aún no los cumple.
    expect(edadEnAnios("2008-10-21", new Date("2026-10-20T20:00:00Z"))).toBe(17);
  });

  it("un bebé nacido hoy en España tiene cero años, no una fecha inválida", () => {
    const hoyEnMadrid = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Madrid",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
    expect(edadEnAnios(hoyEnMadrid)).toBe(0);
  });
});
