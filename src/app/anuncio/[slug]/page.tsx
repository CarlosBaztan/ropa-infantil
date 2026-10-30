import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  buscarAlternativas,
  buscarAnuncio,
  type AnuncioCompleto,
} from "@/lib/anuncios/consulta";
import { RejillaDeAnuncios } from "@/components/RejillaDeAnuncios";
import { conversacionSobre } from "@/lib/mensajes/consulta";
import { preguntar } from "@/app/mensajes/acciones";
import { urlDeFoto } from "@/lib/anuncios/fotos";
import { direccionDeAnuncio, idPublicoDe } from "@/lib/anuncios/direccion";
import {
  AJUSTES_DE_TALLA,
  CATEGORIAS,
  ESTADOS_DE_CONSERVACION,
  GENEROS,
  TEMPORADAS,
  etiquetaDe,
} from "@/lib/anuncios/modelo";
import { formatearPrecio, precioPorPieza } from "@/lib/anuncios/precio";
import { provinciaPorCodigo } from "@/lib/provincias";
import { clienteServidor } from "@/lib/supabase/servidor";
import { tallaPorCodigo } from "@/lib/tallas";

/*
 * La ficha pública de un anuncio.
 *
 * Es la página que se comparte por WhatsApp y la que indexa Google, así
 * que tiene que entenderse sin haber visto el resto del sitio y sin tener
 * cuenta. El orden de la pantalla es el orden en que se decide una compra:
 * foto, qué es, cuánto cuesta, de qué talla, en qué estado, quién lo vende
 * y cómo se recoge.
 *
 * Un anuncio vendido NO desaparece: su página sigue viva, marcada, y
 * ofrece alternativas de la misma talla. Esas visitas ya han llegado; lo
 * caro sería volver a conseguirlas.
 */

function tallaEnPalabras(anuncio: AnuncioCompleto): string {
  const desde = tallaPorCodigo(anuncio.talla)?.etiqueta ?? anuncio.talla;
  const hasta = anuncio.talla_hasta
    ? tallaPorCodigo(anuncio.talla_hasta)?.etiqueta
    : null;
  return hasta ? `De ${desde} a ${hasta}` : desde;
}

function lugarEnPalabras(anuncio: AnuncioCompleto): string | null {
  const provincia = provinciaPorCodigo(anuncio.provincia ?? "")?.nombre;
  const partes = [anuncio.ciudad, provincia].filter(Boolean);
  return partes.length > 0 ? partes.join(" · ") : null;
}

/** Una frase que resume el anuncio, para buscadores y para WhatsApp. */
function resumen(anuncio: AnuncioCompleto): string {
  const trozos: string[] = [tallaEnPalabras(anuncio)];

  if (anuncio.tipo === "lote" && anuncio.numero_piezas) {
    const pieza = precioPorPieza(anuncio.precio_centimos, anuncio.numero_piezas);
    trozos.push(
      `${anuncio.numero_piezas} piezas por ${formatearPrecio(
        anuncio.precio_centimos,
      )}, a ${formatearPrecio(pieza)} la pieza`,
    );
  } else {
    trozos.push(formatearPrecio(anuncio.precio_centimos));
  }

  const estado = etiquetaDe(ESTADOS_DE_CONSERVACION, anuncio.estado);
  if (estado) trozos.push(estado);

  const lugar = lugarEnPalabras(anuncio);
  if (lugar) trozos.push(lugar);

  return `${trozos.join(". ")}.`;
}

async function cargar(parametro: string) {
  const idPublico = idPublicoDe(parametro);
  if (!idPublico) return null;

  const supabase = await clienteServidor();
  const anuncio = await buscarAnuncio(supabase, idPublico);
  if (!anuncio) return null;

  return { supabase, anuncio };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const cargado = await cargar(slug);
  if (!cargado) {
    return { title: "Anuncio no encontrado", robots: { index: false } };
  }

  const { anuncio } = cargado;
  const primera = anuncio.fotos[0];
  const direccion = direccionDeAnuncio(anuncio.slug, anuncio.id_publico);

  return {
    title: anuncio.titulo,
    description: resumen(anuncio),
    alternates: { canonical: direccion },
    // Un anuncio retirado solo lo ve su dueña: no tiene nada que hacer en
    // un buscador.
    robots: anuncio.situacion === "retirada" ? { index: false } : undefined,
    openGraph: {
      title: anuncio.titulo,
      description: resumen(anuncio),
      type: "website",
      images: primera
        ? [
            {
              url: urlDeFoto(primera.ruta),
              width: primera.ancho,
              height: primera.alto,
            },
          ]
        : undefined,
    },
  };
}

export default async function FichaDeAnuncio({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { slug } = await params;
  const { error } = await searchParams;
  const cargado = await cargar(slug);
  if (!cargado) notFound();

  const { supabase, anuncio } = cargado;

  // Si el título cambió, el enlace viejo sigue valiendo pero lleva al
  // nuevo. Una sola dirección por anuncio, que es lo que Google premia.
  const direccion = direccionDeAnuncio(anuncio.slug, anuncio.id_publico);
  if (direccion !== `/anuncio/${slug}`) redirect(direccion);

  const esLote = anuncio.tipo === "lote";
  const piezas = anuncio.numero_piezas ?? 0;
  const porPieza =
    esLote && piezas > 1 ? precioPorPieza(anuncio.precio_centimos, piezas) : null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const esMio = user?.id === anuncio.vendedor;
  // Si ya hay conversación abierta sobre este anuncio se lleva a ella:
  // abrir un hilo nuevo sobre algo de lo que ya se está hablando
  // confunde a las dos partes.
  const yaHablamos = user && !esMio
    ? await conversacionSobre(supabase, anuncio.id)
    : null;

  const alternativas =
    anuncio.situacion === "vendida"
      ? await buscarAlternativas(supabase, anuncio.talla, anuncio.id_publico)
      : [];

  const lugar = lugarEnPalabras(anuncio);
  const categoria = etiquetaDe(CATEGORIAS, anuncio.categoria);
  const estado = etiquetaDe(ESTADOS_DE_CONSERVACION, anuncio.estado);
  const temporada = anuncio.temporada
    ? etiquetaDe(TEMPORADAS, anuncio.temporada)
    : null;
  const genero = anuncio.genero ? etiquetaDe(GENEROS, anuncio.genero) : null;
  // El ajuste normal no se enseña: solo interesa saber que viene grande o
  // pequeña, que es la queja repetida de quien compra ropa por internet.
  const ajuste =
    anuncio.ajuste !== "normal"
      ? etiquetaDe(AJUSTES_DE_TALLA, anuncio.ajuste)
      : null;

  return (
    <div className="pagina">
      <script
        type="application/ld+json"
        // El título lo escribe una persona: se escapa el menor-que para
        // que no pueda cerrar la etiqueta y colar código.
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(datosParaBuscadores(anuncio)).replace(
            /</g,
            "\\u003c",
          ),
        }}
      />

      {/* Si preguntar ha fallado se vuelve aquí: sin esto, se pulsa
        * «Enviar la pregunta», la página se recarga igual y no pasa nada
        * visible, que es la peor forma de fallar. */}
      {error && (
        <p role="alert" className="aviso-error" style={{ marginBottom: "var(--sp-5)" }}>
          <span>{error}</span>
        </p>
      )}

      {anuncio.situacion === "retirada" && (
        <p className="aviso-error" style={{ marginBottom: "var(--sp-5)" }}>
          <span>
            Este anuncio está retirado: solo lo ves tú. Puedes volver a
            publicarlo desde <Link href="/mis-anuncios">tus anuncios</Link>.
          </span>
        </p>
      )}

      {anuncio.fotos.length > 0 && (
        <div className="galeria">
          {anuncio.fotos.map((foto, indice) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={foto.ruta}
              src={urlDeFoto(foto.ruta)}
              alt={
                foto.texto_alternativo ??
                `${anuncio.titulo} — foto ${indice + 1} de ${anuncio.fotos.length}`
              }
              width={foto.ancho}
              height={foto.alto}
              // La primera entra con la pantalla; las demás solo si llegan
              // a verse, que en el móvil suele ser nunca.
              loading={indice === 0 ? "eager" : "lazy"}
              decoding="async"
            />
          ))}
        </div>
      )}

      <div
        style={{
          display: "flex",
          gap: "var(--sp-2)",
          flexWrap: "wrap",
          marginTop: "var(--sp-5)",
        }}
      >
        {esLote && (
          <span className="distintivo distintivo-lote">
            Lote de {piezas} piezas
          </span>
        )}
        {anuncio.situacion === "reservada" && (
          <span className="distintivo">Reservado</span>
        )}
        {anuncio.situacion === "vendida" && (
          <span className="distintivo distintivo-vendida">Vendido</span>
        )}
      </div>

      <h1
        style={{
          fontSize: "var(--fs-2xl)",
          lineHeight: "var(--lh-tight)",
          marginTop: "var(--sp-3)",
        }}
      >
        {anuncio.titulo}
      </h1>

      <p className="ficha-precio precio" style={{ marginTop: "var(--sp-4)" }}>
        {formatearPrecio(anuncio.precio_centimos)}
      </p>

      {porPieza !== null && (
        // El argumento de venta del nicho, y la cuenta que nadie hace de
        // cabeza en la cola del supermercado.
        <p className="precio" style={{ color: "var(--c-ink-muted)" }}>
          {formatearPrecio(porPieza)} la pieza
        </p>
      )}

      <dl className="datos" style={{ marginTop: "var(--sp-6)" }}>
        <dt>Talla</dt>
        <dd>{tallaEnPalabras(anuncio)}</dd>

        {categoria && (
          <>
            <dt>Tipo</dt>
            <dd>{categoria}</dd>
          </>
        )}

        {estado && (
          <>
            <dt>Estado</dt>
            <dd>{estado}</dd>
          </>
        )}

        {ajuste && (
          <>
            <dt>Ajuste</dt>
            <dd>{ajuste}</dd>
          </>
        )}

        {temporada && (
          <>
            <dt>Temporada</dt>
            <dd>{temporada}</dd>
          </>
        )}

        {genero && (
          <>
            <dt>Para</dt>
            <dd>{genero}</dd>
          </>
        )}

        {anuncio.marca && (
          <>
            <dt>Marca</dt>
            <dd>{anuncio.marca}</dd>
          </>
        )}

        {anuncio.color && (
          <>
            <dt>Color</dt>
            <dd>{anuncio.color}</dd>
          </>
        )}
      </dl>

      {anuncio.descripcion && (
        <section style={{ marginTop: "var(--sp-6)" }}>
          <h2 style={{ fontSize: "var(--fs-lg)" }}>Descripción</h2>
          <p style={{ marginTop: "var(--sp-2)", whiteSpace: "pre-line" }}>
            {anuncio.descripcion}
          </p>
        </section>
      )}

      {esLote && anuncio.desglose && (
        <section style={{ marginTop: "var(--sp-6)" }}>
          <h2 style={{ fontSize: "var(--fs-lg)" }}>Qué lleva el lote</h2>
          <p style={{ marginTop: "var(--sp-2)", whiteSpace: "pre-line" }}>
            {anuncio.desglose}
          </p>
        </section>
      )}

      {anuncio.defectos && (
        // Los defectos se enseñan aparte y con marco, no escondidos al
        // final de la descripción: una devolución por una mancha que no se
        // avisó cuesta mucho más que la venta.
        <section className="tarjeta" style={{ marginTop: "var(--sp-6)" }}>
          <h2 style={{ fontSize: "var(--fs-lg)" }}>Lo que hay que saber</h2>
          <p style={{ marginTop: "var(--sp-2)", whiteSpace: "pre-line" }}>
            {anuncio.defectos}
          </p>
        </section>
      )}

      <section className="tarjeta" style={{ marginTop: "var(--sp-6)" }}>
        <h2 style={{ fontSize: "var(--fs-lg)" }}>Cómo se entrega</h2>
        <ul style={{ marginTop: "var(--sp-3)", paddingLeft: "var(--sp-5)" }}>
          {anuncio.acepta_entrega_mano && (
            <li>
              En mano
              {anuncio.zona_encuentro
                ? ` — ${anuncio.zona_encuentro}`
                : lugar
                  ? ` — ${lugar}`
                  : ""}
            </li>
          )}
          {anuncio.acepta_envio && (
            <li>
              Con envío, que acordáis entre vosotras. De momento la
              plataforma no lo gestiona ni cobra por ello.
            </li>
          )}
        </ul>
      </section>

      <section style={{ marginTop: "var(--sp-6)" }}>
        <h2 style={{ fontSize: "var(--fs-lg)" }}>Quién lo vende</h2>
        <p style={{ marginTop: "var(--sp-2)" }}>
          {anuncio.perfil?.alias ? (
            <Link href={`/armario/${anuncio.perfil.alias}`}>
              {anuncio.perfil.alias}
            </Link>
          ) : (
            "Una familia de la plataforma"
          )}
          {lugar ? ` · ${lugar}` : ""}
        </p>
        {esMio ? (
          <p className="ayuda" style={{ marginTop: "var(--sp-3)" }}>
            Este anuncio es tuyo. Las preguntas te llegan a{" "}
            <Link href="/mensajes">tus mensajes</Link>.
          </p>
        ) : yaHablamos ? (
          <p style={{ marginTop: "var(--sp-4)" }}>
            <Link className="boton" href={`/mensajes/${yaHablamos}`}>
              Seguir la conversación
            </Link>
          </p>
        ) : anuncio.situacion === "vendida" ? (
          <p className="ayuda" style={{ marginTop: "var(--sp-3)" }}>
            Esto ya está vendido, así que no se puede preguntar por ello.
          </p>
        ) : (
          /*
           * La caja de preguntar va aquí, con el texto ya escrito, y no
           * detrás de un botón que lleva a otra pantalla: cada pantalla
           * de por medio es gente que no pregunta. Si no hay sesión, la
           * acción lleva a entrar y se vuelve.
           */
          <form action={preguntar} className="pila" style={{ marginTop: "var(--sp-4)" }}>
            <input type="hidden" name="anuncio" value={anuncio.id} />
            <input type="hidden" name="vuelta" value={direccion} />
            <div className="campo">
              <label htmlFor="pregunta">Pregúntale</label>
              <textarea
                id="pregunta"
                name="texto"
                rows={3}
                maxLength={2000}
                required
                defaultValue="Hola, ¿sigue disponible?"
              />
            </div>
            <div>
              <button className="boton" type="submit">
                Enviar la pregunta
              </button>
            </div>
          </form>
        )}
      </section>

      {anuncio.situacion === "vendida" && (
        <section style={{ marginTop: "var(--sp-8)" }}>
          <h2 style={{ fontSize: "var(--fs-xl)" }}>
            Esto ya se vendió, pero hay más de la misma talla
          </h2>
          <RejillaDeAnuncios
            anuncios={alternativas}
            vacio="Ahora mismo no hay nada más de esta talla. Vuelve en unos días: el catálogo cambia cada semana."
          />
        </section>
      )}
    </div>
  );
}

/**
 * Los datos que leen Google y WhatsApp. Sin esto el anuncio sale en los
 * resultados como una página cualquiera; con esto sale con su precio y su
 * disponibilidad, que es la diferencia entre que lo pinchen o no.
 */
function datosParaBuscadores(anuncio: AnuncioCompleto) {
  const disponibilidad =
    anuncio.situacion === "vendida"
      ? "https://schema.org/SoldOut"
      : anuncio.situacion === "reservada"
        ? "https://schema.org/LimitedAvailability"
        : "https://schema.org/InStock";

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: anuncio.titulo,
    description: resumen(anuncio),
    image: anuncio.fotos.map((foto) => urlDeFoto(foto.ruta)),
    category: etiquetaDe(CATEGORIAS, anuncio.categoria) ?? undefined,
    brand: anuncio.marca ? { "@type": "Brand", name: anuncio.marca } : undefined,
    size: tallaPorCodigo(anuncio.talla)?.etiqueta,
    offers: {
      "@type": "Offer",
      price: (anuncio.precio_centimos / 100).toFixed(2),
      priceCurrency: "EUR",
      availability: disponibilidad,
      itemCondition:
        anuncio.estado === "nuevo-con-etiqueta"
          ? "https://schema.org/NewCondition"
          : "https://schema.org/UsedCondition",
    },
  };
}
