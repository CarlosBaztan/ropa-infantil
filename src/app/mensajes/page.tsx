import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { portadaDe } from "@/lib/anuncios/fotos";
import { formatearPrecio } from "@/lib/anuncios/precio";
import { buscarBandeja } from "@/lib/mensajes/consulta";
import { clienteServidor } from "@/lib/supabase/servidor";

/*
 * La bandeja.
 *
 * Cada fila recuerda de qué anuncio se está hablando, porque es lo
 * primero que se olvida cuando se tienen cuatro conversaciones abiertas
 * sobre cuatro lotes parecidos.
 */

export const metadata: Metadata = {
  title: "Tus mensajes",
  robots: { index: false },
};

function cuandoFue(fecha: string): string {
  const cuando = new Date(fecha);
  const horas = (Date.now() - cuando.getTime()) / 36e5;
  if (horas < 1) return "hace un momento";
  if (horas < 24) return `hace ${Math.floor(horas)} h`;
  return cuando.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    timeZone: "Europe/Madrid",
  });
}

export default async function Mensajes() {
  const supabase = await clienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/acceso");

  const { conversaciones, todaviaNoHayMensajeria } = await buscarBandeja(
    supabase,
    user.id,
  );

  return (
    <div className="pagina">
      <h1 style={{ fontSize: "var(--fs-2xl)", lineHeight: "var(--lh-tight)" }}>
        Tus mensajes
      </h1>

      {todaviaNoHayMensajeria ? (
        <p className="tarjeta" style={{ marginTop: "var(--sp-5)" }}>
          Los mensajes están a punto de entrar en funcionamiento. Vuelve en
          unos días.
        </p>
      ) : conversaciones.length === 0 ? (
        <div className="tarjeta" style={{ marginTop: "var(--sp-5)" }}>
          <p>Todavía no has hablado con nadie.</p>
          <p className="ayuda" style={{ marginTop: "var(--sp-2)" }}>
            Las conversaciones empiezan desde el anuncio: cuando algo te
            interese, pregunta desde su ficha.
          </p>
          <p style={{ marginTop: "var(--sp-4)" }}>
            <Link className="boton" href="/">
              Ver el catálogo
            </Link>
          </p>
        </div>
      ) : (
        <ul
          className="pila"
          role="list"
          style={{ marginTop: "var(--sp-5)", listStyle: "none" }}
        >
          {conversaciones.map((conversacion) => {
            const anuncio = conversacion.elAnuncio;
            const portada = portadaDe(anuncio?.fotos);
            return (
              <li key={conversacion.id}>
                <Link
                  className="tarjeta fila-conversacion"
                  href={`/mensajes/${conversacion.id}`}
                >
                  {portada ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={portada}
                      alt=""
                      width={64}
                      height={64}
                      loading="lazy"
                    />
                  ) : (
                    <div aria-hidden="true" className="foto-de-hilo" />
                  )}

                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontWeight: 600 }}>
                      {conversacion.laOtraParte?.alias ?? "Una familia"}
                      {conversacion.sinLeer > 0 && (
                        <span className="distintivo distintivo-lote">
                          {conversacion.sinLeer} sin leer
                        </span>
                      )}
                    </p>
                    <p className="ayuda">
                      {anuncio?.titulo ?? "Un anuncio que ya no está"}
                    </p>
                    <p className="ayuda">
                      {anuncio ? formatearPrecio(anuncio.precio_centimos) : ""}
                      {anuncio?.situacion === "vendida" ? " · vendido" : ""}
                      {" · "}
                      {cuandoFue(conversacion.ultimo_mensaje_el)}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

    </div>
  );
}
