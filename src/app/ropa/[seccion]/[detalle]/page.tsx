import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import {
  PantallaDeCatalogo,
  claveDe,
  paginaDeLaDireccion,
  robotsDeCatalogo,
  traerCatalogo,
} from "@/components/PantallaDeCatalogo";
import type { Filtros } from "@/lib/anuncios/catalogo";
import {
  direccionDeGeneroYTalla,
  tallaDesdeLaDireccion,
} from "@/lib/anuncios/direcciones-seo";
import {
  CATEGORIAS,
  GENEROS,
  esCategoria,
  esGenero,
  etiquetaDe,
} from "@/lib/anuncios/modelo";
import { tallaPorCodigo } from "@/lib/tallas";

/*
 * /ropa/nina/3-6-meses y /ropa/nina/vestidos
 *
 * Género más talla, o género más categoría: las dos combinaciones que
 * pide la sección 7, y las dos se escriben igual. Cuál de las dos es se
 * decide mirando el segundo tramo contra las listas cerradas, y si no
 * encaja en ninguna, 404.
 *
 * La ruta /ropa/talla/… gana a esta aunque tengan la misma forma: en
 * Next, un tramo escrito a mano pesa más que uno con corchetes.
 *
 * Los tramos se llaman «seccion» y «detalle» por una exigencia de Next:
 * un mismo sitio de la ruta tiene que llamarse igual en todas las rutas
 * que pasan por él, y arriba está /ropa/<categoria>. Con nombres
 * distintos el servidor ni arranca. Dentro, «seccion» es el género.
 */

export const revalidate = 300;

type Parametros = Promise<{ seccion: string; detalle: string }>;
type Busqueda = Promise<{ pagina?: string }>;

interface Resuelto {
  genero: string;
  etiquetaGenero: string;
  filtros: Filtros;
  titulo: string;
  descripcion: string;
  canonica: string;
  /** Adónde hay que ir si lo pedido era un atajo. */
  redirigirA: string | null;
}

function resolver(genero: string, que: string): Resuelto | null {
  if (!esGenero(genero)) return null;
  const etiquetaGenero = etiquetaDe(GENEROS, genero)!;
  const parte = etiquetaGenero.toLowerCase();

  const talla = tallaDesdeLaDireccion(que);
  if (talla) {
    const etiqueta = tallaPorCodigo(talla.codigo)!.etiqueta;
    const canonica = direccionDeGeneroYTalla(genero, talla.codigo);
    return {
      genero,
      etiquetaGenero,
      filtros: { genero, tallas: [talla.codigo] },
      titulo: `Ropa de ${parte} talla ${etiqueta}`,
      descripcion: `Ropa de ${parte} de la talla ${etiqueta}, de segunda mano entre familias, con entrega en mano.`,
      canonica,
      redirigirA: talla.esAtajo || talla.codigo !== que ? canonica : null,
    };
  }

  if (esCategoria(que)) {
    const etiqueta = etiquetaDe(CATEGORIAS, que)!;
    return {
      genero,
      etiquetaGenero,
      filtros: { genero, categoria: que },
      titulo: `${etiqueta} de ${parte}`,
      descripcion: `${etiqueta} de ${parte} de segunda mano entre familias, por talla y temporada.`,
      canonica: `/ropa/${genero}/${que}`,
      redirigirA: null,
    };
  }

  return null;
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Parametros;
  searchParams: Busqueda;
}): Promise<Metadata> {
  const { seccion: genero, detalle: que } = await params;
  const resuelto = resolver(genero, que);
  if (!resuelto) return { title: "No encontrado", robots: { index: false } };

  const pagina = paginaDeLaDireccion((await searchParams).pagina);
  const filtros = { ...resuelto.filtros, pagina };
  const { total } = await traerCatalogo(claveDe(filtros), filtros);

  return {
    title: `${resuelto.titulo} de segunda mano`,
    description: resuelto.descripcion,
    alternates: { canonical: resuelto.canonica },
    robots: robotsDeCatalogo(total, pagina),
  };
}

export default async function PorGenero({
  params,
  searchParams,
}: {
  params: Parametros;
  searchParams: Busqueda;
}) {
  const { seccion: genero, detalle: que } = await params;
  const resuelto = resolver(genero, que);
  if (!resuelto) notFound();
  if (resuelto.redirigirA) redirect(resuelto.redirigirA);

  const pagina = paginaDeLaDireccion((await searchParams).pagina);

  return (
    <PantallaDeCatalogo
      titulo={resuelto.titulo}
      entradilla="De segunda mano, entre familias, con entrega en mano."
      filtros={resuelto.filtros}
      pagina={pagina}
      direccionBase={resuelto.canonica}
      vacio={`Todavía no hay nada en ${resuelto.titulo.toLowerCase()}.`}
    />
  );
}
