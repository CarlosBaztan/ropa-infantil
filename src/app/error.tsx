"use client";

import Link from "next/link";
import { useEffect } from "react";

/*
 * Cuando algo se rompe de verdad.
 *
 * Sin esta pantalla, Next enseña la suya: un texto en inglés sobre un
 * fondo blanco, sin ninguna salida. Una madre que entra desde Google y
 * se encuentra «Application error: a client-side exception has occurred»
 * no vuelve.
 *
 * Lo más probable con diferencia es que haya fallado la red —el móvil en
 * el portal del garaje—, así que lo primero que ofrece es volver a
 * intentarlo, que es lo que lo arregla.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Al registro del servidor, que es donde se puede mirar después. El
    // digest es lo único que permite atar esto con la traza completa.
    console.error("[error]", error.digest ?? "", error.message);
  }, [error]);

  return (
    <div className="pagina">
      <h1 style={{ fontSize: "var(--fs-2xl)", lineHeight: "var(--lh-tight)" }}>
        Algo se ha torcido
      </h1>
      <p style={{ marginTop: "var(--sp-4)" }}>
        No hemos podido cargar esta página. Casi siempre es la conexión:
        vuelve a intentarlo y suele salir a la primera.
      </p>

      <p style={{ marginTop: "var(--sp-6)", display: "flex", gap: "var(--sp-3)" }}>
        <button className="boton" type="button" onClick={reset}>
          Volver a intentarlo
        </button>
        <Link className="boton boton-secundario" href="/">
          Ir al inicio
        </Link>
      </p>

      {error.digest && (
        <p className="ayuda" style={{ marginTop: "var(--sp-6)" }}>
          Si vuelve a pasar y nos escribes, dinos este código: {error.digest}
        </p>
      )}
    </div>
  );
}
