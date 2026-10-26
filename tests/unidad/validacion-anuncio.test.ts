import { describe, expect, it } from "vitest";
import {
  tituloSugerido,
  validarAnuncio,
  type EntradaAnuncio,
} from "@/lib/anuncios/validacion";

const prenda: EntradaAnuncio = {
  tipo: "prenda",
  titulo: "Vestido de flores",
  talla: "3-6-meses",
  tallaHasta: null,
  numeroPiezas: null,
  categoria: "vestidos",
  estado: "como-nuevo",
  precio: "12,50",
  aceptaEntregaMano: true,
  aceptaEnvio: false,
  numeroDeFotos: 1,
};

const lote: EntradaAnuncio = {
  ...prenda,
  tipo: "lote",
  titulo: "Lote de bodies",
  tallaHasta: "6-9-meses",
  numeroPiezas: 12,
  categoria: "bodies",
  precio: "45",
};

describe("validarAnuncio", () => {
  it("acepta una prenda bien rellenada", () => {
    expect(validarAnuncio(prenda).valido).toBe(true);
  });

  it("acepta un lote bien rellenado", () => {
    expect(validarAnuncio(lote).valido).toBe(true);
  });

  it("exige al menos una foto", () => {
    const r = validarAnuncio({ ...prenda, numeroDeFotos: 0 });
    expect(r.valido).toBe(false);
    if (!r.valido) expect(r.error).toContain("foto");
  });

  it("no admite más de cinco fotos", () => {
    expect(validarAnuncio({ ...prenda, numeroDeFotos: 6 }).valido).toBe(false);
  });

  it("rechaza un precio que no vale", () => {
    expect(validarAnuncio({ ...prenda, precio: "0" }).valido).toBe(false);
    expect(validarAnuncio({ ...prenda, precio: "gratis" }).valido).toBe(false);
  });

  it("rechaza una talla que no existe", () => {
    expect(validarAnuncio({ ...prenda, talla: "4-meses" }).valido).toBe(false);
  });

  it("rechaza una categoría inventada", () => {
    expect(validarAnuncio({ ...prenda, categoria: "pijamitas" }).valido).toBe(
      false,
    );
  });

  it("un lote necesita al menos dos piezas", () => {
    const r = validarAnuncio({ ...lote, numeroPiezas: 1 });
    expect(r.valido).toBe(false);
    if (!r.valido) expect(r.error).toContain("piezas");
  });

  it("un lote no puede tener el rango de tallas al revés", () => {
    const r = validarAnuncio({
      ...lote,
      talla: "6-9-meses",
      tallaHasta: "3-6-meses",
    });
    expect(r.valido).toBe(false);
  });

  it("un lote puede ser de una sola talla, sin rango", () => {
    expect(validarAnuncio({ ...lote, tallaHasta: null }).valido).toBe(true);
  });

  it("una prenda suelta no lleva número de piezas ni rango", () => {
    expect(validarAnuncio({ ...prenda, numeroPiezas: 3 }).valido).toBe(false);
    expect(validarAnuncio({ ...prenda, tallaHasta: "6-9-meses" }).valido).toBe(
      false,
    );
  });

  it("exige alguna forma de entrega", () => {
    const r = validarAnuncio({
      ...prenda,
      aceptaEntregaMano: false,
      aceptaEnvio: false,
    });
    expect(r.valido).toBe(false);
    if (!r.valido) expect(r.error).toContain("entrega");
  });

  it("acepta solo envío, para quien no quiere quedar en persona", () => {
    expect(
      validarAnuncio({ ...prenda, aceptaEntregaMano: false, aceptaEnvio: true })
        .valido,
    ).toBe(true);
  });

  it("rechaza un título vacío o de dos letras", () => {
    expect(validarAnuncio({ ...prenda, titulo: "" }).valido).toBe(false);
    expect(validarAnuncio({ ...prenda, titulo: "  " }).valido).toBe(false);
    expect(validarAnuncio({ ...prenda, titulo: "ab" }).valido).toBe(false);
  });

  it("rechaza un título larguísimo", () => {
    expect(validarAnuncio({ ...prenda, titulo: "a".repeat(200) }).valido).toBe(
      false,
    );
  });
});

describe("tituloSugerido", () => {
  it("compone el título de un lote con sus piezas y su rango", () => {
    expect(tituloSugerido(lote)).toBe("Lote de 12 bodies · talla 3-6 meses a 6-9 meses");
  });

  it("un lote de una sola talla no dice «a»", () => {
    expect(tituloSugerido({ ...lote, tallaHasta: null })).toBe(
      "Lote de 12 bodies · talla 3-6 meses",
    );
  });

  it("compone el de una prenda con su categoría y talla", () => {
    expect(tituloSugerido(prenda)).toBe("Vestidos · talla 3-6 meses");
  });

  it("devuelve cadena vacía si aún no hay datos suficientes", () => {
    expect(tituloSugerido({ ...prenda, categoria: "", talla: "" })).toBe("");
  });
});
