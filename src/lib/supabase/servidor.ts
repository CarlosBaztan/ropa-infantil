import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Cliente para el servidor. Lee la sesión de las cookies de la petición.
 * Usa también la clave publicable: el servidor actúa en nombre de quien
 * ha iniciado sesión, no por encima de las reglas.
 *
 * La clave secreta no se usa en la aplicación: solo en las pruebas y, en
 * su día, en tareas de administración.
 */
export async function clienteServidor() {
  const almacen = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => almacen.getAll(),
        setAll: (lista) => {
          try {
            for (const { name, value, options } of lista) {
              almacen.set(name, value, options);
            }
          } catch {
            // Llamado desde un componente de servidor, donde no se pueden
            // escribir cookies. La sesión se renueva en el middleware, así
            // que aquí no hay nada que hacer.
          }
        },
      },
    },
  );
}

/** El usuario de la sesión actual, o null si no hay sesión. */
export async function usuarioActual() {
  const supabase = await clienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
