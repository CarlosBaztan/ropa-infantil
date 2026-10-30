import type { MetadataRoute } from "next";
import { direccionDeAnuncio } from "@/lib/anuncios/direccion";
import {
  UMBRAL_PARA_GOOGLE,
  direccionDeCategoria,
  direccionDeGeneroYTalla,
  direccionDeLotesPorTalla,
  direccionDeTalla,
} from "@/lib/anuncios/direcciones-seo";
import { PROVINCIAS } from "@/lib/provincias";
import { clientePublico } from "@/lib/supabase/servidor";
import { sitio } from "@/lib/sitio";

/*
 * El mapa del sitio.
 *
 * Solo entra lo que pasa el umbral de diez anuncios. Un mapa que
 * anuncia cuatrocientas páginas y trescientas noventa están vacías no
 * hace que Google indexe más: hace que se fíe menos del sitio entero.
 * Las de debajo del umbral siguen existiendo y enlazadas; lo único que
 * no hacen es pedir ser guardadas.
 *
 * Se traen los anuncios una vez y se cuenta aquí, en vez de preguntar a
 * la base cuántos hay de cada talla, de cada categoría y de cada
 * provincia: eso serían más de doscientas consultas para construir un
 * archivo que apenas cambia.
 */

export const revalidate = 3600;

/** Tope de seguridad: con más que esto, el mapa habría que partirlo. */
const MAXIMO = 20_000;

interface Fila {
  id_publico: string;
  slug: string;
  talla: string;
  tipo: string;
  categoria: string;
  genero: string | null;
  provincia: string | null;
  situacion: string;
  publicado_el: string;
}

function sumar(cuenta: Map<string, number>, clave: string | null) {
  if (!clave) return;
  cuenta.set(clave, (cuenta.get(clave) ?? 0) + 1);
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = sitio();
  const supabase = clientePublico();

  const { data } = await supabase
    .from("anuncios")
    .select(
      "id_publico, slug, talla, tipo, categoria, genero, provincia, situacion, publicado_el",
    )
    .in("situacion", ["activa", "reservada", "vendida"])
    .order("publicado_el", { ascending: false })
    .limit(MAXIMO);

  const anuncios = (data as unknown as Fila[] | null) ?? [];

  const porTalla = new Map<string, number>();
  const lotesPorTalla = new Map<string, number>();
  const porCategoria = new Map<string, number>();
  const porProvincia = new Map<string, number>();
  const porGeneroYTalla = new Map<string, number>();

  for (const anuncio of anuncios) {
    sumar(porTalla, anuncio.talla);
    if (anuncio.tipo === "lote") sumar(lotesPorTalla, anuncio.talla);
    sumar(porCategoria, anuncio.categoria);
    sumar(porProvincia, anuncio.provincia);
    if (anuncio.genero) {
      sumar(porGeneroYTalla, `${anuncio.genero}/${anuncio.talla}`);
    }
  }

  const fijas: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "daily", priority: 1 },
    { url: `${base}/lotes`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/legal/aviso-legal`, priority: 0.1 },
    { url: `${base}/legal/condiciones`, priority: 0.1 },
    { url: `${base}/legal/privacidad`, priority: 0.1 },
    { url: `${base}/legal/cookies`, priority: 0.1 },
  ];

  // Las fichas vivas son las páginas que de verdad traen visitas: la
  // búsqueda muy concreta —«lote bodies 3 meses Zara»— es el único
  // tráfico realista de un catálogo pequeño. Van todas, sin umbral: una
  // ficha nunca está vacía.
  const fichas: MetadataRoute.Sitemap = anuncios.map((anuncio) => ({
    url: `${base}${direccionDeAnuncio(anuncio.slug, anuncio.id_publico)}`,
    changeFrequency: "weekly" as const,
    priority: anuncio.situacion === "vendida" ? 0.3 : 0.8,
  }));

  function conUmbral(
    cuenta: Map<string, number>,
    direccion: (clave: string) => string,
  ): MetadataRoute.Sitemap {
    const dentro: MetadataRoute.Sitemap = [];
    for (const [clave, cuantos] of cuenta) {
      if (cuantos < UMBRAL_PARA_GOOGLE) continue;
      dentro.push({
        url: `${base}${direccion(clave)}`,
        changeFrequency: "daily",
        priority: 0.7,
      });
    }
    return dentro;
  }

  return [
    ...fijas,
    ...conUmbral(porTalla, direccionDeTalla),
    ...conUmbral(lotesPorTalla, direccionDeLotesPorTalla),
    ...conUmbral(porCategoria, direccionDeCategoria),
    // Las provincias nacen una a una, cuando alcanzan sus diez anuncios.
    // No se crean las 52 de golpe.
    ...conUmbral(porProvincia, (codigo) => {
      const provincia = PROVINCIAS.find((p) => p.codigo === codigo);
      return provincia ? `/ropa-segunda-mano/${provincia.slug}` : "/";
    }),
    ...conUmbral(porGeneroYTalla, (clave) => {
      const [genero, talla] = clave.split("/");
      return direccionDeGeneroYTalla(genero!, talla!);
    }),
    ...fichas,
  ];
}
