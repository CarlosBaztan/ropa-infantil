import type { MetadataRoute } from "next";

/*
 * Lo que necesita un móvil para añadir esto a la pantalla de inicio.
 *
 * Importa más de lo que parece en un proyecto sin aplicación nativa:
 * quien publica ropa a menudo vuelve cada pocas semanas, y un icono en
 * la pantalla de inicio es la diferencia entre volver y no acordarse.
 * Abierta así, la web se ve sin la barra del navegador.
 *
 * El nombre es provisional, como el de la cabecera: el definitivo está
 * pendiente de decidir y aparece en docs/pendientes.md.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ropa de bebé y niño entre familias",
    short_name: "Ropa entre familias",
    description:
      "Compra y vende lotes de ropa infantil por talla y temporada, con entrega en mano.",
    lang: "es",
    start_url: "/",
    display: "standalone",
    background_color: "#fffcf8",
    theme_color: "#0f6b5c",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
