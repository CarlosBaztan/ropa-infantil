import { headers } from "next/headers";

/**
 * La dirección pública de esta instalación, deducida de la petición.
 * Hace falta para los enlaces que viajan por correo: en desarrollo apunta
 * a localhost y en producción al dominio real, sin configurar nada.
 */
export async function origenDeLaPeticion(): Promise<string> {
  // En producción manda la dirección configurada, no la que venga en las
  // cabeceras: esas las puede falsear quien hace la petición, y estas
  // direcciones viajan dentro de correos. Sin esto, lo único que impide
  // envenenar un enlace de recuperación es la lista de direcciones
  // permitidas de Supabase, que vive fuera de este repositorio.
  const configurada = process.env.NEXT_PUBLIC_SITIO_URL?.trim();
  if (configurada) return configurada.replace(/\/+$/, "");

  const cabeceras = await headers();
  const anfitrion =
    cabeceras.get("x-forwarded-host") ??
    cabeceras.get("host") ??
    "localhost:3000";
  const protocolo =
    cabeceras.get("x-forwarded-proto") ??
    (anfitrion.startsWith("localhost") ? "http" : "https");
  return `${protocolo}://${anfitrion}`;
}
