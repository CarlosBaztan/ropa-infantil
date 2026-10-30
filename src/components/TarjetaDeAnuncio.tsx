import Link from "next/link";
import { direccionDeAnuncio } from "@/lib/anuncios/direccion";
import { portadaDe } from "@/lib/anuncios/fotos";
import { ESTADOS_DE_CONSERVACION, etiquetaDe } from "@/lib/anuncios/modelo";
import { formatearPrecio, precioPorPieza } from "@/lib/anuncios/precio";
import type { ResumenDeAnuncio } from "@/lib/anuncios/catalogo";
import { provinciaPorCodigo } from "@/lib/provincias";
import { tallaPorCodigo } from "@/lib/tallas";

/*
 * La tarjeta del catálogo. Una sola, usada por la portada, las páginas
 * de aterrizaje, el buscador, el armario y las alternativas de un
 * anuncio vendido: si cada pantalla tuviera la suya, el precio por pieza
 * acabaría apareciendo en unas y no en otras.
 *
 * No lleva el nombre de quien vende. Es ruido: quien compra mira la
 * foto, el precio, la talla y dónde está.
 *
 * EL ENLACE ES SOLO EL TÍTULO, y se estira por encima de toda la tarjeta
 * con un pseudoelemento. Antes el enlace lo envolvía todo, y eso tenía
 * dos consecuencias que no se ven mirando la pantalla: su nombre salía
 * de pegar todo el texto de dentro —«Vendido Lote · 8 piezas Lote de
 * bodies 24,00 € 3,00 € la pieza 3-6 meses · Como nuevo · Madrid»—, con
 * el título en tercer lugar; y la rejilla no tenía ni un encabezado, así
 * que no se podía recorrer saltando de título en título, que es como se
 * ojea un catálogo cuando no se ve. Con el enlace en el título, el
 * pulgar sigue pudiendo pulsar en cualquier parte de la tarjeta.
 */

function tallaEnPalabras(anuncio: ResumenDeAnuncio): string {
  const desde = tallaPorCodigo(anuncio.talla)?.etiqueta ?? anuncio.talla;
  const hasta = anuncio.talla_hasta
    ? tallaPorCodigo(anuncio.talla_hasta)?.etiqueta
    : null;
  return hasta ? `${desde} a ${hasta}` : desde;
}

/** Del estado solo cabe la primera parte: «Como nuevo», no la frase. */
function estadoCorto(codigo: string): string | null {
  const entero = etiquetaDe(ESTADOS_DE_CONSERVACION, codigo);
  return entero ? (entero.split("—")[0] ?? entero).trim() : null;
}

export function TarjetaDeAnuncio({ anuncio }: { anuncio: ResumenDeAnuncio }) {
  const portada = portadaDe(anuncio.fotos);
  const piezas = anuncio.numero_piezas ?? 0;
  const esLote = anuncio.tipo === "lote" && piezas > 1;
  const porPieza = esLote
    ? precioPorPieza(anuncio.precio_centimos, piezas)
    : null;
  const provincia = provinciaPorCodigo(anuncio.provincia ?? "")?.nombre;

  return (
    <article className="tarjeta-anuncio">
      <div className="foto-de-tarjeta">
        {portada ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={portada} alt="" width={400} height={500} loading="lazy" />
        ) : (
          <div aria-hidden="true" className="foto-vacia" />
        )}
        {anuncio.situacion === "vendida" && (
          <span className="distintivo distintivo-vendida sobre-la-foto">
            Vendido
          </span>
        )}
        {anuncio.situacion === "reservada" && (
          <span className="distintivo sobre-la-foto">Reservado</span>
        )}
      </div>

      {esLote && (
        <p>
          <span className="distintivo distintivo-lote">
            Lote · {piezas} piezas
          </span>
        </p>
      )}

      <h3 className="titulo-tarjeta">
        <Link
          className="enlace-estirado"
          href={direccionDeAnuncio(anuncio.slug, anuncio.id_publico)}
        >
          {anuncio.titulo}
        </Link>
      </h3>

      <p className="precio" style={{ fontWeight: 700 }}>
        {formatearPrecio(anuncio.precio_centimos)}
      </p>
      {porPieza !== null && (
        // El argumento de venta del nicho, y la cuenta que nadie hace de
        // cabeza mientras mira el móvil con una mano.
        <p className="ayuda precio">{formatearPrecio(porPieza)} la pieza</p>
      )}

      <p className="ayuda">
        {[tallaEnPalabras(anuncio), estadoCorto(anuncio.estado), provincia]
          .filter(Boolean)
          .join(" · ")}
      </p>
    </article>
  );
}
