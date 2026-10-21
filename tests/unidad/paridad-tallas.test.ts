/*
 * La lista de tallas existe dos veces: en TypeScript (src/lib/tallas.ts) y en
 * la semilla de la base de datos (supabase/seed/tallas.sql). Si se separan,
 * el filtro por talla deja de cuadrar con lo que hay guardado, y ese filtro
 * es la razón por la que alguien entra en esta web.
 *
 * El plan dejaba esta comprobación para cuando existiera la base de datos.
 * No hace falta: basta con leer el archivo de semilla. Así el vigilante
 * existe desde el primer día en lugar de desde el despliegue.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { TALLAS } from "@/lib/tallas";

const SEMILLA = readFileSync(
  join(process.cwd(), "supabase", "seed", "tallas.sql"),
  "utf8",
);

interface FilaSemilla {
  codigo: string;
  grupo: string;
  etiqueta: string;
  tallaEu: string;
  edadMesesMin: number;
  edadMesesMax: number;
  orden: number;
}

function filasDeLaSemilla(): FilaSemilla[] {
  const patron =
    /\(\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*(\d+),\s*(\d+),\s*(\d+)\s*\)/g;
  const filas: FilaSemilla[] = [];
  for (const encaje of SEMILLA.matchAll(patron)) {
    filas.push({
      codigo: encaje[1]!,
      grupo: encaje[2]!,
      etiqueta: encaje[3]!,
      tallaEu: encaje[4]!,
      edadMesesMin: Number(encaje[5]),
      edadMesesMax: Number(encaje[6]),
      orden: Number(encaje[7]),
    });
  }
  return filas;
}

describe("la semilla SQL y la lista de TypeScript son la misma lista", () => {
  const filas = filasDeLaSemilla();

  it("la semilla se puede leer y tiene filas", () => {
    expect(filas.length).toBeGreaterThan(0);
  });

  it("tienen el mismo número de tallas", () => {
    expect(filas.length).toBe(TALLAS.length);
  });

  it("coinciden campo por campo, en el mismo orden", () => {
    const deTypeScript = TALLAS.map((t) => ({
      codigo: t.codigo,
      grupo: t.grupo as string,
      etiqueta: t.etiqueta,
      tallaEu: t.tallaEu,
      edadMesesMin: t.edadMesesMin,
      edadMesesMax: t.edadMesesMax,
      orden: t.orden,
    }));
    expect(filas).toEqual(deTypeScript);
  });

  it("la semilla borra lo que sobre, para que una talla retirada no sobreviva", () => {
    // Un upsert sin borrado deja en la base de datos las tallas que se
    // hayan quitado del código, y volverían a aparecer en los filtros.
    expect(SEMILLA).toMatch(/delete\s+from\s+tallas/i);
  });
});
