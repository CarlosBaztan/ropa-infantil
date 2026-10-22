import { headers } from "next/headers";

/**
 * La dirección pública de esta instalación, deducida de la petición.
 * Hace falta para los enlaces que viajan por correo: en desarrollo apunta
 * a localhost y en producción al dominio real, sin configurar nada.
 */
export async function origenDeLaPeticion(): Promise<string> {
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
