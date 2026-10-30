import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { direccionDeAnuncio } from "@/lib/anuncios/direccion";
import { portadaDe } from "@/lib/anuncios/fotos";
import { formatearPrecio } from "@/lib/anuncios/precio";
import { buscarConversacion } from "@/lib/mensajes/consulta";
import { clienteServidor } from "@/lib/supabase/servidor";
import { darPorLeido, responder } from "../acciones";

/*
 * Una conversación.
 *
 * La cabecera recuerda SIEMPRE de qué anuncio se habla, con su foto y su
 * precio, y enlaza a la ficha. Es la diferencia entre esto y un chat: a
 * los tres días nadie se acuerda de cuál de los cuatro lotes de bodies
 * era este.
 *
 * Quien vende tiene aquí el botón de marcar vendido, porque es aquí
 * donde se entera de que lo ha vendido.
 */

export const metadata: Metadata = {
  title: "Conversación",
  robots: { index: false },
};

/** Lo que se contesta de un toque, que es casi todo lo que se contesta. */
const RESPUESTAS_RAPIDAS = [
  "¿Sigue disponible?",
  "¿Te viene bien quedar esta semana?",
  "Sí, sigue disponible",
  "Gracias, me lo pienso",
];

function laHora(fecha: string): string {
  return new Date(fecha).toLocaleString("es-ES", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Madrid",
  });
}

export default async function Conversacion({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;

  const supabase = await clienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/acceso");

  const abierta = await buscarConversacion(supabase, id, user.id);
  // Una conversación ajena y una que no existe se contestan igual: las
  // reglas de la base ya no la dejan ver, y decir «existe pero no es
  // tuya» sería contar algo que no hace falta contar.
  if (!abierta) notFound();

  const { conversacion, mensajes } = abierta;
  const anuncio = conversacion.elAnuncio;
  const portada = portadaDe(anuncio?.fotos);
  const vendiendo = conversacion.vendedor === user.id;

  await darPorLeido(id);

  return (
    <div className="pagina">
      <p style={{ marginBottom: "var(--sp-4)" }}>
        <Link href="/mensajes">← Todos tus mensajes</Link>
      </p>

      {/* La cabecera del anuncio, que es de lo que se habla. */}
      <div className="tarjeta fila-conversacion">
        {portada ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={portada} alt="" width={64} height={64} />
        ) : (
          <div aria-hidden="true" className="foto-de-hilo" />
        )}
        <div style={{ minWidth: 0 }}>
          <h1 style={{ fontSize: "var(--fs-lg)" }}>
            {anuncio ? (
              <Link href={direccionDeAnuncio(anuncio.slug, anuncio.id_publico)}>
                {anuncio.titulo}
              </Link>
            ) : (
              "Un anuncio que ya no está"
            )}
          </h1>
          <p className="ayuda precio">
            {anuncio ? formatearPrecio(anuncio.precio_centimos) : ""}
            {anuncio?.situacion === "vendida" ? " · vendido" : ""}
            {anuncio?.situacion === "reservada" ? " · reservado" : ""}
          </p>
          <p className="ayuda">
            {vendiendo ? "Te pregunta " : "Hablas con "}
            {conversacion.laOtraParte?.alias ? (
              <Link href={`/armario/${conversacion.laOtraParte.alias}`}>
                {conversacion.laOtraParte.alias}
              </Link>
            ) : (
              "una familia"
            )}
          </p>
        </div>
      </div>

      {/*
        * El aviso de seguridad va aquí y no escondido en las condiciones.
        * Es el momento en que hace falta: justo cuando dos desconocidas
        * van a quedar.
        */}
      <details className="tarjeta" style={{ marginTop: "var(--sp-4)" }}>
        <summary>Antes de quedar, dos cosas</summary>
        <ul style={{ marginTop: "var(--sp-3)", paddingLeft: "var(--sp-5)" }}>
          <li>
            Quedad en un sitio público y con gente: la puerta de un centro
            comercial, una plaza, la salida del metro. Nunca en un portal.
          </li>
          <li>
            Si hay envío, acordad antes quién lo paga y cómo. La plataforma
            todavía no gestiona ni envíos ni pagos: lo que acordéis es
            entre vosotras.
          </li>
        </ul>
      </details>

      {error && (
        <p role="alert" className="aviso-error" style={{ marginTop: "var(--sp-4)" }}>
          <span>{error}</span>
        </p>
      )}

      <ol className="hilo" role="list">
        {mensajes.map((mensaje) => {
          const mio = mensaje.autor === user.id;
          return (
            <li key={mensaje.id} className={mio ? "mensaje mio" : "mensaje"}>
              <p>{mensaje.texto}</p>
              <p className="ayuda">
                {mio ? "Tú" : (conversacion.laOtraParte?.alias ?? "Ella")} ·{" "}
                {laHora(mensaje.enviado_el)}
              </p>
            </li>
          );
        })}
      </ol>

      <form action={responder} className="pila" style={{ marginTop: "var(--sp-6)" }}>
        <input type="hidden" name="conversacion" value={id} />
        <div className="campo">
          <label htmlFor="texto">Escribe</label>
          <textarea
            id="texto"
            name="texto"
            rows={3}
            maxLength={2000}
            required
          />
        </div>
        <div>
          <button className="boton" type="submit">
            Enviar
          </button>
        </div>
      </form>

      {/*
        * Las respuestas de un toque. Son formularios aparte, cada uno con
        * su texto ya puesto: con el bebé en el otro brazo, escribir «¿sigue
        * disponible?» en un teclado de móvil es justo lo que hace que la
        * conversación no empiece.
        */}
      <section style={{ marginTop: "var(--sp-5)" }}>
        <h2 className="ayuda">O contesta de un toque</h2>
        <div className="atajos">
          {RESPUESTAS_RAPIDAS.map((respuesta) => (
            <form key={respuesta} action={responder}>
              <input type="hidden" name="conversacion" value={id} />
              <input type="hidden" name="texto" value={respuesta} />
              <button className="atajo" type="submit">
                {respuesta}
              </button>
            </form>
          ))}
        </div>
      </section>

      {vendiendo && anuncio && anuncio.situacion !== "vendida" && (
        <p className="ayuda" style={{ marginTop: "var(--sp-8)" }}>
          ¿Se lo has vendido? Márcalo en{" "}
          <Link href="/mis-anuncios">tus anuncios</Link>: esa fecha es con
          la que sabremos si esto funciona.
        </p>
      )}
    </div>
  );
}
