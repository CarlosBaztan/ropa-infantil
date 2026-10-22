/*
 * Datos del titular y versión de los textos legales.
 *
 * La ley de servicios de la sociedad de la información obliga a publicar
 * el nombre, el NIF y el domicilio de quien está detrás de la web. Mientras
 * falten, las páginas legales se marcan como no indexables y muestran un
 * aviso visible: es preferible un hueco señalado a un dato inventado.
 */

export interface Titular {
  nombre: string | null;
  nif: string | null;
  domicilio: string | null;
  correoDeContacto: string | null;
}

export const TITULAR: Titular = {
  nombre: null,
  nif: null,
  domicilio: null,
  correoDeContacto: null,
};

/** Versión vigente de los textos. Cambiarla obliga a aceptar de nuevo. */
export const VERSION_LEGAL = "2026-10-22";

export function faltanDatosDelTitular(titular: Titular = TITULAR): boolean {
  return (
    !titular.nombre ||
    !titular.nif ||
    !titular.domicilio ||
    !titular.correoDeContacto
  );
}

/** Qué datos concretos faltan, para poder decirlo con precisión. */
export function datosDelTitularQueFaltan(titular: Titular = TITULAR): string[] {
  const faltan: string[] = [];
  if (!titular.nombre) faltan.push("nombre o razón social");
  if (!titular.nif) faltan.push("NIF");
  if (!titular.domicilio) faltan.push("domicilio");
  if (!titular.correoDeContacto) faltan.push("correo de contacto");
  return faltan;
}
