import { NextResponse, type NextRequest } from "next/server";
import { clienteServidor } from "@/lib/supabase/servidor";

/**
 * Cerrar sesión va por POST, no por GET: un enlace GET lo puede disparar
 * cualquier imagen o precarga del navegador y desconectar a la persona sin
 * que haya pulsado nada.
 */
export async function POST(peticion: NextRequest) {
  const supabase = await clienteServidor();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/", peticion.url), { status: 303 });
}
