import type { Metadata } from "next";
import {
  PantallaDeCatalogo,
  claveDe,
  paginaDeLaDireccion,
  robotsDeCatalogo,
  traerCatalogo,
} from "@/components/PantallaDeCatalogo";
import {
  direccionDeMarca,
  marcaDesdeSlug,
} from "@/lib/anuncios/direcciones-seo";

/*
 * /marca/zara
 *
 * La marca la escribe quien publica, así que no hay lista cerrada que
 * validar: cualquier texto puede ser una marca. Aquí no se devuelve 404
 * por una marca desconocida —sería 404 hasta que alguien la escriba por
 * primera vez—, pero sin anuncios la página no se le ofrece a Google, y
 * de eso ya se encarga el umbral.
 */

export const revalidate = 300;

type Parametros = Promise<{ marca: string }>;
type Busqueda = Promise<{ pagina?: string }>;

/** «petit-bateau» se enseña como «Petit Bateau». */
function conMayusculas(nombre: string): string {
  return nombre
    .split(" ")
    .map((palabra) => palabra.charAt(0).toUpperCase() + palabra.slice(1))
    .join(" ");
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Parametros;
  searchParams: Busqueda;
}): Promise<Metadata> {
  const { marca } = await params;
  const nombre = conMayusculas(marcaDesdeSlug(marca));
  const pagina = paginaDeLaDireccion((await searchParams).pagina);
  const filtros = { marca: marcaDesdeSlug(marca), pagina };
  const { total } = await traerCatalogo(claveDe(filtros), filtros);

  return {
    title: `Ropa de ${nombre} de segunda mano para bebé y niño`,
    description: `Ropa infantil de ${nombre} de segunda mano entre familias, por talla y temporada.`,
    alternates: { canonical: direccionDeMarca(marca) },
    robots: robotsDeCatalogo(total, pagina),
  };
}

export default async function PorMarca({
  params,
  searchParams,
}: {
  params: Parametros;
  searchParams: Busqueda;
}) {
  const { marca } = await params;
  const nombre = conMayusculas(marcaDesdeSlug(marca));
  const pagina = paginaDeLaDireccion((await searchParams).pagina);

  return (
    <PantallaDeCatalogo
      titulo={`Ropa de ${nombre}`}
      entradilla="De segunda mano, entre familias."
      filtros={{ marca: marcaDesdeSlug(marca) }}
      pagina={pagina}
      direccionBase={direccionDeMarca(marca)}
      vacio={`Todavía no hay nada de ${nombre}.`}
    />
  );
}
