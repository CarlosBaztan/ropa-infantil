import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { provinciaPorCodigo } from "@/lib/provincias";
import { clienteServidor } from "@/lib/supabase/servidor";

interface PerfilPublico {
  alias: string;
  provincia: string | null;
  ciudad: string | null;
  fecha_alta: string;
}

async function buscarPerfil(alias: string): Promise<PerfilPublico | null> {
  const supabase = await clienteServidor();
  const { data } = await supabase
    .from("perfiles")
    .select("alias, provincia, ciudad, fecha_alta")
    .eq("alias", alias.toLowerCase())
    .maybeSingle();
  return (data as PerfilPublico | null) ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ alias: string }>;
}): Promise<Metadata> {
  const { alias } = await params;
  const perfil = await buscarPerfil(alias);
  if (!perfil) return { title: "Armario no encontrado", robots: { index: false } };

  const lugar = provinciaPorCodigo(perfil.provincia ?? "")?.nombre;
  return {
    title: `El armario de ${perfil.alias}`,
    description: lugar
      ? `Ropa de bebé y niño de segunda mano de ${perfil.alias}, en ${lugar}.`
      : `Ropa de bebé y niño de segunda mano de ${perfil.alias}.`,
  };
}

function antiguedad(fechaAlta: string): string {
  const alta = new Date(fechaAlta);
  const mes = alta.toLocaleDateString("es-ES", {
    month: "long",
    year: "numeric",
    timeZone: "Europe/Madrid",
  });
  return `En la plataforma desde ${mes}`;
}

export default async function Armario({
  params,
}: {
  params: Promise<{ alias: string }>;
}) {
  const { alias } = await params;
  const perfil = await buscarPerfil(alias);
  if (!perfil) notFound();

  const provincia = provinciaPorCodigo(perfil.provincia ?? "");

  return (
    <div className="pagina">
      <h1 style={{ fontSize: "var(--fs-2xl)", lineHeight: "var(--lh-tight)" }}>
        El armario de {perfil.alias}
      </h1>

      <p className="ayuda" style={{ marginTop: "var(--sp-2)" }}>
        {[provincia?.nombre, perfil.ciudad].filter(Boolean).join(" · ")}
      </p>
      <p className="ayuda">{antiguedad(perfil.fecha_alta)}</p>

      <section style={{ marginTop: "var(--sp-8) " }}>
        <h2 style={{ fontSize: "var(--fs-xl)" }}>En venta</h2>
        <p className="tarjeta" style={{ marginTop: "var(--sp-4)" }}>
          Todavía no hay nada publicado. Los anuncios llegan en la siguiente
          fase.
        </p>
      </section>

      <section style={{ marginTop: "var(--sp-8)" }}>
        <h2 style={{ fontSize: "var(--fs-xl)" }}>Vendido</h2>
        <p className="tarjeta" style={{ marginTop: "var(--sp-4)" }}>
          Aquí aparecerá lo que haya vendido, que es la mejor señal de que se
          puede confiar en alguien.
        </p>
      </section>
    </div>
  );
}
