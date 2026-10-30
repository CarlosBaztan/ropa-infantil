import Link from "next/link";
import { RejillaDeAnuncios } from "@/components/RejillaDeAnuncios";
import { buscarCatalogo } from "@/lib/anuncios/catalogo";
import { direccionDeTalla } from "@/lib/anuncios/direcciones-seo";
import { clientePublico } from "@/lib/supabase/servidor";
import { TALLAS } from "@/lib/tallas";

/*
 * La portada.
 *
 * Tres cosas y en este orden: por dónde entrar —la talla, que es como
 * busca una madre—, los lotes, que son el argumento del nicho y lo que
 * ningún generalista enseña aparte, y lo último que ha entrado, que es
 * lo que hace que una web parezca viva.
 *
 * Se rehace cada cinco minutos en vez de calcularse en cada visita: es
 * la misma para todo el mundo y va a ser la página más visitada.
 */
export const revalidate = 300;

/** Las de bebé y las dos primeras de niño: las que más se buscan. */
const ATAJOS = [
  "0-3-meses",
  "3-6-meses",
  "6-9-meses",
  "9-12-meses",
  "12-18-meses",
  "18-24-meses",
  "2-anos",
  "4-anos",
];

export default async function Portada() {
  const supabase = clientePublico();

  const [lotes, ultimos] = await Promise.all([
    buscarCatalogo(supabase, { tipo: "lote" }),
    buscarCatalogo(supabase, {}),
  ]);

  const atajos = ATAJOS.map((codigo) =>
    TALLAS.find((t) => t.codigo === codigo),
  ).filter((t) => t !== undefined);

  return (
    <div className="pagina pagina-ancha">
      <h1 style={{ fontSize: "var(--fs-2xl)", lineHeight: "var(--lh-tight)" }}>
        Ropa de bebé y niño, entre familias
      </h1>
      <p style={{ marginTop: "var(--sp-3)", color: "var(--c-ink-muted)" }}>
        Lotes por talla y temporada, con entrega en mano y sin gastos de
        envío.
      </p>

      <section style={{ marginTop: "var(--sp-8)" }}>
        <h2 style={{ fontSize: "var(--fs-xl)" }}>¿Qué talla usa?</h2>
        <nav aria-label="Tallas" className="atajos">
          {atajos.map((talla) => (
            <Link
              key={talla.codigo}
              className="atajo"
              href={direccionDeTalla(talla.codigo)}
            >
              {talla.etiqueta}
            </Link>
          ))}
        </nav>
      </section>

      <section style={{ marginTop: "var(--sp-10)" }}>
        <div className="cabecera-de-franja">
          <h2 style={{ fontSize: "var(--fs-xl)" }}>Lotes</h2>
          <Link href="/lotes">Ver todos</Link>
        </div>
        <p className="ayuda">
          Varias prendas de una vez, de la misma talla o de tallas
          seguidas. Sale mucho más barato por pieza y es un solo
          encuentro.
        </p>
        <RejillaDeAnuncios
          anuncios={lotes.anuncios.slice(0, 6)}
          vacio="Todavía no hay lotes publicados. Si tienes ropa que se le ha quedado pequeña, el primero puede ser el tuyo."
        />
      </section>

      <section style={{ marginTop: "var(--sp-10)" }}>
        <div className="cabecera-de-franja">
          <h2 style={{ fontSize: "var(--fs-xl)" }}>Lo último</h2>
          {ultimos.hayMas && <Link href="/buscar">Ver todo</Link>}
        </div>
        <RejillaDeAnuncios
          anuncios={ultimos.anuncios.slice(0, 12)}
          vacio="El catálogo está recién empezado. Vuelve en unos días, o publica tú lo primero."
        />
      </section>

      <section style={{ marginTop: "var(--sp-10)" }}>
        <div className="tarjeta">
          <h2 style={{ fontSize: "var(--fs-lg)" }}>
            ¿Tienes ropa que se le ha quedado pequeña?
          </h2>
          <p style={{ marginTop: "var(--sp-2)" }}>
            Publicar un lote lleva menos de un minuto desde el móvil.
          </p>
          <p style={{ marginTop: "var(--sp-4)" }}>
            <Link className="boton" href="/publicar">
              Publicar
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
