/*
 * Comprueba los contrastes del sistema visual leyendo globals.css y
 * calculándolos con la fórmula de WCAG, en claro y en oscuro.
 *
 * Existe porque los valores del diseño venían de un informe y nadie los
 * había verificado: tres colores de estado no se redefinían en oscuro y un
 * mensaje de error quedaba ilegible. Esta prueba impide que vuelva a pasar
 * cuando alguien toque un color.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const CSS = readFileSync(
  join(process.cwd(), "src", "app", "globals.css"),
  "utf8",
);

type Tokens = Record<string, string>;

/** Extrae los tokens de color de un bloque CSS localizado por su selector. */
function tokensDeBloque(selector: string): Tokens {
  const inicio = CSS.indexOf(selector);
  if (inicio === -1) throw new Error(`No se encuentra el bloque ${selector}`);
  const abre = CSS.indexOf("{", inicio);
  const cierra = CSS.indexOf("}", abre);
  const cuerpo = CSS.slice(abre + 1, cierra);

  const tokens: Tokens = {};
  for (const linea of cuerpo.split("\n")) {
    const encaje = /^\s*(--[\w-]+)\s*:\s*(#[0-9a-fA-F]{3,8})\s*;/.exec(linea);
    if (encaje) tokens[encaje[1]!] = encaje[2]!.toLowerCase();
  }
  return tokens;
}

function canalLineal(valor: number): number {
  const s = valor / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

function luminancia(hex: string): number {
  const limpio = hex.replace("#", "");
  const expandido =
    limpio.length === 3
      ? limpio
          .split("")
          .map((c) => c + c)
          .join("")
      : limpio;
  const r = Number.parseInt(expandido.slice(0, 2), 16);
  const g = Number.parseInt(expandido.slice(2, 4), 16);
  const b = Number.parseInt(expandido.slice(4, 6), 16);
  return (
    0.2126 * canalLineal(r) + 0.7152 * canalLineal(g) + 0.0722 * canalLineal(b)
  );
}

function contraste(unColor: string, otroColor: string): number {
  const a = luminancia(unColor);
  const b = luminancia(otroColor);
  const claro = Math.max(a, b);
  const oscuro = Math.min(a, b);
  return (claro + 0.05) / (oscuro + 0.05);
}

const claro = tokensDeBloque(":root {");
// El modo oscuro hereda del claro y sobrescribe lo que redefine. Se
// comprueban los DOS bloques oscuros, porque olvidar uno es el fallo típico.
const oscuroPorSistema = {
  ...claro,
  ...tokensDeBloque(':root:not([data-theme="light"]) {'),
};
const oscuroForzado = {
  ...claro,
  ...tokensDeBloque(':root[data-theme="dark"] {'),
};

const FONDOS = ["--c-bg", "--c-surface", "--c-surface-2"] as const;

/** Texto: 4,5:1. Elementos de interfaz y bordes de control: 3:1. */
const TEXTO = 4.5;
const INTERFAZ = 3;

interface Exigencia {
  frente: string;
  contra: readonly string[];
  minimo: number;
  para: string;
}

const EXIGENCIAS: readonly Exigencia[] = [
  { frente: "--c-ink", contra: FONDOS, minimo: TEXTO, para: "texto principal" },
  {
    frente: "--c-ink-muted",
    contra: FONDOS,
    minimo: TEXTO,
    para: "texto secundario",
  },
  {
    frente: "--c-primary",
    contra: [...FONDOS, "--c-primary-soft"],
    minimo: TEXTO,
    para: "enlaces y texto principal de acento",
  },
  {
    frente: "--c-accent",
    contra: [...FONDOS, "--c-accent-soft"],
    minimo: TEXTO,
    para: "texto de acento",
  },
  {
    frente: "--c-danger",
    contra: FONDOS,
    minimo: TEXTO,
    para: "mensajes de error",
  },
  { frente: "--c-warning", contra: FONDOS, minimo: TEXTO, para: "avisos" },
  { frente: "--c-success", contra: FONDOS, minimo: TEXTO, para: "confirmaciones" },
  {
    frente: "--c-sobre-primario",
    contra: ["--c-primary"],
    minimo: TEXTO,
    para: "texto sobre botón principal",
  },
  {
    frente: "--c-sobre-acento",
    contra: ["--c-accent"],
    minimo: TEXTO,
    para: "texto sobre botón de acento",
  },
  {
    frente: "--c-borde-control",
    contra: FONDOS,
    minimo: INTERFAZ,
    para: "silueta de campos y controles",
  },
  /*
   * El anillo de foco es de DOS tonos, y no por capricho: ningún color único
   * puede contrastar 3:1 contra un fondo casi blanco y 3:1 contra el verde
   * del botón principal a la vez; para lo primero tiene que ser oscuro y
   * para lo segundo claro. Así que el anillo exterior se mide contra los
   * fondos y el interior contra los rellenos.
   */
  {
    frente: "--c-focus",
    contra: FONDOS,
    minimo: INTERFAZ,
    para: "anillo exterior de foco sobre el fondo",
  },
  {
    frente: "--c-focus-contra",
    contra: ["--c-primary", "--c-accent"],
    minimo: INTERFAZ,
    para: "anillo interior de foco junto a un botón relleno",
  },
];

function fallos(tokens: Tokens, modo: string): string[] {
  const encontrados: string[] = [];
  for (const { frente, contra, minimo, para } of EXIGENCIAS) {
    const colorFrente = tokens[frente];
    if (!colorFrente) {
      encontrados.push(`${modo}: falta el token ${frente} (${para})`);
      continue;
    }
    for (const nombreFondo of contra) {
      const colorFondo = tokens[nombreFondo];
      if (!colorFondo) {
        encontrados.push(`${modo}: falta el token ${nombreFondo}`);
        continue;
      }
      const ratio = contraste(colorFrente, colorFondo);
      if (ratio < minimo) {
        encontrados.push(
          `${modo}: ${frente} sobre ${nombreFondo} = ${ratio.toFixed(2)}:1, ` +
            `necesita ${minimo}:1 (${para})`,
        );
      }
    }
  }
  return encontrados;
}

describe("la fórmula de contraste", () => {
  it("da 21:1 entre negro y blanco", () => {
    expect(contraste("#000000", "#ffffff")).toBeCloseTo(21, 1);
  });

  it("da 1:1 entre un color y sí mismo", () => {
    expect(contraste("#0f6b5c", "#0f6b5c")).toBeCloseTo(1, 5);
  });
});

describe("contrastes del sistema visual", () => {
  it("cumple WCAG en modo claro", () => {
    expect(fallos(claro, "claro")).toEqual([]);
  });

  it("cumple WCAG en modo oscuro por preferencia del sistema", () => {
    expect(fallos(oscuroPorSistema, "oscuro (sistema)")).toEqual([]);
  });

  it("cumple WCAG en modo oscuro forzado con data-theme", () => {
    expect(fallos(oscuroForzado, "oscuro (forzado)")).toEqual([]);
  });

  it("los dos bloques oscuros definen exactamente los mismos tokens", () => {
    // Olvidar un token en uno de los dos es el fallo que dejó los mensajes
    // de error ilegibles cuando el tema se forzaba a mano.
    const porSistema = Object.keys(
      tokensDeBloque(':root:not([data-theme="light"]) {'),
    ).sort();
    const forzado = Object.keys(
      tokensDeBloque(':root[data-theme="dark"] {'),
    ).sort();
    expect(forzado).toEqual(porSistema);
  });
});
