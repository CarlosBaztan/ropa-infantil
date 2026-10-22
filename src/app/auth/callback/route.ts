import { NextResponse, type NextRequest } from "next/server";
import { clienteServidor } from "@/lib/supabase/servidor";

/**
 * Donde aterriza el enlace del correo de verificación. Cambia el código de
 * un solo uso por una sesión y lleva a la persona a su perfil.
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
  const { error } = await supabase.auth.exchangeCodeForSession(codigo);

  if (error) {
    return NextResponse.redirect(
      `${origin}/acceso?error=${encodeURIComponent(
        "El enlace ha caducado o ya se había usado. Pide uno nuevo.",
      )}`,
    );
  }

  return NextResponse.redirect(`${origin}/perfil?bienvenida=1`);
}
