"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { direccionDeAnuncio } from "@/lib/anuncios/direccion";
import { clienteServidor } from "@/lib/supabase/servidor";

/*
 * Lo que se puede hacer con un anuncio propio: reservarlo, venderlo,
 * retirarlo, volver a publicarlo y borrarlo.
 *
 * Aquí no se comprueba de quién es: eso lo hace PostgreSQL con sus
 * políticas, y lo comprueban las pruebas de permisos. Esta capa solo
 * traduce un botón en un cambio de situación y vuelve con un mensaje que
 * se entienda.
 */

type Situacion = "activa" | "reservada" | "vendida" | "retirada";

const SITUACIONES: readonly Situacion[] = [
  "activa",
  "reservada",
  "vendida",
  "retirada",
];

function volverConError(mensaje: string): never {
  redirect(`/mis-anuncios?error=${encodeURIComponent(mensaje)}`);
}

function esSituacion(valor: string): valor is Situacion {
  return (SITUACIONES as readonly string[]).includes(valor);
}

export async function cambiarSituacion(datos: FormData): Promise<void> {
  const supabase = await clienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/acceso");

  const anuncio = String(datos.get("anuncio") ?? "");
  const situacion = String(datos.get("situacion") ?? "");
  if (!anuncio || !esSituacion(situacion)) {
    volverConError("No hemos entendido qué querías cambiar.");
  }

  // La fecha de venta no se manda desde aquí: la escribe —y la borra, si
  // se deshace— un disparador de la base de datos. Si saliera de esta
  // pantalla sería un dato que elige la parte interesada.
  const { data, error } = await supabase
    .from("anuncios")
    .update({ situacion })
    .eq("id", anuncio)
    .select("slug, id_publico")
    .maybeSingle();

  if (error) {
    console.error("[mis-anuncios] no se ha podido cambiar:", error.message);
    volverConError("No hemos podido cambiarlo. Inténtalo otra vez.");
  }
  if (!data) {
    volverConError("Ese anuncio no es tuyo o ya no existe.");
  }

  revalidatePath("/mis-anuncios");
  revalidatePath(direccionDeAnuncio(data.slug, data.id_publico));
  redirect(`/mis-anuncios?hecho=${situacion}`);
}

export async function borrarAnuncio(datos: FormData): Promise<void> {
  const supabase = await clienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/acceso");

  const anuncio = String(datos.get("anuncio") ?? "");
  if (!anuncio) volverConError("No hemos entendido qué querías borrar.");

  // Las fotos del almacén se quedarían huérfanas si solo se borrara la
  // fila, así que se quitan primero. La tabla de fotos sí cae sola, en
  // cascada desde el anuncio.
  const { data: fotos } = await supabase
    .from("fotos")
    .select("ruta")
    .eq("anuncio", anuncio);

  if (fotos && fotos.length > 0) {
    await supabase.storage.from("anuncios").remove(fotos.map((f) => f.ruta));
  }

  const { error } = await supabase.from("anuncios").delete().eq("id", anuncio);
  if (error) {
    console.error("[mis-anuncios] no se ha podido borrar:", error.message);
    volverConError("No hemos podido borrarlo. Inténtalo otra vez.");
  }

  revalidatePath("/mis-anuncios");
  redirect("/mis-anuncios?hecho=borrada");
}
