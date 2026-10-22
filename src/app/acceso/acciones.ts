"use server";

import { redirect } from "next/navigation";
import { clienteServidor } from "@/lib/supabase/servidor";
import { origenDeLaPeticion } from "@/lib/url";
import { normalizarCorreo } from "@/lib/validacion/perfil";

export async function entrar(datos: FormData): Promise<void> {
  const correo = normalizarCorreo(String(datos.get("correo") ?? ""));
  const contrasena = String(datos.get("contrasena") ?? "");

  const supabase = await clienteServidor();
  const { error } = await supabase.auth.signInWithPassword({
    email: correo,
    password: contrasena,
  });

  if (error) {
    // Supabase distingue "correo sin confirmar" de "credenciales mal",
    // y conviene decirlo: son dos problemas con soluciones distintas.
    const mensaje =
      error.code === "email_not_confirmed"
        ? "Todavía no has confirmado tu correo. Abre el enlace que te enviamos."
        : "El correo o la contraseña no son correctos.";
    redirect(`/acceso?error=${encodeURIComponent(mensaje)}`);
  }

  redirect("/perfil");
}

export async function pedirEnlaceDeRecuperacion(
  datos: FormData,
): Promise<void> {
  const correo = normalizarCorreo(String(datos.get("correo") ?? ""));
  const supabase = await clienteServidor();
  const origen = await origenDeLaPeticion();

  await supabase.auth.resetPasswordForEmail(correo, {
    redirectTo: `${origen}/auth/callback`,
  });

  // Siempre se contesta lo mismo, exista o no la cuenta: lo contrario
  // permitiría averiguar quién está registrado aquí.
  redirect("/acceso/recuperar/enviado");
}
