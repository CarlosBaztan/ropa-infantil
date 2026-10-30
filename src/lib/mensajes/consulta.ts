/*
 * Lo que las pantallas de mensajes le piden a la base de datos.
 *
 * Aparte de las pantallas, como el resto: así se puede ejecutar de
 * verdad en las pruebas, con la sesión de una persona concreta, que es
 * lo único que demuestra que las reglas de permisos hacen lo que dicen.
 *
 * Todas las funciones aguantan que las tablas todavía no existan. No es
 * pereza: la migración 0012 la aplica una persona a mano en el panel de
 * Supabase, y entre que esto se despliega y alguien la pega puede pasar
 * un rato. Durante ese rato, la bandeja tiene que decir que esto aún no
 * está, no reventar con un error del servidor.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export interface ResumenDeConversacion {
  id: string;
  anuncio: string;
  comprador: string;
  vendedor: string;
  ultimo_mensaje_el: string;
  elAnuncio: {
    titulo: string;
    slug: string;
    id_publico: string;
    precio_centimos: number;
    situacion: string;
    fotos: { ruta: string; orden?: number }[];
  } | null;
  laOtraParte: { alias: string } | null;
  sinLeer: number;
}

export interface Mensaje {
  id: string;
  autor: string;
  texto: string;
  enviado_el: string;
  leido_el: string | null;
}

const CAMPOS_DE_CONVERSACION = `
  id, anuncio, comprador, vendedor, ultimo_mensaje_el,
  elAnuncio:anuncios (
    titulo, slug, id_publico, precio_centimos, situacion, fotos ( ruta, orden )
  )
`;

/** Si la migración 0012 todavía no está puesta. */
export function faltaLaMigracion(error: { message?: string } | null): boolean {
  const texto = error?.message ?? "";
  return (
    texto.includes("conversaciones") &&
    (texto.includes("does not exist") || texto.includes("schema cache"))
  );
}

export interface Bandeja {
  conversaciones: ResumenDeConversacion[];
  /** Para poder decirlo en pantalla en vez de enseñar una bandeja vacía. */
  todaviaNoHayMensajeria: boolean;
}

/**
 * Las conversaciones de una persona, las que ha abierto y las que le han
 * abierto, ordenadas por lo último que se dijo.
 */
export async function buscarBandeja(
  supabase: SupabaseClient,
  quien: string,
): Promise<Bandeja> {
  const { data, error } = await supabase
    .from("conversaciones")
    .select(CAMPOS_DE_CONVERSACION)
    .order("ultimo_mensaje_el", { ascending: false });

  if (error) {
    if (faltaLaMigracion(error)) {
      return { conversaciones: [], todaviaNoHayMensajeria: true };
    }
    console.error("[mensajes] no se ha podido leer la bandeja:", error.message);
    return { conversaciones: [], todaviaNoHayMensajeria: false };
  }

  const conversaciones = (data as unknown as ResumenDeConversacion[]) ?? [];
  if (conversaciones.length === 0) {
    return { conversaciones: [], todaviaNoHayMensajeria: false };
  }

  // El alias de la otra parte y lo que queda sin leer se piden aparte y
  // de una vez, en lugar de una consulta por conversación.
  const otros = conversaciones.map((c) =>
    c.comprador === quien ? c.vendedor : c.comprador,
  );
  const { data: perfiles } = await supabase
    .from("perfiles")
    .select("id, alias")
    .in("id", otros);
  const alias = new Map(
    ((perfiles as { id: string; alias: string }[] | null) ?? []).map((p) => [
      p.id,
      p.alias,
    ]),
  );

  const { data: pendientes } = await supabase
    .from("mensajes")
    .select("conversacion")
    .is("leido_el", null)
    .neq("autor", quien)
    .in(
      "conversacion",
      conversaciones.map((c) => c.id),
    );

  const cuenta = new Map<string, number>();
  for (const fila of (pendientes as { conversacion: string }[] | null) ?? []) {
    cuenta.set(fila.conversacion, (cuenta.get(fila.conversacion) ?? 0) + 1);
  }

  for (const conversacion of conversaciones) {
    const otro =
      conversacion.comprador === quien
        ? conversacion.vendedor
        : conversacion.comprador;
    const suAlias = alias.get(otro);
    conversacion.laOtraParte = suAlias ? { alias: suAlias } : null;
    conversacion.sinLeer = cuenta.get(conversacion.id) ?? 0;
  }

  return { conversaciones, todaviaNoHayMensajeria: false };
}

export interface ConversacionAbierta {
  conversacion: ResumenDeConversacion;
  mensajes: Mensaje[];
}

/** Una conversación con todo lo hablado. Null si no es tuya o no existe. */
export async function buscarConversacion(
  supabase: SupabaseClient,
  id: string,
  quien: string,
): Promise<ConversacionAbierta | null> {
  const { data, error } = await supabase
    .from("conversaciones")
    .select(CAMPOS_DE_CONVERSACION)
    .eq("id", id)
    .maybeSingle();

  if (error && !faltaLaMigracion(error)) {
    console.error("[mensajes] no se ha podido abrir:", error.message);
  }
  if (!data) return null;

  const conversacion = data as unknown as ResumenDeConversacion;

  const otro =
    conversacion.comprador === quien
      ? conversacion.vendedor
      : conversacion.comprador;
  const { data: perfil } = await supabase
    .from("perfiles")
    .select("alias")
    .eq("id", otro)
    .maybeSingle();
  conversacion.laOtraParte = (perfil as { alias: string } | null) ?? null;
  conversacion.sinLeer = 0;

  const { data: mensajes } = await supabase
    .from("mensajes")
    .select("id, autor, texto, enviado_el, leido_el")
    .eq("conversacion", id)
    .order("enviado_el", { ascending: true });

  return {
    conversacion,
    mensajes: (mensajes as unknown as Mensaje[] | null) ?? [],
  };
}

/**
 * La conversación de esta persona sobre este anuncio, si ya existe.
 *
 * La ficha la necesita para decidir entre «Preguntar» y «Ver la
 * conversación»: abrir un hilo nuevo sobre un anuncio del que ya se está
 * hablando confundiría a las dos partes.
 */
export async function conversacionSobre(
  supabase: SupabaseClient,
  anuncio: string,
): Promise<string | null> {
  const { data } = await supabase
    .from("conversaciones")
    .select("id")
    .eq("anuncio", anuncio)
    .maybeSingle();
  return (data as { id: string } | null)?.id ?? null;
}
