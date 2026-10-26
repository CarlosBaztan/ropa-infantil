/*
 * El dinero, en céntimos enteros.
 *
 * Nada de números con decimales: en coma flotante, 1,10 € no es
 * exactamente 1,10, y al multiplicar por cien aparece un céntimo de más o
 * de menos. Con enteros no hay sorpresas, y es la norma en cualquier
 * sistema que vaya a mover dinero de verdad.
 */

/** Ropa infantil de segunda mano. Por encima de esto, algo va mal. */
const PRECIO_MAXIMO_CENTIMOS = 100_000;

/**
 * Convierte lo que alguien escribe en el formulario a céntimos, o null si
 * no sirve. Admite coma y punto porque la gente escribe las dos.
 *
 * No pasa por coma flotante a propósito: se separan los dígitos como texto
 * y se compone el entero.
 */
export function aCentimos(entrada: string): number | null {
  // Solo se quitan los espacios de los extremos: "1 2" no es un número,
  // y comérselos lo convertiría en doce sin que nadie lo pidiera.
  const limpio = entrada.replace("€", "").trim();
  if (limpio.length === 0) return null;

  // Un signo menos, letras o dos separadores quedan fuera por el patrón.
  const encaje = /^(\d{1,6})(?:[.,](\d{1,2}))?$/.exec(limpio);
  if (!encaje) return null;

  const enteros = Number.parseInt(encaje[1]!, 10);
  // "12,5" son cincuenta céntimos, no cinco: se rellena por la derecha.
  const decimales = Number.parseInt((encaje[2] ?? "0").padEnd(2, "0"), 10);

  const centimos = enteros * 100 + decimales;
  if (centimos <= 0) return null;
  if (centimos > PRECIO_MAXIMO_CENTIMOS) return null;

  return centimos;
}

/**
 * Lo que sale cada pieza de un lote. Es el argumento de venta del nicho:
 * «18 prendas por 45 €» dice poco; «2,50 € la pieza» lo dice todo.
 *
 * Redondea hacia arriba. Si 1000 entre 3 se mostrara como 3,33 €, el lote
 * entero saldría por 9,99 € y el anuncio estaría prometiendo de menos.
 */
export function precioPorPieza(centimos: number, piezas: number): number {
  const enteras = Math.floor(piezas);
  if (!Number.isFinite(enteras) || enteras < 1) return centimos;
  return Math.ceil(centimos / enteras);
}

const FORMATO = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** «45,00 €»: coma decimal y símbolo detrás, como se escribe aquí. */
export function formatearPrecio(centimos: number): string {
  // El espacio que mete Intl entre número y símbolo es un espacio
  // irrompible; se normaliza para que las comparaciones no sorprendan.
  return FORMATO.format(centimos / 100).replace(/ /g, " ");
}
