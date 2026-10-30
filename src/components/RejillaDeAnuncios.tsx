import Link from "next/link";
import type { ResumenDeAnuncio } from "@/lib/anuncios/catalogo";
import { TarjetaDeAnuncio } from "./TarjetaDeAnuncio";

/*
 * La rejilla del catálogo: dos columnas en el móvil, más si cabe.
 *
 * «Ver más» es un ENLACE a la página siguiente, no un botón que añade
 * filas sin tocar la dirección. El desplazamiento infinito rompe el
 * botón de atrás —vuelves arriba del todo y pierdes el sitio— y en un
 * móvil con una mano el botón de atrás es la mitad de la navegación.
 * Además, así la página 2 se puede compartir y Google la puede recorrer.
 */
export function RejillaDeAnuncios({
  anuncios,
  hayMas = false,
  direccionDeLaSiguiente,
  vacio = "Todavía no hay nada por aquí.",
}: {
  anuncios: ResumenDeAnuncio[];
  hayMas?: boolean;
  direccionDeLaSiguiente?: string;
  vacio?: string;
}) {
  if (anuncios.length === 0) {
    return (
      <p className="tarjeta" style={{ marginTop: "var(--sp-4)" }}>
        {vacio}
      </p>
    );
  }

  return (
    <>
      {/*
        * Una lista de verdad, y con role="list" escrito aunque sea un
        * <ul>: Safari le quita la semantica de lista a una lista sin
        * bolitas, y la mitad de este publico va en iPhone. Sin esto se
        * oyen doce enlaces sueltos y no se sabe cuantos quedan.
        */}
      <ul
        className="rejilla-anuncios"
        role="list"
        style={{ marginTop: "var(--sp-4)", listStyle: "none" }}
      >
        {anuncios.map((anuncio) => (
          <li key={anuncio.id_publico}>
            <TarjetaDeAnuncio anuncio={anuncio} />
          </li>
        ))}
      </ul>

      {hayMas && direccionDeLaSiguiente && (
        <p style={{ marginTop: "var(--sp-6)", textAlign: "center" }}>
          <Link className="boton boton-secundario" href={direccionDeLaSiguiente}>
            Ver más
          </Link>
        </p>
      )}
    </>
  );
}
