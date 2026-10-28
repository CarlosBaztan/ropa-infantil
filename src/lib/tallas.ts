/*
 * La lista cerrada de tallas: la tabla más importante del proyecto.
 *
 * Si la talla fuera texto libre, "3 meses" y "0-3M" serían dos cosas
 * distintas y el filtro por talla —la razón por la que alguien entra en esta
 * web— no funcionaría nunca. Los tramos de edad son contiguos y no se
 * solapan, de modo que cualquier edad entre 0 y 14 años cae en una y solo
 * una talla.
 *
 * Esta lista tiene una copia en la base de datos (supabase/seed/tallas.sql).
 * La prueba de tests/permisos/tallas.test.ts comprueba que no se separan.
 */

export type GrupoTalla = "meses" | "anios";

export interface Talla {
  /** Identificador estable; aparece en las direcciones públicas. */
  codigo: string;
  grupo: GrupoTalla;
  /** Cómo se le dice a una madre: "3-6 meses", "4 años". */
  etiqueta: string;
  /** Equivalente de la talla europea impresa en la etiqueta de la prenda. */
  tallaEu: string;
  edadMesesMin: number;
  edadMesesMax: number;
  /** Para ordenar de la más pequeña a la más grande. */
  orden: number;
}

function enMeses(
  codigo: string,
  etiqueta: string,
  tallaEu: string,
  edadMesesMin: number,
  edadMesesMax: number,
  orden: number,
): Talla {
  return {
    codigo,
    grupo: "meses",
    etiqueta,
    tallaEu,
    edadMesesMin,
    edadMesesMax,
    orden,
  };
}

function enAnios(anios: number, tallaEu: string, orden: number): Talla {
  return {
    codigo: `${anios}-anos`,
    grupo: "anios",
    etiqueta: `${anios} años`,
    tallaEu,
    edadMesesMin: anios * 12,
    edadMesesMax: anios * 12 + 11,
    orden,
  };
}

export const TALLAS: readonly Talla[] = [
  enMeses("0-3-meses", "0-3 meses", "56", 0, 2, 10),
  enMeses("3-6-meses", "3-6 meses", "62", 3, 5, 20),
  enMeses("6-9-meses", "6-9 meses", "68", 6, 8, 30),
  enMeses("9-12-meses", "9-12 meses", "74", 9, 11, 40),
  enMeses("12-18-meses", "12-18 meses", "80", 12, 17, 50),
  enMeses("18-24-meses", "18-24 meses", "86", 18, 23, 60),
  enAnios(2, "92", 70),
  enAnios(3, "98", 80),
  enAnios(4, "104", 90),
  enAnios(5, "110", 100),
  enAnios(6, "116", 110),
  enAnios(7, "122", 120),
  enAnios(8, "128", 130),
  enAnios(9, "134", 140),
  enAnios(10, "140", 150),
  enAnios(11, "146", 160),
  enAnios(12, "152", 170),
  enAnios(13, "158", 180),
  enAnios(14, "164", 190),
];

/** La talla de un codigo, o null si ese codigo no esta en la lista. */
export function tallaPorCodigo(codigo: string): Talla | null {
  return TALLAS.find((talla) => talla.codigo === codigo) ?? null;
}

/**
 * La talla que le corresponde por edad. Es una sugerencia, no una verdad:
 * los niños varían mucho y en el perfil del niño la talla real manda sobre
 * la edad.
 */
export function tallaSugeridaPorEdad(edadEnMeses: number): Talla | null {
  if (!Number.isFinite(edadEnMeses) || edadEnMeses < 0) return null;
  // Se redondea hacia abajo porque quien llame a esto calculará los meses
  // desde una fecha de nacimiento, y ahí el decimal es lo normal: sin esto,
  // un bebé de 2,5 meses se quedaba sin talla.
  const meses = Math.floor(edadEnMeses);
  return (
    TALLAS.find(
      (talla) => meses >= talla.edadMesesMin && meses <= talla.edadMesesMax,
    ) ?? null
  );
}

/**
 * La talla siguiente. Es el motor del aviso de "siguiente talla", que es
 * lo que convierte una compra puntual en una recurrencia.
 */
export function tallaSiguiente(codigo: string): Talla | null {
  const indice = TALLAS.findIndex((talla) => talla.codigo === codigo);
  if (indice === -1) return null;
  return TALLAS[indice + 1] ?? null;
}
