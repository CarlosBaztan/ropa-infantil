import { NextResponse, type NextRequest } from "next/server";
import { registrarAceptaciones } from "@/lib/aceptaciones";
import { clienteServidor } from "@/lib/supabase/servidor";

/**
 * Solo se admiten destinos dentro de esta web. Sin esta comprobación,
 * cualquiera podría fabricar un enlace que, tras iniciar sesión, llevase a
 * la persona a un sitio ajeno con aspecto de ser el nuestro.
 */
function destinoSeguro(destino: string | null): string {
  if (!destino) return "/perfil?bienvenida=1";
  if (!destino.startsWith("/") || destino.startsWith("//")) {
    return "/perfil?bienvenida=1";
  }
  return destino;
}

/**
 * Donde aterriza el enlace del correo, tanto el de verificación como el de
 * recuperar la contraseña. Cambia el código de un solo uso por una sesión.
 */
export async function GET(peticion: NextRequest) {
  const { searchParams, origin } = new URL(peticion.url);
  const codigo = searchParams.get("code");

  if (!codigo) {
    return NextResponse.redirect(
      `${origin}/acceso?error=${encodeURIComponent(
        "El enlace no es válido. Pide uno nuevo desde la pantalla de acceso.",
      )}`,
    );
  }

  const supabase = await clienteServidor();
  const { data, error } = await supabase.auth.exchangeCodeForSession(codigo);

  if (error) {
    return NextResponse.redirect(
      `${origin}/acceso?error=${encodeURIComponent(
        "El enlace ha caducado o ya se había usado. Pide uno nuevo.",
      )}`,
    );
  }

  // Ya hay sesión: es el primer momento en que se puede atribuir a alguien
  // la aceptación de los textos legales.
  if (data.user) {
    await registrarAceptaciones(supabase, data.user.id);
  }

  return NextResponse.redirect(
    `${origin}${destinoSeguro(searchParams.get("next"))}`,
  );
}
