import type { Metadata } from "next";
import Link from "next/link";
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
  direccionDeTalla,
  tallaDesdeLaDireccion,
} from "@/lib/anuncios/direcciones-seo";
import { tallaPorCodigo, tallaSiguiente } from "@/lib/tallas";

/*
 * /ropa/talla/3-6-meses — todo lo de una talla, lotes y prendas.
 *
 * Es la página de aterrizaje que más tráfico debería traer: la talla es
 * la primera pregunta que se hace quien busca ropa infantil.
 */

export const revalidate = 300;

type Parametros = Promise<{ talla: string }>;
type Busqueda = Promise<{ pagina?: string }>;

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
  const filtros = { tallas: [resuelta.codigo], pagina };
  const { total } = await traerCatalogo(claveDe(filtros), filtros);

  return {
    title: `Ropa de bebé y niño talla ${etiqueta}, de segunda mano`,
    description: `Ropa infantil de segunda mano de la talla ${etiqueta} entre familias, con entrega en mano y sin gastos de envío.`,
    alternates: { canonical: direccionDeTalla(resuelta.codigo) },
    robots: robotsDeCatalogo(total, pagina),
  };
}

export default async function RopaPorTalla({
  params,
  searchParams,
}: {
  params: Parametros;
  searchParams: Busqueda;
}) {
  const { talla } = await params;
  const resuelta = tallaDesdeLaDireccion(talla);
  if (!resuelta) notFound();
  if (resuelta.esAtajo || resuelta.codigo !== talla) {
    redirect(direccionDeTalla(resuelta.codigo));
  }

  const actual = tallaPorCodigo(resuelta.codigo)!;
  const siguiente = tallaSiguiente(resuelta.codigo);
  const pagina = paginaDeLaDireccion((await searchParams).pagina);

  return (
    <PantallaDeCatalogo
      titulo={`Ropa de la talla ${actual.etiqueta}`}
      entradilla={`Equivale a la talla europea ${actual.tallaEu}. Entrega en mano, sin gastos de envío.`}
      filtros={{ tallas: [resuelta.codigo] }}
      pagina={pagina}
      direccionBase={direccionDeTalla(resuelta.codigo)}
      vacio={`Todavía no hay nada de la talla ${actual.etiqueta}. Vuelve en unos días: el catálogo crece cada semana.`}
    >
      <nav aria-label="Atajos" className="atajos">
        <Link className="atajo" href={direccionDeLotesPorTalla(actual.codigo)}>
          Solo lotes
        </Link>
        {siguiente && (
          // El motor del nicho: la ropa se compra para dentro de tres
          // meses, no para hoy.
          <Link className="atajo" href={direccionDeTalla(siguiente.codigo)}>
            La talla siguiente ({siguiente.etiqueta})
          </Link>
        )}
      </nav>
    </PantallaDeCatalogo>
  );
}
