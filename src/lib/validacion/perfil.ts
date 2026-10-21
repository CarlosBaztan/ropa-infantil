/*
 * Reglas de validación del perfil y del registro.
 *
 * Viven en su propio archivo, separadas de las pantallas, por dos razones:
 * se prueban sin navegador, y las usan tanto el formulario del cliente como
 * la acción del servidor. La base de datos tiene la última palabra —sus
 * restricciones son las mismas que estas expresiones—; lo que añade este
 * archivo es un mensaje que una persona pueda entender.
 */

export type Resultado<T> =
  | { valido: true; valor: T }
  | { valido: false; error: string };

export interface EntradaRegistro {
  correo: string;
  contrasena: string;
  /** En formato AAAA-MM-DD, tal como lo entrega un campo de tipo date. */
  fechaNacimiento: string;
  aceptaMarketing: boolean;
}

/** Comprar y vender son contratos, así que no basta con los 14 años que
 *  pide la ley para consentir el tratamiento de datos. */
const EDAD_MINIMA = 18;
const EDAD_MAXIMA_RAZONABLE = 120;
const LONGITUD_MINIMA_CONTRASENA = 10;

const FORMA_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FORMA_FECHA = /^\d{4}-\d{2}-\d{2}$/;
/** Misma expresión que la restricción alias_con_forma de la base de datos. */
const FORMA_ALIAS = /^[a-z0-9][a-z0-9_-]{1,28}[a-z0-9]$/;

/**
 * Deja el correo en una sola forma canónica, para que "Ana@X.com" y
 * "ana@x.com" no acaben siendo dos cuentas distintas.
 */
export function normalizarCorreo(correo: string): string {
  return correo.trim().toLowerCase();
}

/**
 * Edad en años cumplidos, o null si la fecha no sirve: con formato
 * equivocado, inexistente (un 30 de febrero), futura o absurdamente
 * antigua.
 */
export function edadEnAnios(
  fechaNacimiento: string,
  hoy = new Date(),
): number | null {
  if (!FORMA_FECHA.test(fechaNacimiento)) return null;

  const fecha = new Date(`${fechaNacimiento}T00:00:00Z`);
  if (Number.isNaN(fecha.getTime())) return null;

  // Rechaza fechas que no existen, como "2008-02-30", que JavaScript
  // convertiría en marzo sin avisar.
  if (fecha.toISOString().slice(0, 10) !== fechaNacimiento) return null;

  if (fecha.getTime() > hoy.getTime()) return null;

  let edad = hoy.getUTCFullYear() - fecha.getUTCFullYear();
  const mesesDeDiferencia = hoy.getUTCMonth() - fecha.getUTCMonth();
  if (
    mesesDeDiferencia < 0 ||
    (mesesDeDiferencia === 0 && hoy.getUTCDate() < fecha.getUTCDate())
  ) {
    edad--;
  }

  if (edad > EDAD_MAXIMA_RAZONABLE) return null;
  return edad;
}

export function validarRegistro(
  entrada: EntradaRegistro,
): Resultado<EntradaRegistro> {
  const correo = normalizarCorreo(entrada.correo);
  if (!FORMA_CORREO.test(correo)) {
    return { valido: false, error: "Ese correo no parece válido." };
  }

  if (entrada.contrasena.length < LONGITUD_MINIMA_CONTRASENA) {
    return {
      valido: false,
      error: `La contraseña necesita al menos ${LONGITUD_MINIMA_CONTRASENA} caracteres.`,
    };
  }

  const edad = edadEnAnios(entrada.fechaNacimiento);
  if (edad === null) {
    return { valido: false, error: "Revisa la fecha de nacimiento." };
  }
  if (edad < EDAD_MINIMA) {
    return {
      valido: false,
      error: `Para comprar y vender hay que tener ${EDAD_MINIMA} años o más.`,
    };
  }

  return { valido: true, valor: { ...entrada, correo } };
}

/**
 * El alias va en la dirección pública del perfil (/armario/<alias>), así que
 * solo admite lo que cabe en una dirección limpia: letras sin acentos,
 * números, guiones y guiones bajos.
 */
export function validarAlias(alias: string): Resultado<string> {
  const limpio = alias.trim().toLowerCase();

  if (limpio.length < 3) {
    return { valido: false, error: "El alias necesita al menos 3 caracteres." };
  }
  if (limpio.length > 30) {
    return { valido: false, error: "El alias no puede pasar de 30 caracteres." };
  }
  if (!FORMA_ALIAS.test(limpio)) {
    return {
      valido: false,
      error:
        "El alias solo admite letras sin acentos, números, guiones y guiones bajos.",
    };
  }

  return { valido: true, valor: limpio };
}
