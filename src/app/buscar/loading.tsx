import { EsqueletoDeRejilla } from "@/components/EsqueletoDeRejilla";

/*
 * El buscador siempre consulta la base, así que siempre hay una espera.
 * Aquí sí se pone el hueco y en las páginas de aterrizaje no: esas van
 * guardadas hechas y, sobre todo, son las que tiene que leer Google, y
 * prefiero que el buscador reciba el HTML terminado de una vez.
 */
export default function Cargando() {
  return (
    <div className="pagina pagina-ancha">
      <h1 style={{ fontSize: "var(--fs-2xl)", lineHeight: "var(--lh-tight)" }}>
        Buscar
      </h1>
      <EsqueletoDeRejilla />
    </div>
  );
}
