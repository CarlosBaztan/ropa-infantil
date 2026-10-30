export default function Cargando() {
  return (
    <div className="pagina">
      <h1 style={{ fontSize: "var(--fs-2xl)", lineHeight: "var(--lh-tight)" }}>
        Tus mensajes
      </h1>
      <p className="ayuda" role="status" style={{ marginTop: "var(--sp-5)" }}>
        Cargando…
      </p>
    </div>
  );
}
