/*
 * La dirección pública de un anuncio: `/anuncio/<texto-legible>-<id6>`.
 *
 * El texto legible está para las personas y para los buscadores; el que
 * de verdad identifica el anuncio es el identificador de seis caracteres
 * del final. Por eso el título se puede reescribir sin romper el enlace
 * que alguien haya compartido por WhatsApp.
 */

import { describe, expect, it } from "vitest";
import {
  aSlug,
  direccionDeAnuncio,
  idPublicoDe,
} from "@/lib/anuncios/direccion";

describe("aSlug", () => {
  it("quita acentos, mayúsculas y signos", () => {
    expect(aSlug("Jerséis de niña, ¡como nuevos!")).toBe(
      "jerseis-de-nina-como-nuevos",
    );
  });

  it("no deja guiones sueltos en los extremos", () => {
    expect(aSlug("  ¿Pijamas?  ")).toBe("pijamas");
  });

  it("junta los separadores seguidos en uno solo", () => {
    expect(aSlug("Lote   de --- bodies")).toBe("lote-de-bodies");
  });

  it("conserva la ñ como n, que es como se busca", () => {
    expect(aSlug("Bañadores")).toBe("banadores");
  });

  it("no se alarga sin límite", () => {
    expect(aSlug("a".repeat(200)).length).toBeLessThanOrEqual(60);
  });

  it("nunca devuelve vacío, porque la dirección no puede empezar por guión", () => {
    // Un título escrito solo con emojis o con otro alfabeto no deja
    // ninguna letra utilizable. Sin esto saldría "/anuncio/-a1b2c3".
    expect(aSlug("🧦🧦🧦")).toBe("anuncio");
    expect(aSlug("")).toBe("anuncio");
  });
});

describe("direccionDeAnuncio", () => {
  it("pega el texto legible y el identificador", () => {
    expect(direccionDeAnuncio("lote-de-bodies", "a1b2c3")).toBe(
      "/anuncio/lote-de-bodies-a1b2c3",
    );
  });

  it("arregla un texto legible que venga vacío de la base", () => {
    expect(direccionDeAnuncio("", "a1b2c3")).toBe("/anuncio/anuncio-a1b2c3");
  });
});

describe("idPublicoDe", () => {
  it("saca el identificador del final", () => {
    expect(idPublicoDe("lote-de-12-bodies-a1b2c3")).toBe("a1b2c3");
  });

  it("funciona aunque el texto legible lleve números", () => {
    expect(idPublicoDe("lote-talla-3-6-meses-9f0e1d")).toBe("9f0e1d");
  });

  it("acepta la dirección sin texto legible", () => {
    expect(idPublicoDe("a1b2c3")).toBe("a1b2c3");
  });

  it("tolera que alguien la haya pasado a mayúsculas", () => {
    expect(idPublicoDe("Lote-De-Bodies-A1B2C3")).toBe("a1b2c3");
  });

  it("devuelve null si no hay identificador que valga", () => {
    expect(idPublicoDe("lote-de-bodies")).toBeNull();
    expect(idPublicoDe("")).toBeNull();
    // Siete caracteres no son seis, y "zzzzzz" no es hexadecimal.
    expect(idPublicoDe("lote-a1b2c3d")).toBeNull();
    expect(idPublicoDe("lote-zzzzzz")).toBeNull();
  });
});
