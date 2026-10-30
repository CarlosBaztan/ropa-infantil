import { cache } from "react";
import { RejillaDeAnuncios } from "@/components/RejillaDeAnuncios";
import { buscarCatalogo, type Filtros } from "@/lib/anuncios/catalogo";
import { robotsSegunCuantosHay } from "@/lib/anuncios/direcciones-seo";
import { clientePublico } from "@/lib/supabase/servidor";

/*
 * El cuerpo de cualquier página de catálogo: un título, una entradilla,
 * la rejilla y el botón de ver más. Lo comparten /lotes, las páginas de
 * talla, las de categoría, las de marca y el buscador.
 *
 * La consulta va envuelta en cache() de React porque cada pantalla la
 * necesita dos veces —una para los metadatos, otra para pintar— y sin
 * eso serían dos viajes a la base por visita.
 */

export const traerCatalogo = cache(async (clave: string, filtros: Filtros) => {
  // `clave` no se usa: está para que cada combinación de filtros tenga su
  // propia entrada en la caché, porque cache() compara los argumentos y
  // un objeto nuevo nunca es igual a otro.
  void clave;
  return buscarCatalogo(clientePublico(), filtros);
});

/** La clave de caché de unos filtros: su contenido, ordenado. */
export function claveDe(filtros: Filtros): string {
  return JSON.stringify(
    Object.fromEntries(Object.entries(filtros).sort(([a], [b]) => (a < b ? -1 : 1))),
  );
}

/**
 * Qué se le dice a Google sobre esta página.
 *
 * Dos razones para no ofrecerla: que tenga menos de diez anuncios, o que
 * sea la página dos en adelante. La paginación lleva interrogación, y la
 * regla del diseño es que con interrogación no se indexa; pero sí se
 * siguen los enlaces, para que las fichas se descubran igual.
 */
export function robotsDeCatalogo(total: number, pagina: number) {
  if (pagina > 1) return { index: false as const, follow: true as const };
  return robotsSegunCuantosHay(total);
}

export function paginaDeLaDireccion(valor: string | undefined): number {
  const numero = Number.parseInt(valor ?? "1", 10);
  return Number.isFinite(numero) && numero > 1 ? numero : 1;
}

export async function PantallaDeCatalogo({
  titulo,
  entradilla,
  filtros,
  pagina,
  direccionBase,
  vacio,
  children,
}: {
  titulo: string;
  entradilla?: string;
  filtros: Filtros;
  pagina: number;
  direccionBase: string;
  vacio?: string;
  children?: React.ReactNode;
}) {
  const resultado = await traerCatalogo(claveDe({ ...filtros, pagina }), {
    ...filtros,
    pagina,
  });

  const union = direccionBase.includes("?") ? "&" : "?";
  const siguiente = `${direccionBase}${union}pagina=${pagina + 1}`;

  return (
    <div className="pagina pagina-ancha">
      <h1 style={{ fontSize: "var(--fs-2xl)", lineHeight: "var(--lh-tight)" }}>
        {titulo}
      </h1>
      {entradilla && (
        <p style={{ marginTop: "var(--sp-3)", color: "var(--c-ink-muted)" }}>
          {entradilla}
        </p>
      )}

      {children}

      <p className="ayuda" style={{ marginTop: "var(--sp-5)" }}>
        {resultado.total === 0
          ? "Ningún anuncio"
          : resultado.total === 1
            ? "Un anuncio"
            : `${resultado.total} anuncios`}
        {pagina > 1 ? ` · página ${pagina}` : ""}
      </p>

      <RejillaDeAnuncios
        anuncios={resultado.anuncios}
        hayMas={resultado.hayMas}
        direccionDeLaSiguiente={siguiente}
        vacio={vacio ?? "Todavía no hay nada aquí. Vuelve en unos días."}
      />
    </div>
  );
}
