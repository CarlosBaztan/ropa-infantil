import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import {
  PantallaDeCatalogo,
  claveDe,
  paginaDeLaDireccion,
  robotsDeCatalogo,
  traerCatalogo,
} from "@/components/PantallaDeCatalogo";
import {
  direccionDeLotesPorTalla,
  tallaDesdeLaDireccion,
} from "@/lib/anuncios/direcciones-seo";
import { tallaPorCodigo } from "@/lib/tallas";

/*
 * /lotes/talla/3-6-meses
 *
 * Admite también el mes suelto —/lotes/talla/4-meses— y redirige a su
 * rango, porque una madre busca por el mes que tiene el niño y no por el
 * rango con el que viene etiquetada la ropa.
 */

export const revalidate = 300;

type Parametros = Promise<{ talla: string }>;
type Busqueda = Promise<{ pagina?: string }>;

function filtrosDe(codigo: string) {
  return { tipo: "lote" as const, tallas: [codigo] };
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Parametros;
  searchParams: Busqueda;
}): Promise<Metadata> {
  const resuelta = tallaDesdeLaDireccion((await params).talla);
  if (!resuelta) return { title: "No encontrado", robots: { index: false } };

  const etiqueta = tallaPorCodigo(resuelta.codigo)!.etiqueta;
  const pagina = paginaDeLaDireccion((await searchParams).pagina);
  const filtros = { ...filtrosDe(resuelta.codigo), pagina };
  const { total } = await traerCatalogo(claveDe(filtros), filtros);

  return {
    title: `Lotes de ropa de bebé talla ${etiqueta}`,
    description: `Lotes de ropa infantil de segunda mano de la talla ${etiqueta}, con el precio por pieza a la vista.`,
    alternates: { canonical: direccionDeLotesPorTalla(resuelta.codigo) },
    robots: robotsDeCatalogo(total, pagina),
  };
}

export default async function LotesPorTalla({
  params,
  searchParams,
}: {
  params: Parametros;
  searchParams: Busqueda;
}) {
  const { talla } = await params;
  const resuelta = tallaDesdeLaDireccion(talla);
  // Una talla que no está en la lista cerrada es un 404, no una página
  // vacía: si cualquier texto diera página, habría direcciones infinitas.
  if (!resuelta) notFound();
  if (resuelta.esAtajo || resuelta.codigo !== talla) {
    redirect(direccionDeLotesPorTalla(resuelta.codigo));
  }

  const etiqueta = tallaPorCodigo(resuelta.codigo)!.etiqueta;
  const pagina = paginaDeLaDireccion((await searchParams).pagina);

  return (
    <PantallaDeCatalogo
      titulo={`Lotes de la talla ${etiqueta}`}
      entradilla="Varias prendas de una vez, con el precio por pieza calculado."
      filtros={filtrosDe(resuelta.codigo)}
      pagina={pagina}
      direccionBase={direccionDeLotesPorTalla(resuelta.codigo)}
      vacio={`Todavía no hay lotes de la talla ${etiqueta}.`}
    />
  );
}
