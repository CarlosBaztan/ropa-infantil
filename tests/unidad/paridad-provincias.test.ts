/*
 * Igual que con las tallas: la lista de provincias existe en TypeScript y
 * en la migración, y si se separan el filtro por zona deja de cuadrar con
 * lo que hay guardado. Esta prueba lee el SQL y lo compara.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { PROVINCIAS } from "@/lib/provincias";

const SQL = readFileSync(
  join(process.cwd(), "supabase", "migrations", "0004_provincias.sql"),
  "utf8",
);

function filasDelSql() {
  const patron = /\('(\d{2})','([^']+)','([^']+)'\)/g;
  return [...SQL.matchAll(patron)].map((e) => ({
    codigo: e[1]!,
    nombre: e[2]!,
    slug: e[3]!,
  }));
}

describe("la lista de provincias de TypeScript y la del SQL", () => {
  const filas = filasDelSql();

  it("son las 52 provincias", () => {
    expect(PROVINCIAS.length).toBe(52);
    expect(filas.length).toBe(52);
  });

  it("coinciden campo por campo y en el mismo orden", () => {
    expect(filas).toEqual(
      PROVINCIAS.map((p) => ({
        codigo: p.codigo,
        nombre: p.nombre,
        slug: p.slug,
      })),
    );
  });

  it("los códigos y los slugs no se repiten", () => {
    expect(new Set(PROVINCIAS.map((p) => p.codigo)).size).toBe(52);
    expect(new Set(PROVINCIAS.map((p) => p.slug)).size).toBe(52);
  });

  it("los slugs sirven para una dirección: sin acentos, espacios ni mayúsculas", () => {
    for (const p of PROVINCIAS) {
      expect(p.slug).toMatch(/^[a-z0-9-]+$/);
    }
  });
});
