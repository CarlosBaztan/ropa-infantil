import type { MetadataRoute } from "next";
import { buscarCatalogo } from "@/lib/anuncios/catalogo";
import { direccionDeAnuncio } from "@/lib/anuncios/direccion";
import {
  UMBRAL_PARA_GOOGLE,
  direccionDeCategoria,
  direccionDeLotesPorTalla,
  direccionDeTalla,
} from "@/lib/anuncios/direcciones-seo";
import { CATEGORIAS } from "@/lib/anuncios/modelo";
import { clientePublico } from "@/lib/supabase/servidor";
import { TALLAS } from "@/lib/tallas";
import { sitio } from "@/lib/sitio";

/*
 * El mapa del sitio.
 *
 * Solo entra lo que pasa el umbral de diez anuncios. Un mapa que
 * anuncia cuatrocientas páginas de catálogo y trescientas noventa están
 * vacías no hace que Google indexe más: hace que se fíe menos del sitio
 * entero. Las páginas por debajo siguen existiendo y enlazadas; lo único
 * que no hacen es pedir ser guardadas.
 *
 * Se rehace cada hora: no hace falta que un anuncio aparezca en el mapa
 * en el mismo minuto en que se publica.
 */

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = sitio();
  const supabase = clientePublico();

  const fijas: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "daily", priority: 1 },
    { url: `${base}/lotes`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/legal/aviso-legal`, priority: 0.1 },
    { url: `${base}/legal/condiciones`, priority: 0.1 },
    { url: `${base}/legal/privacidad`, priority: 0.1 },
    { url: `${base}/legal/cookies`, priority: 0.1 },
  ];

  // Las fichas vivas, que son las páginas que de verdad traen visitas:
  // la búsqueda muy concreta —«lote bodies 3 meses Zara»— es el único
  // tráfico realista de un catálogo pequeño.
  const fichas: MetadataRoute.Sitemap = [];
  for (let pagina = 1; pagina <= 20; pagina++) {
    const { anuncios, hayMas } = await buscarCatalogo(supabase, { pagina });
    for (const anuncio of anuncios) {
      fichas.push({
        url: `${base}${direccionDeAnuncio(anuncio.slug, anuncio.id_publico)}`,
        changeFrequency: "weekly",
        priority: anuncio.situacion === "vendida" ? 0.3 : 0.8,
      });
    }
    if (!hayMas) break;
  }

  const porTalla = await paginasQuePasanElUmbral(
    TALLAS.map((talla) => ({
      url: `${base}${direccionDeTalla(talla.codigo)}`,
      filtros: { tallas: [talla.codigo] },
    })),
  );

  const lotesPorTalla = await paginasQuePasanElUmbral(
    TALLAS.map((talla) => ({
      url: `${base}${direccionDeLotesPorTalla(talla.codigo)}`,
      filtros: { tipo: "lote" as const, tallas: [talla.codigo] },
    })),
  );

  const porCategoria = await paginasQuePasanElUmbral(
    CATEGORIAS.map((categoria) => ({
      url: `${base}${direccionDeCategoria(categoria.codigo)}`,
      filtros: { categoria: categoria.codigo },
    })),
  );

  return [...fijas, ...porTalla, ...lotesPorTalla, ...porCategoria, ...fichas];
}

async function paginasQuePasanElUmbral(
  candidatas: { url: string; filtros: Parameters<typeof buscarCatalogo>[1] }[],
): Promise<MetadataRoute.Sitemap> {
  const supabase = clientePublico();
  const dentro: MetadataRoute.Sitemap = [];

  for (const candidata of candidatas) {
    const { total } = await buscarCatalogo(supabase, candidata.filtros);
    if (total >= UMBRAL_PARA_GOOGLE) {
      dentro.push({
        url: candidata.url,
        changeFrequency: "daily",
        priority: 0.7,
      });
    }
  }

  return dentro;
}
