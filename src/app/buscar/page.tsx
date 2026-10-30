import type { Metadata } from "next";
import { PantallaDeCatalogo } from "@/components/PantallaDeCatalogo";
import type { Filtros } from "@/lib/anuncios/catalogo";
import { CATEGORIAS, esCategoria, etiquetaDe } from "@/lib/anuncios/modelo";
import { aCentimos } from "@/lib/anuncios/precio";
import {
  PROVINCIAS,
  esCodigoDeProvincia,
  provinciaPorCodigo,
} from "@/lib/provincias";
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

/*
 * El titulo dice QUE se ha buscado. Con el titulo fijo, cinco busquedas
 * abiertas en cinco pestanas son cinco pestanas identicas, y al volver
 * con el boton de atras no hay forma de saber en cual estas sin leer los
 * filtros uno a uno.
 */
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Busqueda;
}): Promise<Metadata> {
  const parametros = await searchParams;
  const filtros = filtrosDeLaDireccion(parametros);

  const trozos = [
    filtros.texto,
    filtros.tipo === "lote" ? "lotes" : null,
    filtros.tallas?.length
      ? `talla ${filtros.tallas
          .map((t) => tallaPorCodigo(t)?.etiqueta ?? t)
          .join(" o ")}`
      : null,
    filtros.categoria ? etiquetaDe(CATEGORIAS, filtros.categoria) : null,
    filtros.provincia ? provinciaPorCodigo(filtros.provincia)?.nombre : null,
  ].filter(Boolean);

  return {
    title: trozos.length
      ? `Buscar: ${trozos.join(", ")}`
      : "Buscar ropa infantil de segunda mano",
    robots: { index: false, follow: true },
  };
}

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
  // Los de la hoja plegada: el texto no cuenta, que está siempre a la
  // vista. Si alguno viene puesto, la hoja se abre sola, para que nadie
  // se encuentre resultados filtrados sin saber por qué.
  const cuantosFiltros = Object.keys(filtros).filter(
    (clave) => clave !== "texto",
  ).length;
  const afinado = cuantosFiltros > 0;

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
      {/*
       * Los filtros van en dos niveles, como pide el diseño: arriba lo
       * que se usa siempre, y el resto plegado. La primera versión los
       * puso todos a la vista y las diecinueve casillas de talla se
       * comían la pantalla entera del móvil: había que pasar por encima
       * de todas antes de llegar a un solo resultado.
       */}
      <form
        method="get"
        action="/buscar"
        role="search"
        className="pila filtros"
      >
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

        <details className="mas-filtros" open={afinado}>
          <summary>
            Afinar la búsqueda
            {cuantosFiltros > 0 ? ` (${cuantosFiltros})` : ""}
          </summary>

          <div className="pila" style={{ marginTop: "var(--sp-4)" }}>
            {/* La ayuda va atada al grupo con aria-describedby: en modo
              * formulario, un lector lee la etiqueta y la descripcion del
              * control, no el texto suelto que haya alrededor. */}
            <fieldset
              className="campo"
              style={{ border: "none" }}
              aria-describedby="ayuda-tallas"
            >
              <legend>Talla</legend>
              <p className="ayuda" id="ayuda-tallas">
                Puedes marcar varias: un bebé siempre está a caballo entre
                dos.
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
              {/* Esta ayuda es la que mas falta hace de todas: explica
                * que el filtro ORDENA y no filtra. Quien no la oiga elige
                * Madrid, ve resultados de Sevilla y concluye que el
                * buscador esta roto. */}
              <select
                id="provincia"
                name="provincia"
                aria-describedby="ayuda-provincia"
                defaultValue={uno(parametros.provincia)}
              >
                <option value="">Toda España</option>
                {PROVINCIAS.map((provincia) => (
                  <option key={provincia.codigo} value={provincia.codigo}>
                    {provincia.nombre}
                  </option>
                ))}
              </select>
              <span className="ayuda" id="ayuda-provincia">
                Pone delante lo de esa provincia. No esconde el resto.
              </span>
            </div>

            <div className="campo">
              <label htmlFor="precio">Precio máximo</label>
              <input
                id="precio"
                name="precio"
                /* El type va escrito a proposito. Sin el, el campo se
                 * comporta como texto pero el selector input[type="text"]
                 * no lo encuentra, y se queda sin alto tactil, sin borde y
                 * sin colores: 21 pixeles de alto en medio de controles de
                 * 48. Y no es type="number" porque ahi el navegador
                 * rechaza la coma, y aqui se escribe «12,50». */
                type="text"
                inputMode="decimal"
                defaultValue={uno(parametros.precio)}
                placeholder="25"
              />
            </div>
          </div>
        </details>

        <div style={{ display: "flex", gap: "var(--sp-3)" }}>
          <button className="boton" type="submit">
            Buscar
          </button>
          {hayFiltros && (
            <a className="boton boton-secundario" href="/buscar">
              Limpiar
            </a>
          )}
        </div>
      </form>
    </PantallaDeCatalogo>
  );
}
