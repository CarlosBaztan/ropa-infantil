import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/*
 * Renueva la sesión en cada petición y devuelve las cookies actualizadas.
 * Sin esto, la sesión caduca a mitad de navegación y la persona se
 * encuentra desconectada sin haber hecho nada.
 */
export async function middleware(peticion: NextRequest) {
  let respuesta = NextResponse.next({ request: peticion });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => peticion.cookies.getAll(),
        setAll: (lista) => {
          for (const { name, value } of lista) {
            peticion.cookies.set(name, value);
          }
          respuesta = NextResponse.next({ request: peticion });
          for (const { name, value, options } of lista) {
            respuesta.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // getUser() valida el testigo contra el servidor de Supabase. No usar
  // getSession() aquí: se fía de la cookie sin comprobarla.
  await supabase.auth.getUser();

  return respuesta;
}

export const config = {
  matcher: [
    /*
     * Todas las rutas menos los archivos estáticos y las imágenes, que no
     * necesitan sesión y solo añadirían latencia.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif)$).*)",
  ],
};
