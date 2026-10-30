import type { Metadata } from "next";
import Link from "next/link";
import {
  PantallaDeCatalogo,
  claveDe,
  paginaDeLaDireccion,
  robotsDeCatalogo,
  traerCatalogo,
} from "@/components/PantallaDeCatalogo";
import { direccionDeLotesPorTalla } from "@/lib/anuncios/direcciones-seo";
import { TALLAS } from "@/lib/tallas";

/*
 * /lotes — la página más importante del catálogo.
 *
 * «Lote de ropa de bebé» es de lo más buscado y lo que ningún
 * generalista enseña aparte. Es la entrada natural al nicho.
 */

export const revalidate = 300;

const FILTROS = { tipo: "lote" as const };
const ENTRADILLA =
  "Varias prendas de una vez, de la misma talla o de tallas seguidas. " +
  "Sale mucho más barato por pieza y se resuelve en un solo encuentro.";

type Busqueda = Promise<{ pagina?: string }>;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Busqueda;
}): Promise<Metadata> {
  const pagina = paginaDeLaDireccion((await searchParams).pagina);
  const { total } = await traerCatalogo(claveDe({ ...FILTROS, pagina }), {
    ...FILTROS,
    pagina,
  });

  return {
    title: "Lotes de ropa de bebé y niño de segunda mano",
    description: ENTRADILLA,
    alternates: { canonical: "/lotes" },
    robots: robotsDeCatalogo(total, pagina),
  };
}

export default async function Lotes({
  searchParams,
}: {
  searchParams: Busqueda;
}) {
  const pagina = paginaDeLaDireccion((await searchParams).pagina);

  return (
    <PantallaDeCatalogo
      titulo="Lotes de ropa infantil"
      entradilla={ENTRADILLA}
      filtros={FILTROS}
      pagina={pagina}
      direccionBase="/lotes"
      vacio="Todavía no hay lotes publicados. Si tienes ropa que se le ha quedado pequeña, el primero puede ser el tuyo."
    >
      <nav aria-label="Lotes por talla" className="atajos">
        {TALLAS.slice(0, 8).map((talla) => (
          <Link
            key={talla.codigo}
            className="atajo"
            href={direccionDeLotesPorTalla(talla.codigo)}
          >
            {talla.etiqueta}
          </Link>
        ))}
      </nav>
    </PantallaDeCatalogo>
  );
}
