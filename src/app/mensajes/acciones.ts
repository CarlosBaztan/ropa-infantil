"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { faltaLaMigracion } from "@/lib/mensajes/consulta";
import { clienteServidor } from "@/lib/supabase/servidor";

/*
 * Abrir una conversación y escribir en ella.
 *
 * De quién es cada conversación no se comprueba aquí: lo decide
 * PostgreSQL con sus políticas, y lo comprueban las pruebas de permisos.
 * Esto solo traduce un formulario en una fila y devuelve un mensaje que
 * se entienda.
 */

const LARGO_MAXIMO = 2000;

function volver(a: string, mensaje: string): never {
  redirect(`${a}?error=${encodeURIComponent(mensaje)}`);
}

/**
 * Abre la conversación sobre un anuncio y manda la primera pregunta.
 *
 * Las dos cosas a la vez a propósito: una conversación vacía no le dice
 * nada a quien vende, y le llegaría un aviso por correo sin contenido.
 */
export async function preguntar(datos: FormData): Promise<void> {
  const supabase = await clienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/acceso");

  const anuncio = String(datos.get("anuncio") ?? "");
  const texto = String(datos.get("texto") ?? "").trim();
  const vuelta = String(datos.get("vuelta") ?? "/");

  if (!anuncio) volver(vuelta, "No hemos entendido de qué anuncio hablas.");
  if (texto.length === 0) volver(vuelta, "Escribe tu pregunta.");
  if (texto.length > LARGO_MAXIMO) {
    volver(vuelta, "El mensaje es demasiado largo.");
  }

  const { data: elAnuncio } = await supabase
    .from("anuncios")
    .select("vendedor")
    .eq("id", anuncio)
    .maybeSingle();

  if (!elAnuncio) volver(vuelta, "Ese anuncio ya no está.");
  if (elAnuncio.vendedor === user.id) {
    volver(vuelta, "Este anuncio es tuyo: las preguntas te llegan a ti.");
  }

  // Puede existir ya: se vuelve de otra pantalla, se pulsa dos veces, o
  // se abre desde dos sitios. En ese caso se escribe en la que hay.
  const { data: existente } = await supabase
    .from("conversaciones")
    .select("id")
    .eq("anuncio", anuncio)
    .maybeSingle();

  let conversacion = existente?.id as string | undefined;

  if (!conversacion) {
    const { data: creada, error } = await supabase
      .from("conversaciones")
      .insert({
        anuncio,
        comprador: user.id,
        vendedor: elAnuncio.vendedor,
      })
      .select("id")
      .single();

    if (error || !creada) {
      if (faltaLaMigracion(error)) {
        volver(vuelta, "Los mensajes todavía no están disponibles.");
      }
      console.error("[mensajes] no se ha podido abrir:", error?.message);
      volver(vuelta, "No hemos podido abrir la conversación.");
    }
    conversacion = creada.id;
  }

  const { error: errorMensaje } = await supabase
    .from("mensajes")
    .insert({ conversacion, autor: user.id, texto });

  if (errorMensaje) {
    console.error("[mensajes] no se ha podido enviar:", errorMensaje.message);
    volver(`/mensajes/${conversacion}`, "No hemos podido enviar el mensaje.");
  }

  revalidatePath("/mensajes");
  redirect(`/mensajes/${conversacion}`);
}

export async function responder(datos: FormData): Promise<void> {
  const supabase = await clienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/acceso");

  const conversacion = String(datos.get("conversacion") ?? "");
  const texto = String(datos.get("texto") ?? "").trim();
  const aqui = `/mensajes/${conversacion}`;

  if (!conversacion) volver("/mensajes", "No hemos entendido dónde escribir.");
  if (texto.length === 0) volver(aqui, "Escribe algo antes de enviar.");
  if (texto.length > LARGO_MAXIMO) volver(aqui, "El mensaje es demasiado largo.");

  const { error } = await supabase
    .from("mensajes")
    .insert({ conversacion, autor: user.id, texto });

  if (error) {
    console.error("[mensajes] no se ha podido enviar:", error.message);
    volver(aqui, "No hemos podido enviar el mensaje. Inténtalo otra vez.");
  }

  revalidatePath(aqui);
  revalidatePath("/mensajes");
  redirect(aqui);
}

/**
 * Marca como leído lo que te han escrito.
 *
 * Se llama al abrir la conversación. Las reglas de la base solo dejan
 * marcar lo ajeno, así que no hay forma de dar por leído lo propio ni lo
 * de una conversación que no es tuya.
 */
export async function darPorLeido(conversacion: string): Promise<void> {
  const supabase = await clienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("mensajes")
    .update({ leido_el: new Date().toISOString() })
    .eq("conversacion", conversacion)
    .neq("autor", user.id)
    .is("leido_el", null);
}
