/*
 * La dirección pública del sitio.
 *
 * Hace falta entera —con https y el dominio— en el mapa del sitio y en
 * las direcciones canónicas, que es donde una ruta relativa no vale.
 *
 * Sale de una variable de entorno porque el dominio todavía no está
 * decidido: hoy vive en Vercel con un nombre provisional y el día que
 * haya dominio propio se cambia en un sitio y no en veinte. Vercel pone
 * VERCEL_PROJECT_PRODUCTION_URL sola, así que funciona sin configurar
 * nada hasta entonces.
 */

const PARA_DESARROLLO = "http://localhost:3000";

export function sitio(): string {
  const propia = process.env.NEXT_PUBLIC_SITIO?.trim();
  if (propia) return propia.replace(/\/+$/, "");

  const deVercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (deVercel) return `https://${deVercel.replace(/\/+$/, "")}`;

  return PARA_DESARROLLO;
}
