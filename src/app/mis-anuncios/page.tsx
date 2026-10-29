import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  buscarMisAnuncios,
  type AnuncioPropio,
} from "@/lib/anuncios/consulta";
import { urlDeFoto } from "@/lib/anuncios/fotos";
import { direccionDeAnuncio } from "@/lib/anuncios/direccion";
import { formatearPrecio, precioPorPieza } from "@/lib/anuncios/precio";
import { clienteServidor } from "@/lib/supabase/servidor";
import { tallaPorCodigo } from "@/lib/tallas";
import { borrarAnuncio, cambiarSituacion } from "./acciones";

export const metadata: Metadata = {
  title: "Tus anuncios",
  robots: { index: false },
};

/*
 * Mis anuncios.
 *
 * Dos cosas pasan aquí y las dos importan. Una es marcar vendido, que
 * deja la fecha con la que se medirá si este proyecto tiene sentido. La
 * otra es recuperar un anuncio retirado: cuando la subida de fotos falla
 * a mitad, el anuncio se queda guardado pero invisible, y esta es la
 * pantalla donde se encuentra en vez de darlo por perdido.
 */

const MENSAJES: Record<string, string> = {
  activa: "Ya está en venta otra vez.",
  reservada: "Marcado como reservado.",
  vendida: "¡Vendido! Gracias por contarlo: es lo que nos dice si esto funciona.",
  retirada: "Retirado. Solo lo ves tú.",
  borrada: "Anuncio borrado.",
};

export default async function MisAnuncios({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; hecho?: string }>;
}) {
  const { error, hecho } = await searchParams;

  const supabase = await clienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/acceso");

  const anuncios = await buscarMisAnuncios(supabase, user.id);

  const enVenta = anuncios.filter(
    (a) => a.situacion === "activa" || a.situacion === "reservada",
  );
  const vendidos = anuncios.filter((a) => a.situacion === "vendida");
  const retirados = anuncios.filter((a) => a.situacion === "retirada");

  return (
    <div className="pagina">
      <h1 style={{ fontSize: "var(--fs-2xl)", lineHeight: "var(--lh-tight)" }}>
        Tus anuncios
      </h1>

      {error && (
        <p role="alert" className="aviso-error" style={{ marginTop: "var(--sp-5)" }}>
          <span>{error}</span>
        </p>
      )}

      {hecho && MENSAJES[hecho] && (
        <p
          role="status"
          className="tarjeta"
          style={{ marginTop: "var(--sp-5)" }}
        >
          {MENSAJES[hecho]}
        </p>
      )}

      {anuncios.length === 0 ? (
        <div className="tarjeta" style={{ marginTop: "var(--sp-6)" }}>
          <p>Todavía no has publicado nada.</p>
          <p style={{ marginTop: "var(--sp-4)" }}>
            <Link className="boton" href="/publicar">
              Publicar lo primero
            </Link>
          </p>
        </div>
      ) : (
        <p style={{ marginTop: "var(--sp-5)" }}>
          <Link className="boton" href="/publicar">
            Publicar otro
          </Link>
        </p>
      )}

      <Grupo
        titulo="En venta"
        anuncios={enVenta}
        vacio="Nada en venta ahora mismo."
      />
      <Grupo
        titulo="Vendidos"
        anuncios={vendidos}
        vacio={null}
      />
      <Grupo
        titulo="Retirados"
        anuncios={retirados}
        vacio={null}
      />
    </div>
  );
}

function Grupo({
  titulo,
  anuncios,
  vacio,
}: {
  titulo: string;
  anuncios: AnuncioPropio[];
  vacio: string | null;
}) {
  if (anuncios.length === 0 && vacio === null) return null;

  return (
    <section style={{ marginTop: "var(--sp-8)" }}>
      <h2 style={{ fontSize: "var(--fs-xl)" }}>
        {titulo}
        {anuncios.length > 0 ? ` (${anuncios.length})` : ""}
      </h2>
      {anuncios.length === 0 ? (
        <p className="ayuda" style={{ marginTop: "var(--sp-3)" }}>
          {vacio}
        </p>
      ) : (
        <ul
          className="pila"
          style={{ marginTop: "var(--sp-4)", listStyle: "none" }}
        >
          {anuncios.map((anuncio) => (
            <li key={anuncio.id}>
              <FilaDeAnuncio anuncio={anuncio} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function FilaDeAnuncio({
  anuncio,
}: {
  anuncio: AnuncioPropio;
}) {
  const primera = anuncio.fotos[0];
  const piezas = anuncio.numero_piezas ?? 0;
  const porPieza =
    anuncio.tipo === "lote" && piezas > 1
      ? precioPorPieza(anuncio.precio_centimos, piezas)
      : null;
  const talla = tallaPorCodigo(anuncio.talla)?.etiqueta ?? anuncio.talla;
  const sinFotos = anuncio.fotos.length === 0;

  return (
    <div className="tarjeta fila-anuncio">
      <Link
        href={direccionDeAnuncio(anuncio.slug, anuncio.id_publico)}
        className="tarjeta-anuncio"
        style={{ display: "flex", gap: "var(--sp-4)", alignItems: "flex-start" }}
      >
        {primera ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={urlDeFoto(primera.ruta)}
            alt=""
            width={96}
            height={96}
            loading="lazy"
            style={{
              width: "5rem",
              height: "5rem",
              objectFit: "cover",
              borderRadius: "var(--r-md)",
              flex: "0 0 auto",
            }}
          />
        ) : (
          <div
            aria-hidden="true"
            style={{
              width: "5rem",
              height: "5rem",
              borderRadius: "var(--r-md)",
              background: "var(--c-surface-2)",
              flex: "0 0 auto",
            }}
          />
        )}
        <div>
          <p className="titulo-tarjeta" style={{ fontWeight: 600 }}>
            {anuncio.titulo}
          </p>
          <p className="ayuda">{talla}</p>
          <p className="precio" style={{ fontWeight: 600 }}>
            {formatearPrecio(anuncio.precio_centimos)}
            {porPieza !== null
              ? ` · ${formatearPrecio(porPieza)} la pieza`
              : ""}
          </p>
        </div>
      </Link>

      {sinFotos && (
        <p role="alert" className="aviso-error" style={{ marginTop: "var(--sp-3)" }}>
          <span>
            Este anuncio se quedó sin fotos: la subida falló a mitad. Bórralo
            y vuelve a publicarlo; es más rápido que arreglarlo.
          </span>
        </p>
      )}

      <div className="acciones-anuncio">
        {anuncio.situacion === "activa" && (
          <Boton anuncio={anuncio.id} situacion="reservada" texto="Reservar" />
        )}
        {anuncio.situacion === "reservada" && (
          <Boton
            anuncio={anuncio.id}
            situacion="activa"
            texto="Quitar la reserva"
          />
        )}

        {(anuncio.situacion === "activa" || anuncio.situacion === "reservada") && (
          // Marcar vendido pide confirmación porque es la acción que más
          // escuece deshacer y la que más dato escribe.
          <details>
            <summary className="boton boton-secundario">Vender</summary>
            <p className="ayuda" style={{ marginTop: "var(--sp-2)" }}>
              ¿Lo has vendido de verdad? La página seguirá visible, marcada
              como vendido.
            </p>
            <Boton
              anuncio={anuncio.id}
              situacion="vendida"
              texto="Sí, lo he vendido"
              principal
            />
          </details>
        )}

        {anuncio.situacion === "vendida" && (
          <Boton
            anuncio={anuncio.id}
            situacion="activa"
            texto="No estaba vendido"
          />
        )}

        {anuncio.situacion === "retirada" ? (
          <>
            <Boton
              anuncio={anuncio.id}
              situacion="activa"
              texto="Volver a publicar"
              principal
            />
            <details>
              <summary className="boton boton-secundario">Borrar</summary>
              <p className="ayuda" style={{ marginTop: "var(--sp-2)" }}>
                Se borra el anuncio y sus fotos. No se puede deshacer.
              </p>
              <form action={borrarAnuncio}>
                <input type="hidden" name="anuncio" value={anuncio.id} />
                <button className="boton" type="submit">
                  Borrarlo para siempre
                </button>
              </form>
            </details>
          </>
        ) : (
          <Boton anuncio={anuncio.id} situacion="retirada" texto="Retirar" />
        )}
      </div>
    </div>
  );
}

function Boton({
  anuncio,
  situacion,
  texto,
  principal = false,
}: {
  anuncio: string;
  situacion: string;
  texto: string;
  principal?: boolean;
}) {
  return (
    <form action={cambiarSituacion}>
      <input type="hidden" name="anuncio" value={anuncio} />
      <input type="hidden" name="situacion" value={situacion} />
      <button
        className={principal ? "boton" : "boton boton-secundario"}
        type="submit"
      >
        {texto}
      </button>
    </form>
  );
}
