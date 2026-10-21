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
/**
 * La restricción alias_con_forma de la tabla perfiles tendrá que usar esta
 * misma expresión cuando se escriba esa migración (tarea 4): la base de
 * datos es la última palabra y esto solo da un mensaje legible.
 */
const FORMA_ALIAS = /^[a-z0-9][a-z0-9_-]{1,28}[a-z0-9]$/;

/*
 * La edad se mide por el calendario de España, no por el de Greenwich.
 * Medir en UTC rechazaba por menor, entre las once de la noche y medianoche,
 * a quien ya había cumplido los 18 aquí.
 */
const ZONA_HORARIA = "Europe/Madrid";

const FECHA_EN_ESPANA = new Intl.DateTimeFormat("en-CA", {
  timeZone: ZONA_HORARIA,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Devuelve el día que es en España, como AAAA-MM-DD. */
function diaEnEspana(instante: Date): string {
  return FECHA_EN_ESPANA.format(instante);
}

/** Parte un AAAA-MM-DD validado en sus tres números. */
function partesDeFecha(fecha: string): [number, number, number] {
  const trozos = fecha.split("-");
  return [Number(trozos[0]), Number(trozos[1]), Number(trozos[2])];
}

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
  ahora = new Date(),
): number | null {
  if (!FORMA_FECHA.test(fechaNacimiento)) return null;

  const comoFecha = new Date(`${fechaNacimiento}T00:00:00Z`);
  if (Number.isNaN(comoFecha.getTime())) return null;

  // Rechaza fechas que no existen, como "2008-02-30", que JavaScript
  // convertiría en marzo sin avisar.
  if (comoFecha.toISOString().slice(0, 10) !== fechaNacimiento) return null;

  // Las dos fechas se comparan como texto AAAA-MM-DD, que ordena igual que
  // el calendario y no arrastra husos horarios.
  const hoy = diaEnEspana(ahora);
  if (fechaNacimiento > hoy) return null;

  const [anioNace, mesNace, diaNace] = partesDeFecha(fechaNacimiento);
  const [anioHoy, mesHoy, diaHoy] = partesDeFecha(hoy);

  let edad = anioHoy - anioNace;
  if (mesHoy < mesNace || (mesHoy === mesNace && diaHoy < diaNace)) {
    edad--;
  }

  if (edad > EDAD_MAXIMA_RAZONABLE) return null;
  return edad;
}

export function validarRegistro(
  entrada: EntradaRegistro,
  /* El reloj se inyecta para que las pruebas del límite de los 18 años no
   * cambien de significado con el paso del tiempo. */
  ahora = new Date(),
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

  const edad = edadEnAnios(entrada.fechaNacimiento, ahora);
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
