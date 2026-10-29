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
      <div className="rejilla-anuncios" style={{ marginTop: "var(--sp-4)" }}>
        {anuncios.map((anuncio) => (
          <TarjetaDeAnuncio key={anuncio.id_publico} anuncio={anuncio} />
        ))}
      </div>

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
