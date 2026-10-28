/*
 * Lo que la ficha pública le pide a la base de datos.
 *
 * Vive aparte de la pantalla para que las pruebas puedan ejecutar la
 * consulta de verdad, con un cliente anónimo, y comprobar que las reglas
 * de PostgreSQL enseñan lo que tienen que enseñar y esconden lo demás.
 * Una consulta escrita dentro de un componente de servidor no se puede
 * probar sin levantar medio Next.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * El vendedor se pide con `!vendedor` a propósito: la tabla tiene dos
 * columnas que apuntan a perfiles (quién vende y quién lo publicó
 * materialmente), y sin decir cuál de las dos la consulta es ambigua.
 */
const CAMPOS = `
  id, id_publico, slug, tipo, titulo, descripcion, defectos,
  talla, talla_hasta, numero_piezas, desglose,
  categoria, genero, marca, color, estado, ajuste, temporada,
  precio_centimos, acepta_entrega_mano, acepta_envio, zona_encuentro,
  provincia, ciudad, situacion, publicado_el, vendido_el, vendedor,
  perfil:perfiles!vendedor ( alias, provincia, ciudad ),
  fotos ( ruta, orden, ancho, alto, texto_alternativo )
`;

export interface FotoDeAnuncio {
  ruta: string;
  orden: number;
  ancho: number;
  alto: number;
  texto_alternativo: string | null;
}

export interface VendedorDeAnuncio {
  alias: string;
  provincia: string | null;
  ciudad: string | null;
}

export interface AnuncioCompleto {
  id: string;
  id_publico: string;
  slug: string;
  tipo: "prenda" | "lote";
  titulo: string;
  descripcion: string | null;
  defectos: string | null;
  talla: string;
  talla_hasta: string | null;
  numero_piezas: number | null;
  desglose: string | null;
  categoria: string;
  genero: string | null;
  marca: string | null;
  color: string | null;
  estado: string;
  ajuste: string;
  temporada: string | null;
  precio_centimos: number;
  acepta_entrega_mano: boolean;
  acepta_envio: boolean;
  zona_encuentro: string | null;
  provincia: string | null;
  ciudad: string | null;
  situacion: "activa" | "reservada" | "vendida" | "retirada";
  publicado_el: string;
  vendido_el: string | null;
  vendedor: string;
  perfil: VendedorDeAnuncio | null;
  fotos: FotoDeAnuncio[];
}

/**
 * Busca un anuncio por su identificador público. Devuelve null cuando no
 * existe y también cuando las reglas de la base no dejan verlo —un
 * anuncio retirado desde fuera, por ejemplo—, porque desde la pantalla
 * las dos cosas se contestan igual: con un 404.
 */
export async function buscarAnuncio(
  supabase: SupabaseClient,
  idPublico: string,
): Promise<AnuncioCompleto | null> {
  const { data, error } = await supabase
    .from("anuncios")
    .select(CAMPOS)
    .eq("id_publico", idPublico)
    .maybeSingle();

  // Un anuncio que no existe y una consulta que falla se contestan igual
  // de cara afuera, con un 404, pero no son lo mismo: sin esta traza, una
  // credencial mal puesta se ve exactamente igual que una dirección mal
  // escrita, y eso cuesta horas de buscar donde no es.
  if (error) {
    console.error("[anuncio] la consulta ha fallado:", error.message);
  }

  if (!data) return null;

  const anuncio = data as unknown as AnuncioCompleto;
  // Las fotos llegan sin orden garantizado; se ordenan aquí para no
  // depender de cómo las devuelva la base.
  anuncio.fotos = [...(anuncio.fotos ?? [])].sort((a, b) => a.orden - b.orden);
  return anuncio;
}

export interface ResumenDeAnuncio {
  id_publico: string;
  slug: string;
  titulo: string;
  precio_centimos: number;
  tipo: "prenda" | "lote";
  numero_piezas: number | null;
  fotos: { ruta: string }[];
}

/**
 * Otros anuncios vivos de la misma talla, para la ficha de uno vendido.
 *
 * Una página de un anuncio vendido sigue recibiendo visitas desde Google
 * durante meses; dejarla sin salida es desperdiciarlas. La talla es el
 * criterio porque es como busca una madre: lo que le sirva a su hijo
 * ahora, sea de la categoría que sea.
 */
export async function buscarAlternativas(
  supabase: SupabaseClient,
  talla: string,
  excluir: string,
  limite = 4,
): Promise<ResumenDeAnuncio[]> {
  const { data } = await supabase
    .from("anuncios")
    .select("id_publico, slug, titulo, precio_centimos, tipo, numero_piezas, fotos ( ruta )")
    .eq("talla", talla)
    .eq("situacion", "activa")
    .neq("id_publico", excluir)
    .order("publicado_el", { ascending: false })
    .limit(limite);

  return (data as unknown as ResumenDeAnuncio[] | null) ?? [];
}

/** La dirección pública de una foto en el almacén. */
export function urlDeFoto(supabase: SupabaseClient, ruta: string): string {
  return supabase.storage.from("anuncios").getPublicUrl(ruta).data.publicUrl;
}
