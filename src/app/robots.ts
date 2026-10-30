import type { MetadataRoute } from "next";
import { sitio } from "@/lib/sitio";

/*
 * Lo que se le pide a los buscadores.
 *
 * Fuera lo que no es catálogo: el buscador con sus combinaciones
 * infinitas de filtros, las pantallas que solo tienen sentido con sesión
 * iniciada y la devolución de llamada del acceso. Cada una de ellas, si
 * se rastreara, gastaría presupuesto de rastreo en páginas que no van a
 * traer a nadie.
 *
 * Las páginas con pocos anuncios NO se bloquean aquí: llevan su propio
 * «no me guardes» en los metadatos, que es distinto. Bloquearlas aquí
 * impediría a Google seguir sus enlaces y descubrir las fichas, que son
 * justo las que interesan.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/buscar",
        "/publicar",
        "/mis-anuncios",
        "/perfil",
        "/acceso",
        "/registro",
        "/salir",
        "/auth/",
      ],
    },
    sitemap: `${sitio()}/sitemap.xml`,
  };
}
