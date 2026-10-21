/*
 * Portada provisional. El catálogo de verdad llega en el plan 3; esta
 * pantalla solo existe para que el proyecto tenga una raíz navegable
 * mientras se construyen las cuentas.
 *
 * La región <main> y el salto al contenido los pone la disposición raíz.
 */
export default function Portada() {
  return (
    <div style={{ padding: "var(--sp-6)", maxWidth: "40rem" }}>
      <h1 style={{ fontSize: "var(--fs-2xl)", lineHeight: "var(--lh-tight)" }}>
        Ropa de bebé y niño, entre familias
      </h1>
      <p style={{ marginTop: "var(--sp-4)", color: "var(--c-ink-muted)" }}>
        Lotes por talla y temporada, con entrega en mano y sin gastos de envío.
      </p>
      <p style={{ marginTop: "var(--sp-6)" }}>
        <a href="/registro">Crear una cuenta</a>
      </p>
    </div>
  );
}
