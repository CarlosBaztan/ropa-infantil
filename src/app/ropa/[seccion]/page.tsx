import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  PantallaDeCatalogo,
  claveDe,
  paginaDeLaDireccion,
  robotsDeCatalogo,
  traerCatalogo,
} from "@/components/PantallaDeCatalogo";
import { direccionDeCategoria } from "@/lib/anuncios/direcciones-seo";
import { CATEGORIAS, etiquetaDe } from "@/lib/anuncios/modelo";

/*
 * /ropa/vestidos — una categoría entera.
 *
 * La ruta /ropa/talla/… gana a esta aunque las dos empiecen igual: en
 * Next, un tramo escrito a mano pesa más que uno con corchetes.
 *
 * El tramo se llama «seccion» y no «categoria» porque Next exige que un
 * mismo sitio de la ruta tenga el mismo nombre en todas las rutas que
 * pasan por él, y debajo cuelga /ropa/<genero>/<lo que sea>. Si no
 * coinciden, el servidor no arranca.
 */

export const revalidate = 300;

type Parametros = Promise<{ seccion: string }>;
type Busqueda = Promise<{ pagina?: string }>;

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Parametros;
  searchParams: Busqueda;
}): Promise<Metadata> {
  const { seccion: categoria } = await params;
  const etiqueta = etiquetaDe(CATEGORIAS, categoria);
  if (!etiqueta) return { title: "No encontrado", robots: { index: false } };

  const pagina = paginaDeLaDireccion((await searchParams).pagina);
  const filtros = { categoria, pagina };
  const { total } = await traerCatalogo(claveDe(filtros), filtros);

  return {
    title: `${etiqueta} de bebé y niño de segunda mano`,
    description: `${etiqueta} de segunda mano entre familias, por talla y temporada, con entrega en mano.`,
    alternates: { canonical: direccionDeCategoria(categoria) },
    robots: robotsDeCatalogo(total, pagina),
  };
}

export default async function PorCategoria({
  params,
  searchParams,
}: {
  params: Parametros;
  searchParams: Busqueda;
}) {
  const { seccion: categoria } = await params;
  const etiqueta = etiquetaDe(CATEGORIAS, categoria);
  // Una categoría inventada es un 404, igual que una talla inventada.
  if (!etiqueta) notFound();

  const pagina = paginaDeLaDireccion((await searchParams).pagina);

  return (
    <PantallaDeCatalogo
      titulo={etiqueta}
      entradilla="De segunda mano, entre familias, con entrega en mano."
      filtros={{ categoria }}
      pagina={pagina}
      direccionBase={direccionDeCategoria(categoria)}
      vacio={`Todavía no hay nada en ${etiqueta.toLowerCase()}.`}
    />
  );
}
