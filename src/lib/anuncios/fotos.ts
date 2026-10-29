/*
 * La dirección pública de una foto.
 *
 * El cubo del almacén es público —el catálogo tiene que verse sin
 * cuenta—, así que la dirección se compone y ya está: no hace falta
 * firmarla ni pedírsela a nadie. Antes esto se sacaba del cliente de
 * Supabase, lo que obligaba a arrastrar el cliente hasta dentro de cada
 * tarjeta solo para pegar un texto.
 */

export const CUBO_DE_ANUNCIOS = "anuncios";

/**
 * La dirección base se lee cada vez, y no una sola al cargar el módulo.
 * Parece un detalle y no lo es: en las pruebas, las variables de entorno
 * se cargan desde .env.local al empezar, y un módulo que las leyó antes
 * se queda con una cadena vacía y compone direcciones rotas sin avisar.
 */
function base(): string {
  return (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/+$/, "");
}

export function urlDeFoto(ruta: string): string {
  return `${base()}/storage/v1/object/public/${CUBO_DE_ANUNCIOS}/${ruta}`;
}

/** La primera foto de un anuncio, o null si no tiene ninguna. */
export function portadaDe(
  fotos: { ruta: string; orden?: number }[] | null | undefined,
): string | null {
  if (!fotos || fotos.length === 0) return null;
  const ordenadas = [...fotos].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
  return urlDeFoto(ordenadas[0]!.ruta);
}
