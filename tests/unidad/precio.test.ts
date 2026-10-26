import { describe, expect, it } from "vitest";
import {
  aCentimos,
  formatearPrecio,
  precioPorPieza,
} from "@/lib/anuncios/precio";

describe("aCentimos", () => {
  it("acepta la coma decimal, que es como se escribe aquí", () => {
    expect(aCentimos("12,50")).toBe(1250);
  });

  it("acepta también el punto", () => {
    expect(aCentimos("12.50")).toBe(1250);
  });

  it("acepta un entero", () => {
    expect(aCentimos("12")).toBe(1200);
  });

  it("acepta un solo decimal", () => {
    expect(aCentimos("12,5")).toBe(1250);
  });

  it("quita los espacios y el símbolo del euro", () => {
    expect(aCentimos(" 12,50 € ")).toBe(1250);
  });

  it("rechaza el cero y lo negativo", () => {
    expect(aCentimos("0")).toBeNull();
    expect(aCentimos("0,00")).toBeNull();
    expect(aCentimos("-5")).toBeNull();
  });

  it("rechaza más de dos decimales, en vez de redondear a escondidas", () => {
    // Redondear en silencio hace que alguien publique a un precio que no
    // escribió. Mejor decirle que lo corrija.
    expect(aCentimos("12,555")).toBeNull();
  });

  it("rechaza lo que no es un número", () => {
    expect(aCentimos("")).toBeNull();
    expect(aCentimos("   ")).toBeNull();
    expect(aCentimos("doce")).toBeNull();
    expect(aCentimos("12,,5")).toBeNull();
    expect(aCentimos("1 2")).toBeNull();
  });

  it("rechaza precios absurdos para ropa infantil", () => {
    expect(aCentimos("1000,01")).toBeNull();
  });

  it("no se come el último céntimo por un error de coma flotante", () => {
    // parseFloat("1.10") * 100 da 110.00000000000001. Por eso esto no
    // pasa por coma flotante.
    expect(aCentimos("0,07")).toBe(7);
    expect(aCentimos("1,10")).toBe(110);
    expect(aCentimos("8,29")).toBe(829);
    expect(aCentimos("35,35")).toBe(3535);
  });
});

describe("precioPorPieza", () => {
  it("reparte el precio del lote entre sus piezas", () => {
    expect(precioPorPieza(4500, 18)).toBe(250);
  });

  it("redondea hacia arriba, para no prometer menos de lo que cuesta", () => {
    // 1000/3 son 333,33: si se dijera 333, el lote entero saldría por
    // 999 y el anuncio estaría mintiendo por un céntimo.
    expect(precioPorPieza(1000, 3)).toBe(334);
  });

  it("con una pieza es el precio entero", () => {
    expect(precioPorPieza(1250, 1)).toBe(1250);
  });

  it("con cero o menos piezas devuelve el precio, no infinito", () => {
    expect(precioPorPieza(1250, 0)).toBe(1250);
    expect(precioPorPieza(1250, -3)).toBe(1250);
  });

  it("ignora un número de piezas con decimales", () => {
    expect(precioPorPieza(1000, 2.5)).toBe(500);
  });
});

describe("formatearPrecio", () => {
  it("usa coma decimal y el símbolo detrás, como en España", () => {
    expect(formatearPrecio(4500)).toBe("45,00 €");
  });

  it("mantiene los dos decimales aunque sean cero", () => {
    expect(formatearPrecio(500)).toBe("5,00 €");
  });

  it("escribe bien los céntimos sueltos", () => {
    expect(formatearPrecio(7)).toBe("0,07 €");
  });

  it("no agrupa las cifras de cuatro dígitos, como manda el español", () => {
    // En español el punto de millar no aparece hasta las cinco cifras:
    // se escribe 1234,56 y 12.345,67.
    expect(formatearPrecio(123456)).toBe("1234,56 €");
  });

  it("separa los miles a partir de cinco cifras", () => {
    expect(formatearPrecio(1234567)).toBe("12.345,67 €");
  });
});
