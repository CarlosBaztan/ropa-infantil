/*
 * La dirección pública de un anuncio.
 *
 * Tiene la forma `/anuncio/<texto-legible>-<id6>`. El texto legible es
 * para las personas y para los buscadores; quien identifica el anuncio es
 * el identificador de seis caracteres del final, que la base de datos
 * genera al azar.
 *
 * Esa separación tiene una consecuencia práctica: alguien puede corregir
 * el título de su anuncio y el enlace que ya había compartido por
 * WhatsApp sigue funcionando. La página comprueba el texto legible y, si
 * ha cambiado, lleva a la dirección nueva sin que se pierda nadie.
 */

/** Seis caracteres hexadecimales: lo que genera la columna id_publico. */
const FORMA_DEL_ID = /^[0-9a-f]{6}$/;

/**
 * Texto legible dentro de una dirección: sin acentos, espacios ni signos.
 *
 * Nunca devuelve vacío. Un título escrito solo con emojis no deja ninguna
 * letra aprovechable, y sin este respaldo la dirección empezaría por un
 * guión suelto.
 */
export function aSlug(texto: string): string {
  const limpio = texto
    .normalize("NFD")
    // Las marcas de acento, que NFD ha separado de su letra.
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    // El recorte a 60 puede dejar un guión al final.
    .replace(/-+$/g, "");

  return limpio.length > 0 ? limpio : "anuncio";
}

/** La dirección completa de un anuncio, tal y como se enlaza. */
export function direccionDeAnuncio(slug: string, idPublico: string): string {
  return `/anuncio/${aSlug(slug)}-${idPublico}`;
}

/**
 * Saca el identificador de lo que venga en la dirección, o null si ahí no
 * hay ninguno. Es lo primero que hace la ficha pública: el texto que lo
 * precede no se usa para buscar, solo para comprobar después.
 */
export function idPublicoDe(parametro: string): string | null {
  const trozos = parametro.toLowerCase().split("-");
  const ultimo = trozos[trozos.length - 1] ?? "";
  return FORMA_DEL_ID.test(ultimo) ? ultimo : null;
}
