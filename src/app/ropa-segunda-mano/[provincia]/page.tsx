import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  PantallaDeCatalogo,
  claveDe,
  paginaDeLaDireccion,
  robotsDeCatalogo,
  traerCatalogo,
} from "@/components/PantallaDeCatalogo";
import { provinciaPorSlug } from "@/lib/provincias";

/*
 * /ropa-segunda-mano/madrid
 *
 * La página de la zona, que es la que importa en el arranque: toda la
 * captación va a estar concentrada en un sitio, y «ropa de bebé segunda
 * mano Madrid» es lo que se busca.
 *
 * Las provincias nacen una a una, no las 52 de golpe: la página existe
 * siempre, pero hasta los diez anuncios no se le ofrece a Google ni
 * entra en el mapa del sitio. De eso se encarga el umbral.
 *
 * Ojo con lo que hace el filtro: la provincia ORDENA y no excluye, así
 * que esta página enseña primero lo de esa provincia y después el resto
 * de España. Con el catálogo recién nacido, una página de Madrid que
 * esconda un lote de Toledo no le hace un favor a nadie.
 */

export const revalidate = 300;

type Parametros = Promise<{ provincia: string }>;
type Busqueda = Promise<{ pagina?: string }>;

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Parametros;
  searchParams: Busqueda;
}): Promise<Metadata> {
  const provincia = provinciaPorSlug((await params).provincia);
  if (!provincia) return { title: "No encontrado", robots: { index: false } };

  const pagina = paginaDeLaDireccion((await searchParams).pagina);
  const filtros = { provincia: provincia.codigo, pagina };
  const { total } = await traerCatalogo(claveDe(filtros), filtros);

  return {
    title: `Ropa de bebé y niño de segunda mano en ${provincia.nombre}`,
    description: `Ropa infantil de segunda mano entre familias de ${provincia.nombre}, con entrega en mano y sin gastos de envío.`,
    alternates: { canonical: `/ropa-segunda-mano/${provincia.slug}` },
    robots: robotsDeCatalogo(total, pagina),
  };
}

export default async function PorProvincia({
  params,
  searchParams,
}: {
  params: Parametros;
  searchParams: Busqueda;
}) {
  const provincia = provinciaPorSlug((await params).provincia);
  if (!provincia) notFound();

  const pagina = paginaDeLaDireccion((await searchParams).pagina);

  return (
    <PantallaDeCatalogo
      titulo={`Ropa infantil de segunda mano en ${provincia.nombre}`}
      entradilla={`Primero lo que hay en ${provincia.nombre}, y después el resto de España. La entrega en mano se acuerda entre vosotras.`}
      filtros={{ provincia: provincia.codigo }}
      pagina={pagina}
      direccionBase={`/ropa-segunda-mano/${provincia.slug}`}
      vacio={`Todavía no hay nada en ${provincia.nombre}.`}
    />
  );
}
