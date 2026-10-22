import { describe, expect, it } from "vitest";
import {
  datosDelTitularQueFaltan,
  faltanDatosDelTitular,
  TITULAR,
  type Titular,
} from "@/lib/legal";

const completo: Titular = {
  nombre: "Nombre Apellido",
  nif: "00000000X",
  domicilio: "Calle de ejemplo 1, 48001 Bilbao",
  correoDeContacto: "hola@ejemplo.es",
};

describe("datos del titular", () => {
  it("hoy faltan, y por eso las páginas legales no se publican", () => {
    expect(faltanDatosDelTitular(TITULAR)).toBe(true);
  });

  it("con los cuatro datos, deja de faltar", () => {
    expect(faltanDatosDelTitular(completo)).toBe(false);
  });

  it("basta con que falte uno para que falten", () => {
    for (const campo of [
      "nombre",
      "nif",
      "domicilio",
      "correoDeContacto",
    ] as const) {
      expect(faltanDatosDelTitular({ ...completo, [campo]: null })).toBe(true);
    }
  });

  it("dice exactamente cuáles faltan", () => {
    expect(datosDelTitularQueFaltan({ ...completo, nif: null })).toEqual([
      "NIF",
    ]);
    expect(datosDelTitularQueFaltan(TITULAR)).toHaveLength(4);
  });

  it("no da por bueno un dato en blanco", () => {
    expect(faltanDatosDelTitular({ ...completo, nif: "" })).toBe(true);
  });
});
