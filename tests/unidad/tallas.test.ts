import { describe, expect, it } from "vitest";
import { TALLAS, tallaSiguiente, tallaSugeridaPorEdad } from "@/lib/tallas";

describe("tallaSugeridaPorEdad", () => {
  it("un recién nacido usa la 0-3 meses", () => {
    expect(tallaSugeridaPorEdad(0)?.codigo).toBe("0-3-meses");
  });

  it("a los 4 meses usa la 3-6 meses", () => {
    expect(tallaSugeridaPorEdad(4)?.codigo).toBe("3-6-meses");
  });

  it("el límite inferior de un tramo pertenece a ese tramo", () => {
    expect(tallaSugeridaPorEdad(3)?.codigo).toBe("3-6-meses");
  });

  it("a los 30 meses usa la de 2 años", () => {
    expect(tallaSugeridaPorEdad(30)?.codigo).toBe("2-anos");
  });

  it("devuelve null con una edad negativa", () => {
    expect(tallaSugeridaPorEdad(-1)).toBeNull();
  });

  it("devuelve null por encima de los 14 años", () => {
    expect(tallaSugeridaPorEdad(200)).toBeNull();
  });

  it("devuelve null con un número que no es un número", () => {
    expect(tallaSugeridaPorEdad(Number.NaN)).toBeNull();
    expect(tallaSugeridaPorEdad(Number.POSITIVE_INFINITY)).toBeNull();
  });
});

describe("tallaSiguiente", () => {
  it("después de la 3-6 meses viene la 6-9 meses", () => {
    expect(tallaSiguiente("3-6-meses")?.codigo).toBe("6-9-meses");
  });

  it("el salto de meses a años funciona", () => {
    expect(tallaSiguiente("18-24-meses")?.codigo).toBe("2-anos");
  });

  it("la última talla no tiene siguiente", () => {
    expect(tallaSiguiente("14-anos")).toBeNull();
  });

  it("un código inexistente devuelve null", () => {
    expect(tallaSiguiente("inventada")).toBeNull();
  });
});

describe("TALLAS", () => {
  it("los códigos no se repiten", () => {
    const codigos = TALLAS.map((t) => t.codigo);
    expect(new Set(codigos).size).toBe(codigos.length);
  });

  it("los tramos de edad no se solapan y van en orden", () => {
    for (let i = 1; i < TALLAS.length; i++) {
      expect(TALLAS[i]!.edadMesesMin).toBe(TALLAS[i - 1]!.edadMesesMax + 1);
      expect(TALLAS[i]!.orden).toBeGreaterThan(TALLAS[i - 1]!.orden);
    }
  });

  it("empieza en el mes cero, para que ningún bebé se quede fuera", () => {
    expect(TALLAS[0]!.edadMesesMin).toBe(0);
  });

  it("cada talla tiene etiqueta y equivalente europeo", () => {
    for (const talla of TALLAS) {
      expect(talla.etiqueta.length).toBeGreaterThan(0);
      expect(talla.tallaEu.length).toBeGreaterThan(0);
    }
  });
});
