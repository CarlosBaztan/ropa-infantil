/*
 * El hueco de la rejilla mientras llega.
 *
 * No es decoración: en un móvil con cobertura regular, media página en
 * blanco durante un segundo se interpreta como que la web está rota y se
 * vuelve atrás. Con la forma de las tarjetas ya dibujada, la espera se
 * lee como lo que es.
 *
 * Lleva aria-hidden y un texto para lector de pantalla aparte: lo que
 * hay que anunciar es «cargando», no doce rectángulos.
 */
export function EsqueletoDeRejilla({ cuantas = 6 }: { cuantas?: number }) {
  return (
    <>
      <p className="ayuda" role="status">
        Cargando…
      </p>
      <div
        className="rejilla-anuncios"
        aria-hidden="true"
        style={{ marginTop: "var(--sp-4)" }}
      >
        {Array.from({ length: cuantas }, (_, indice) => (
          <div key={indice} className="tarjeta-fantasma">
            <div className="foto-fantasma" />
            <div className="linea-fantasma" />
            <div className="linea-fantasma corta" />
          </div>
        ))}
      </div>
    </>
  );
}
