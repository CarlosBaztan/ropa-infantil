import { describe, expect, it } from "vitest";
import {
  AJUSTES_DE_TALLA,
  CATEGORIAS,
  ESTADOS_DE_CONSERVACION,
  esCategoria,
  esEstado,
  etiquetaDe,
  GENEROS,
  TEMPORADAS,
  type OpcionConEtiqueta,
} from "@/lib/anuncios/modelo";

const TODAS: [string, readonly OpcionConEtiqueta[]][] = [
  ["categorías", CATEGORIAS],
  ["estados", ESTADOS_DE_CONSERVACION],
  ["temporadas", TEMPORADAS],
  ["géneros", GENEROS],
  ["ajustes", AJUSTES_DE_TALLA],
];

describe("las listas cerradas del anuncio", () => {
  for (const [nombre, lista] of TODAS) {
    it(`${nombre}: los códigos no se repiten`, () => {
      const codigos = lista.map((o) => o.codigo);
      expect(new Set(codigos).size).toBe(codigos.length);
    });

    it(`${nombre}: los códigos sirven para una dirección`, () => {
      // Van en las direcciones públicas del catálogo: sin acentos, sin
      // espacios y sin mayúsculas, o se rompen los enlaces.
      for (const opcion of lista) {
        expect(opcion.codigo).toMatch(/^[a-z0-9-]+$/);
      }
    });

    it(`${nombre}: todas tienen etiqueta para mostrar`, () => {
      for (const opcion of lista) {
        expect(opcion.etiqueta.trim().length).toBeGreaterThan(0);
      }
    });
  }
});

describe("los estados de conservación", () => {
  it("son cuatro y están ordenados de mejor a peor", () => {
    expect(ESTADOS_DE_CONSERVACION.map((e) => e.codigo)).toEqual([
      "nuevo-con-etiqueta",
      "como-nuevo",
      "buen-estado",
      "con-senales-de-uso",
    ]);
  });

  it("se explican con palabras, no solo se nombran", () => {
    // «Como nuevo» no significa lo mismo para quien vende y para quien
    // compra. La explicación es lo que evita la discusión después.
    expect(etiquetaDe(ESTADOS_DE_CONSERVACION, "como-nuevo")).toContain("—");
  });
});

describe("comprobar si un código existe", () => {
  it("acepta los de la lista", () => {
    expect(esCategoria("pijamas")).toBe(true);
    expect(esEstado("como-nuevo")).toBe(true);
  });

  it("rechaza lo inventado", () => {
    expect(esCategoria("pijamitas")).toBe(false);
    expect(esCategoria("")).toBe(false);
    expect(esEstado("perfecto")).toBe(false);
  });

  it("no acepta un código con otra capitalización", () => {
    expect(esCategoria("Pijamas")).toBe(false);
  });
});

describe("etiquetaDe", () => {
  it("devuelve la etiqueta de un código conocido", () => {
    expect(etiquetaDe(CATEGORIAS, "banadores")).toBe("Bañadores");
  });

  it("devuelve null si no existe, en vez de un texto vacío", () => {
    expect(etiquetaDe(CATEGORIAS, "inventada")).toBeNull();
  });
});
