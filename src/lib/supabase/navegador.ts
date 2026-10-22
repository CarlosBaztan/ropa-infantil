import { createBrowserClient } from "@supabase/ssr";

/**
 * Cliente para el navegador. Usa la clave publicable, que es pública por
 * diseño: quien abra la web la tiene. Lo que protege los datos no es
 * esconder esta clave, son las reglas de permisos de PostgreSQL.
 */
export function clienteNavegador() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
