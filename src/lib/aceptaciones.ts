import type { SupabaseClient } from "@supabase/supabase-js";
import { VERSION_LEGAL } from "@/lib/legal";

/*
 * Deja constancia de qué versión de los textos legales aceptó cada persona.
 *
 * Las condiciones dicen literalmente «guardamos qué versión aceptó cada
 * persona y cuándo», y durante un tiempo la tabla existía pero nadie
 * escribía en ella: el registro prometido estaba vacío. Una promesa en un
 * documento legal que el código no cumple es peor que no hacer la promesa.
 */

const DOCUMENTOS = [
  "aviso-legal",
  "condiciones",
  "privacidad",
  "cookies",
] as const;

/**
 * Registra la aceptación de los cuatro textos en su versión vigente.
 *
 * Se llama cuando la persona ya tiene sesión, no al rellenar el formulario:
 * hasta que no confirma el correo no hay a quién atribuir la aceptación.
 * Es idempotente: si ya estaban registradas, no pasa nada.
 *
 * La fecha no se envía a propósito: la pone la base de datos. Si la eligiera
 * quien acepta, el registro no probaría cuándo aceptó.
 */
export async function registrarAceptaciones(
  supabase: SupabaseClient,
  usuario: string,
): Promise<void> {
  const filas = DOCUMENTOS.map((documento) => ({
    usuario,
    documento_slug: documento,
    documento_version: VERSION_LEGAL,
  }));

  // Si falla, no se bloquea a la persona: habrá iniciado sesión igualmente
  // y el registro se puede reconstruir. Pero queda en el registro de
  // errores del servidor para que se vea.
  const { error } = await supabase
    .from("aceptaciones")
    .upsert(filas, {
      onConflict: "usuario,documento_slug,documento_version",
      ignoreDuplicates: true,
    });

  if (error) {
    console.error("No se pudo registrar la aceptación de los textos legales", {
      usuario,
      version: VERSION_LEGAL,
      error: error.message,
    });
  }
}
