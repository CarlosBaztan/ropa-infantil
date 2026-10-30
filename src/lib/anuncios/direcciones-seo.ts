/*
 * Las direcciones limpias del catálogo, y cuándo una página se le ofrece
 * a Google.
 *
 * La sección 7 del diseño lo llama «la regla dura»: ruta limpia, puede
 * aparecer en Google; con interrogación, nunca. Y el umbral de
 * existencia, que es lo que evita el error que hunde a los marketplaces
 * pequeños: publicar miles de páginas vacías.
 */

import { TALLAS, tallaPorCodigo } from "@/lib/tallas";

/**
 * Una página de catálogo se ofrece a los buscadores solo a partir de
 * diez anuncios. Por debajo existe para quien entre, pero no se indexa:
 * una página con tres prendas decepciona a quien llega desde Google y le
 * dice a Google que este sitio es flojo.
 */
export const UMBRAL_PARA_GOOGLE = 10;

/** Para el campo `robots` de los metadatos: o nada, o «no me guardes». */
export function robotsSegunCuantosHay(
  cuantos: number,
): { index: false; follow: true } | undefined {
  // Follow en true aunque no se indexe: que siga los enlaces y descubra
  // las fichas, que esas sí interesan.
  return cuantos >= UMBRAL_PARA_GOOGLE
    ? undefined
    : { index: false, follow: true };
}

export interface TallaDeLaDireccion {
  codigo: string;
  /** Si venía como mes suelto y hay que redirigir al rango. */
  esAtajo: boolean;
}

const MESES_SUELTOS = /^(\d{1,3})-(mes|meses)$/;

/**
 * Qué talla pide una dirección.
 *
 * Acepta los códigos de la lista cerrada tal cual, y además los meses
 * sueltos: una madre busca «ropa bebé 3 meses», no «3-6 meses». El
 * código que va en la base de datos sigue siendo el rango; el atajo vive
 * solo aquí, en la capa de direcciones, y la página redirige.
 *
 * Cualquier otra cosa es null, y la página contesta 404. Si un texto
 * cualquiera devolviera una página, habría infinitas direcciones y
 * Google se gastaría el rastreo en ellas.
 */
export function tallaDesdeLaDireccion(
  texto: string,
): TallaDeLaDireccion | null {
  const limpio = texto.trim().toLowerCase();
  if (!limpio) return null;

  const exacta = tallaPorCodigo(limpio);
  if (exacta) return { codigo: exacta.codigo, esAtajo: false };

  const encaje = MESES_SUELTOS.exec(limpio);
  if (!encaje) return null;

  const meses = Number.parseInt(encaje[1]!, 10);
  const rango = TALLAS.find(
    (t) => meses >= t.edadMesesMin && meses <= t.edadMesesMax,
  );
  return rango ? { codigo: rango.codigo, esAtajo: true } : null;
}

export const direccionDeTalla = (codigo: string) => `/ropa/talla/${codigo}`;

export const direccionDeLotesPorTalla = (codigo: string) =>
  `/lotes/talla/${codigo}`;

export const direccionDeCategoria = (codigo: string) => `/ropa/${codigo}`;

export const direccionDeGeneroYTalla = (genero: string, talla: string) =>
  `/ropa/${genero}/${talla}`;

/** El nombre de una marca, convertido en algo que cabe en un enlace. */
export function aSlugDeMarca(marca: string): string {
  return marca
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const direccionDeMarca = (marca: string) =>
  `/marca/${aSlugDeMarca(marca)}`;

/**
 * Del enlace al nombre que se busca. No recupera los acentos —de
 * «prenatal» no se puede saber que era «Prénatal»—, así que quien lo use
 * tiene que buscar sin distinguirlos.
 */
export const marcaDesdeSlug = (slug: string) =>
  slug.toLowerCase().replace(/-+/g, " ").trim();
