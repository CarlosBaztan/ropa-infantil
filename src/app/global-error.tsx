"use client";

/*
 * El último cortafuegos: si lo que se rompe es la disposición raíz, el
 * error.tsx normal no llega a pintarse porque vive dentro de ella. Esta
 * pantalla sustituye al documento entero, así que tiene que traer su
 * propio <html> y sus propios estilos: la hoja de estilos tampoco se ha
 * cargado necesariamente.
 *
 * No debería verse nunca. Existe para que el día que se vea, se vea en
 * español y con una salida.
 */
export default function ErrorGlobal({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="es">
      <body
        style={{
          margin: 0,
          padding: "2rem 1rem",
          fontFamily:
            'Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
          lineHeight: 1.5,
          color: "#1c2420",
          background: "#fffcf8",
        }}
      >
        <main style={{ maxWidth: "32rem", margin: "0 auto" }}>
          <h1 style={{ fontSize: "1.75rem", lineHeight: 1.2 }}>
            Algo se ha torcido
          </h1>
          <p style={{ marginTop: "1rem" }}>
            No hemos podido cargar la página. Vuelve a intentarlo; casi
            siempre es la conexión.
          </p>
          <p style={{ marginTop: "1.5rem" }}>
            <button
              type="button"
              onClick={reset}
              style={{
                minHeight: "48px",
                padding: "0 1.25rem",
                border: "none",
                borderRadius: "0.75rem",
                background: "#0f6b5c",
                color: "#ffffff",
                font: "inherit",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Volver a intentarlo
            </button>
          </p>
          {error.digest && (
            <p style={{ marginTop: "1.5rem", color: "#5a6460", fontSize: "0.875rem" }}>
              Código: {error.digest}
            </p>
          )}
        </main>
      </body>
    </html>
  );
}
