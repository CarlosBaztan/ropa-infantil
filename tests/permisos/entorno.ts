/*
 * Utilidades para las pruebas de permisos, que se ejecutan contra el
 * proyecto de PRUEBAS de Supabase, nunca contra el de producción: estas
 * pruebas crean y borran usuarios sin preguntar.
 *
 * Mientras no haya claves en .env.local, las pruebas que dependen de la
 * base de datos se saltan en lugar de fallar: que falte una credencial no
 * es un error del código.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });

const URL = process.env.SUPABASE_TEST_URL?.trim();
const CLAVE_PUBLICABLE = process.env.SUPABASE_TEST_PUBLISHABLE_KEY?.trim();
const CLAVE_SECRETA = process.env.SUPABASE_TEST_SECRET_KEY?.trim();

export const HAY_BASE_DE_DATOS = Boolean(
  URL && CLAVE_PUBLICABLE && CLAVE_SECRETA,
);

export const MOTIVO_SALTO =
  "faltan las claves del proyecto de pruebas en .env.local";

/** Cliente con la clave secreta: se salta todas las reglas de permisos. */
export function clienteAdministrador(): SupabaseClient {
  return createClient(URL!, CLAVE_SECRETA!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Cliente sin sesión, como un visitante que no se ha registrado. */
export function clienteAnonimo(): SupabaseClient {
  return createClient(URL!, CLAVE_PUBLICABLE!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export interface UsuarioDePrueba {
  id: string;
  correo: string;
  cliente: SupabaseClient;
}

const CONTRASENA_DE_PRUEBA = "contrasena-de-prueba-1234";

/**
 * Crea un usuario y devuelve un cliente con su sesión iniciada, para
 * comprobar qué puede y qué no puede hacer una persona concreta.
 */
export async function crearUsuarioDePrueba(
  prefijo: string,
  correoVerificado = true,
): Promise<UsuarioDePrueba> {
  const admin = clienteAdministrador();
  const correo = `${prefijo}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}@ejemplo.test`;

  const { data, error } = await admin.auth.admin.createUser({
    email: correo,
    password: CONTRASENA_DE_PRUEBA,
    email_confirm: correoVerificado,
  });
  if (error) throw error;

  const cliente = clienteAnonimo();
  const { error: errorAcceso } = await cliente.auth.signInWithPassword({
    email: correo,
    password: CONTRASENA_DE_PRUEBA,
  });
  if (errorAcceso) throw errorAcceso;

  return { id: data.user!.id, correo, cliente };
}

export async function borrarUsuarioDePrueba(id: string): Promise<void> {
  await clienteAdministrador().auth.admin.deleteUser(id);
}
