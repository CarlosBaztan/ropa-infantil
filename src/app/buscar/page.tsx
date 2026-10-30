import type { Metadata } from "next";
import { PantallaDeCatalogo } from "@/components/PantallaDeCatalogo";
import type { Filtros } from "@/lib/anuncios/catalogo";
import { CATEGORIAS } from "@/lib/anuncios/modelo";
import { aCentimos } from "@/lib/anuncios/precio";
import { esCategoria } from "@/lib/anuncios/modelo";
import { PROVINCIAS, esCodigoDeProvincia } from "@/lib/provincias";
import { TALLAS, tallaPorCodigo } from "@/lib/tallas";

/*
 * /buscar — todo lo que no es una ruta limpia.
 *
 * NUNCA se ofrece a los buscadores, y eso no es una limitación sino el
 * diseño: cada combinación de filtros es una dirección distinta, así que
 * indexarla significaría ofrecerle a Google un número infinito de
 * páginas casi iguales. Las que sí interesan son las limpias —/lotes,
 * /ropa/talla/3-6-meses—, que están enlazadas desde aquí y desde la
 * portada.
 *
 * Los filtros son un formulario de los de toda la vida: funciona sin una
 * línea de JavaScript, el botón de atrás hace lo que debe y la búsqueda
 * se puede compartir pegando la dirección.
 */

export const metadata: Metadata = {
  title: "Buscar ropa infantil de segunda mano",
  robots: { index: false, follow: true },
};

type Busqueda = Promise<Record<string, string | string[] | undefined>>;

function uno(valor: string | string[] | undefined): string {
  if (Array.isArray(valor)) return valor[0] ?? "";
  return valor ?? "";
}

function varios(valor: string | string[] | undefined): string[] {
  if (Array.isArray(valor)) return valor;
  return valor ? [valor] : [];
}

function filtrosDeLaDireccion(
  parametros: Record<string, string | string[] | undefined>,
): Filtros {
  const filtros: Filtros = {};

  // Cada valor se comprueba contra su lista cerrada. Lo que no encaje se
  // tira: un filtro inventado no puede acabar en la consulta.
  const tallas = varios(parametros.talla).filter((t) => tallaPorCodigo(t));
  if (tallas.length > 0) filtros.tallas = tallas;

  const tipo = uno(parametros.tipo);
  if (tipo === "lote" || tipo === "prenda") filtros.tipo = tipo;

  const categoria = uno(parametros.categoria);
  if (esCategoria(categoria)) filtros.categoria = categoria;

  const provincia = uno(parametros.provincia);
  if (esCodigoDeProvincia(provincia)) filtros.provincia = provincia;

  const precio = uno(parametros.precio);
  const centimos = precio ? aCentimos(precio) : null;
  if (centimos !== null) filtros.precioMaximoCentimos = centimos;

  const texto = uno(parametros.texto).trim();
  if (texto) filtros.texto = texto;

  return filtros;
}

/** La misma dirección, para que «Ver más» no pierda los filtros. */
function direccionConLosFiltros(
  parametros: Record<string, string | string[] | undefined>,
): string {
  const partes = new URLSearchParams();
  for (const [clave, valor] of Object.entries(parametros)) {
    if (clave === "pagina") continue;
    for (const uno of varios(valor)) if (uno) partes.append(clave, uno);
  }
  const texto = partes.toString();
  return texto ? `/buscar?${texto}` : "/buscar";
}

export default async function Buscar({
  searchParams,
}: {
  searchParams: Busqueda;
}) {
  const parametros = await searchParams;
  const filtros = filtrosDeLaDireccion(parametros);
  const pagina = Math.max(1, Number.parseInt(uno(parametros.pagina) || "1", 10));

  const hayFiltros = Object.keys(filtros).length > 0;

  return (
    <PantallaDeCatalogo
      titulo="Buscar"
      filtros={filtros}
      pagina={Number.isFinite(pagina) ? pagina : 1}
      direccionBase={direccionConLosFiltros(parametros)}
      vacio={
        hayFiltros
          ? "No hay nada que encaje con eso. Prueba a quitar algún filtro."
          : "Elige una talla o escribe qué buscas."
      }
    >
      <form method="get" action="/buscar" className="pila filtros">
        <div className="campo">
          <label htmlFor="texto">Qué buscas</label>
          <input
            id="texto"
            name="texto"
            type="search"
            defaultValue={uno(parametros.texto)}
            placeholder="pijama, abrigo, Zara…"
          />
        </div>

        <fieldset className="campo" style={{ border: "none" }}>
          <legend>Talla</legend>
          <p className="ayuda">
            Puedes marcar varias: un bebé siempre está a caballo entre dos.
          </p>
          <div className="casillas-en-linea">
            {TALLAS.map((talla) => (
              <label key={talla.codigo} className="casilla-compacta">
                <input
                  type="checkbox"
                  name="talla"
                  value={talla.codigo}
                  defaultChecked={varios(parametros.talla).includes(
                    talla.codigo,
                  )}
                />
                <span>{talla.etiqueta}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="campo">
          <label htmlFor="categoria">Qué es</label>
          <select
            id="categoria"
            name="categoria"
            defaultValue={uno(parametros.categoria)}
          >
            <option value="">Cualquier cosa</option>
            {CATEGORIAS.map((categoria) => (
              <option key={categoria.codigo} value={categoria.codigo}>
                {categoria.etiqueta}
              </option>
            ))}
          </select>
        </div>

        <div className="campo">
          <label htmlFor="tipo">Prenda o lote</label>
          <select id="tipo" name="tipo" defaultValue={uno(parametros.tipo)}>
            <option value="">Las dos cosas</option>
            <option value="lote">Solo lotes</option>
            <option value="prenda">Solo prendas sueltas</option>
          </select>
        </div>

        <div className="campo">
          <label htmlFor="provincia">Cerca de</label>
          <select
            id="provincia"
            name="provincia"
            defaultValue={uno(parametros.provincia)}
          >
            <option value="">Toda España</option>
            {PROVINCIAS.map((provincia) => (
              <option key={provincia.codigo} value={provincia.codigo}>
                {provincia.nombre}
              </option>
            ))}
          </select>
          <span className="ayuda">
            Pone delante lo de esa provincia. No esconde el resto.
          </span>
        </div>

        <div className="campo">
          <label htmlFor="precio">Precio máximo</label>
          <input
            id="precio"
            name="precio"
            inputMode="decimal"
            defaultValue={uno(parametros.precio)}
            placeholder="25"
          />
        </div>

        <div style={{ display: "flex", gap: "var(--sp-3)" }}>
          <button className="boton" type="submit">
            Buscar
          </button>
          <a className="boton boton-secundario" href="/buscar">
            Limpiar
          </a>
        </div>
      </form>
    </PantallaDeCatalogo>
  );
}
