"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { esCodigoDeProvincia } from "@/lib/provincias";
import { clienteServidor } from "@/lib/supabase/servidor";
import { edadEnAnios, validarAlias } from "@/lib/validacion/perfil";

function volverConError(mensaje: string): never {
  redirect(`/perfil?error=${encodeURIComponent(mensaje)}`);
}

export async function guardarPerfil(datos: FormData): Promise<void> {
  const supabase = await clienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/acceso");

  const resultadoAlias = validarAlias(String(datos.get("alias") ?? ""));
  if (!resultadoAlias.valido) volverConError(resultadoAlias.error);

  const provincia = String(datos.get("provincia") ?? "");
  if (!esCodigoDeProvincia(provincia)) {
    volverConError("Elige una provincia de la lista.");
  }

  const ciudad = String(datos.get("ciudad") ?? "").trim();
  if (ciudad.length > 80) {
    volverConError("El nombre de la ciudad es demasiado largo.");
  }

  const fechaNacimiento = String(datos.get("fecha_nacimiento") ?? "");
  const edad = edadEnAnios(fechaNacimiento);
  if (edad === null) volverConError("Revisa la fecha de nacimiento.");
  if (edad < 18) {
    volverConError("Para comprar y vender hay que tener 18 años o más.");
  }

  const { error } = await supabase
    .from("perfiles")
    .update({
      alias: resultadoAlias.valor,
      provincia,
      ciudad: ciudad.length > 0 ? ciudad : null,
      fecha_nacimiento: fechaNacimiento,
      // La política de privacidad promete que se puede retirar cuando se
      // quiera, y el RGPD exige que retirarlo sea tan fácil como darlo.
      // Desmarcar la casilla y guardar es exactamente eso.
      acepta_marketing: datos.get("acepta_marketing") === "on",
    })
    .eq("id", user.id);

  if (error) {
    // 23505 es la violación de unicidad de PostgreSQL. Se traduce, porque
    // el mensaje original no lo entiende nadie.
    if (error.code === "23505") {
      volverConError("Ese alias ya está cogido. Prueba con otro.");
    }
    volverConError("No hemos podido guardar los cambios. Inténtalo de nuevo.");
  }

  revalidatePath("/perfil");
  revalidatePath(`/armario/${resultadoAlias.valor}`);
  redirect("/perfil?guardado=1");
}

export async function cambiarContrasena(datos: FormData): Promise<void> {
  const supabase = await clienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/acceso");

  const nueva = String(datos.get("contrasena") ?? "");
  if (nueva.trim().length < 10) {
    volverConError("La contraseña necesita al menos 10 caracteres.");
  }

  const { error } = await supabase.auth.updateUser({ password: nueva });
  if (error) {
    volverConError("No hemos podido cambiar la contraseña. Inténtalo de nuevo.");
  }

  redirect("/perfil?contrasena=1");
}
