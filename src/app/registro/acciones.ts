"use server";

import { redirect } from "next/navigation";
import { clienteServidor } from "@/lib/supabase/servidor";
import { origenDeLaPeticion } from "@/lib/url";
import { validarRegistro } from "@/lib/validacion/perfil";

function volverConError(mensaje: string): never {
  redirect(`/registro?error=${encodeURIComponent(mensaje)}`);
}

export async function registrar(datos: FormData): Promise<void> {
  const resultado = validarRegistro({
    correo: String(datos.get("correo") ?? ""),
    contrasena: String(datos.get("contrasena") ?? ""),
    fechaNacimiento: String(datos.get("fecha_nacimiento") ?? ""),
    aceptaMarketing: datos.get("acepta_marketing") === "on",
  });

  if (!resultado.valido) volverConError(resultado.error);

  const supabase = await clienteServidor();
  const origen = await origenDeLaPeticion();

  const { error } = await supabase.auth.signUp({
    email: resultado.valor.correo,
    password: resultado.valor.contrasena,
    options: {
      emailRedirectTo: `${origen}/auth/callback`,
      data: {
        fecha_nacimiento: resultado.valor.fechaNacimiento,
        acepta_marketing: resultado.valor.aceptaMarketing,
      },
    },
  });

  if (error) {
    // No se distingue "ese correo ya existe" de otros fallos a propósito:
    // decirlo permitiría averiguar quién está registrado aquí.
    volverConError(
      "No hemos podido crear la cuenta. Revisa los datos e inténtalo de nuevo.",
    );
  }

  redirect("/registro/confirma");
}
