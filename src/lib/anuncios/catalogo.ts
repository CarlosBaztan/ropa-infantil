/*
 * La consulta del catálogo.
 *
 * Alimenta la portada, las páginas de aterrizaje, el buscador y el
 * armario público, así que un fallo aquí se ve en todas partes a la vez.
 * Vive en lib, y no dentro de una pantalla, para poder ejecutarla de
 * verdad en las pruebas con un cliente anónimo.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

/** Lo que necesita una tarjeta, y ni un campo más. */
export const CAMPOS_DE_TARJETA = `
  id_publico, slug, titulo, tipo, numero_piezas, precio_centimos,
  talla, talla_hasta, estado, temporada, provincia, situacion,
  fotos ( ruta, orden )
`;

export interface ResumenDeAnuncio {
  id_publico: string;
  slug: string;
  titulo: string;
  tipo: "prenda" | "lote";
  numero_piezas: number | null;
  precio_centimos: number;
  talla: string;
  talla_hasta: string | null;
  estado: string;
  temporada: string | null;
  provincia: string | null;
  situacion: "activa" | "reservada" | "vendida" | "retirada";
  fotos: { ruta: string; orden?: number }[];
}

export interface Filtros {
  /** Varias a la vez: un bebé siempre está a caballo entre dos tallas. */
  tallas?: string[];
  tipo?: "lote" | "prenda";
  categoria?: string;
  genero?: string;
  marca?: string;
  /** Ordena primero lo de esa provincia. NO deja fuera al resto. */
  provincia?: string;
  precioMaximoCentimos?: number;
  texto?: string;
  /** Desde 1. Cualquier cosa por debajo se trata como la primera. */
  pagina?: number;
}

export interface PaginaDeCatalogo {
  anuncios: ResumenDeAnuncio[];
  hayMas: boolean;
  total: number;
}

export const POR_PAGINA = 24;

const VACIA: PaginaDeCatalogo = { anuncios: [], hayMas: false, total: 0 };

/**
 * Deja solo letras, números, espacios y guiones.
 *
 * En un `like` de PostgreSQL, `%` y `_` son comodines: sin esto, buscar
 * «%» devolvería el catálogo entero y «100% algodón» cualquier cosa. Y
 * la coma y el paréntesis son separadores en la sintaxis de la API, así
 * que una búsqueda con ellos no rompería la base pero sí la consulta.
 *
 * Quitarlos —en vez de escaparlos uno a uno— es menos listo y mucho más
 * difícil de equivocar. Lo que se pierde es poder buscar por signos, que
 * no es cómo se busca ropa.
 */
export function limpiarTexto(entrada: string): string {
  return entrada
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

interface Consulta {
  datos: ResumenDeAnuncio[];
  total: number;
}

function aplicar(
  supabase: SupabaseClient,
  filtros: Filtros,
  texto: string | null,
) {
  let consulta = supabase
    .from("anuncios")
    .select(CAMPOS_DE_TARJETA, { count: "exact" })
    // Un anuncio retirado no sale en ninguna rejilla, ni siquiera en la
    // de su dueña: las reglas de la base se lo enseñan a ella, pero el
    // catálogo es lo que se ofrece al público.
    .in("situacion", ["activa", "reservada", "vendida"]);

  if (filtros.tallas && filtros.tallas.length > 0) {
    consulta = consulta.in("talla", filtros.tallas);
  }
  if (filtros.tipo) consulta = consulta.eq("tipo", filtros.tipo);
  if (filtros.categoria) consulta = consulta.eq("categoria", filtros.categoria);
  if (filtros.genero) consulta = consulta.eq("genero", filtros.genero);
  if (filtros.marca) {
    // Sin comodines: es igualdad, pero sin distinguir mayúsculas, porque
    // «Zara» y «zara» son la misma marca.
    consulta = consulta.ilike("marca", limpiarTexto(filtros.marca));
  }
  if (filtros.precioMaximoCentimos !== undefined) {
    consulta = consulta.lte("precio_centimos", filtros.precioMaximoCentimos);
  }
  if (texto) {
    consulta = consulta.or(
      [
        `titulo.ilike."%${texto}%"`,
        `marca.ilike."%${texto}%"`,
        `descripcion.ilike."%${texto}%"`,
      ].join(","),
    );
  }

  // El orden de la situación no es alfabético, es el de su tipo en
  // PostgreSQL: activa, reservada, vendida. O sea que lo que todavía se
  // puede comprar va delante de lo que ya se vendió, que es lo que se
  // quiere, y sale gratis.
  return consulta
    .order("situacion", { ascending: true })
    .order("publicado_el", { ascending: false });
}

/**
 * Ejecuta un tramo y devuelve sus filas y el total.
 *
 * `construir` se llama más de una vez a propósito: una consulta de
 * Supabase no se puede reutilizar después de ejecutarla, y hace falta
 * una segunda cuando se pide una página que ya no existe. PostgREST
 * contesta a un rango fuera de sitio con un error y sin recuento, así
 * que ahí se vuelve a preguntar solo cuántos hay. Pedir la página 7 de
 * un catálogo de cinco anuncios tiene que devolver vacío y el total, no
 * un error ni un cero que haría creer que no hay nada.
 */
async function ejecutar(
  construir: () => ReturnType<typeof aplicar>,
  desde: number,
  cuantos: number,
): Promise<Consulta> {
  async function soloElRecuento(): Promise<number> {
    const { count } = await construir().range(0, 0);
    return count ?? 0;
  }

  if (cuantos <= 0) return { datos: [], total: await soloElRecuento() };

  const { data, count, error } = await construir().range(
    desde,
    desde + cuantos - 1,
  );

  if (error) {
    if (desde === 0) {
      console.error("[catalogo] la consulta ha fallado:", error.message);
      return { datos: [], total: 0 };
    }
    return { datos: [], total: await soloElRecuento() };
  }

  const datos = (data as unknown as ResumenDeAnuncio[] | null) ?? [];
  return { datos, total: count ?? datos.length };
}

function tramo(
  supabase: SupabaseClient,
  filtros: Filtros,
  texto: string | null,
  provincia: string | null,
  desde: number,
  cuantos: number,
): Promise<Consulta> {
  return ejecutar(
    () => {
      const consulta = aplicar(supabase, filtros, texto);
      return provincia !== null
        ? consulta.eq("provincia", provincia)
        : consulta;
    },
    desde,
    cuantos,
  );
}

/**
 * Una página del catálogo.
 *
 * Cuando se pide provincia, se consulta en dos tramos y se pegan: antes
 * lo de esa provincia, después todo lo demás. La especificación lo pide
 * así —ordena por cercanía, pero no excluye a nadie— y con el catálogo
 * recién nacido esconder lo de la provincia de al lado sería absurdo.
 */
export async function buscarCatalogo(
  supabase: SupabaseClient,
  filtros: Filtros = {},
): Promise<PaginaDeCatalogo> {
  const texto = filtros.texto ? limpiarTexto(filtros.texto) : null;
  // Una búsqueda que después de limpiarla se queda en nada no devuelve
  // el catálogo entero: devuelve nada, que es lo que se ha buscado.
  if (filtros.texto !== undefined && !texto) return VACIA;

  const pagina = Math.max(1, Math.floor(filtros.pagina ?? 1));
  const desde = (pagina - 1) * POR_PAGINA;

  if (!filtros.provincia) {
    const { datos, total } = await tramo(
      supabase,
      filtros,
      texto,
      null,
      desde,
      POR_PAGINA,
    );
    return { anuncios: datos, hayMas: desde + datos.length < total, total };
  }

  const cerca = await tramo(
    supabase,
    filtros,
    texto,
    filtros.provincia,
    desde,
    POR_PAGINA,
  );

  const anuncios = [...cerca.datos];
  let total = cerca.total;

  // Lo de fuera solo se pide si queda hueco en la página.
  const hueco = POR_PAGINA - anuncios.length;
  const desdeFuera = Math.max(0, desde - cerca.total);
  const lejos = await tramoDeFuera(
    supabase,
    filtros,
    texto,
    desdeFuera,
    hueco,
  );
  anuncios.push(...lejos.datos);
  total += lejos.total;

  return { anuncios, hayMas: desde + anuncios.length < total, total };
}

function tramoDeFuera(
  supabase: SupabaseClient,
  filtros: Filtros,
  texto: string | null,
  desde: number,
  cuantos: number,
): Promise<Consulta> {
  return ejecutar(
    () =>
      // «Distinto de» en SQL deja fuera los nulos, y un anuncio sin
      // provincia tiene que seguir apareciendo.
      aplicar(supabase, filtros, texto).or(
        `provincia.neq.${filtros.provincia},provincia.is.null`,
      ),
    desde,
    cuantos,
  );
}

/** Cuántos anuncios hay para unos filtros. Lo usa el umbral de Google. */
export async function contarCatalogo(
  supabase: SupabaseClient,
  filtros: Filtros = {},
): Promise<number> {
  const { total } = await buscarCatalogo(supabase, { ...filtros, pagina: 1 });
  return total;
}
