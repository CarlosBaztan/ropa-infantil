import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RejillaDeAnuncios } from "@/components/RejillaDeAnuncios";
import type { ResumenDeAnuncio } from "@/lib/anuncios/catalogo";
import { CAMPOS_DE_TARJETA } from "@/lib/anuncios/catalogo";
import { provinciaPorCodigo } from "@/lib/provincias";
import { clientePublico } from "@/lib/supabase/servidor";

/*
 * El armario de una persona.
 *
 * Lo que tiene en venta y lo que ya ha vendido. Lo vendido no es relleno:
 * en una plataforma donde dos desconocidas quedan en la puerta de un
 * metro, ver que alguien ya ha vendido seis veces es la única prueba de
 * que se puede confiar en ella.
 */

export const revalidate = 300;

interface PerfilPublico {
  id: string;
  alias: string;
  provincia: string | null;
  ciudad: string | null;
  fecha_alta: string;
}

async function buscarArmario(alias: string) {
  const supabase = clientePublico();

  const { data } = await supabase
    .from("perfiles")
    .select("id, alias, provincia, ciudad, fecha_alta")
    .eq("alias", alias.toLowerCase())
    .maybeSingle();

  const perfil = (data as PerfilPublico | null) ?? null;
  if (!perfil) return null;

  const { data: anuncios } = await supabase
    .from("anuncios")
    .select(CAMPOS_DE_TARJETA)
    .eq("vendedor", perfil.id)
    .in("situacion", ["activa", "reservada", "vendida"])
    .order("publicado_el", { ascending: false });

  const todos = (anuncios as unknown as ResumenDeAnuncio[] | null) ?? [];
  return {
    perfil,
    enVenta: todos.filter((a) => a.situacion !== "vendida"),
    vendidos: todos.filter((a) => a.situacion === "vendida"),
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ alias: string }>;
}): Promise<Metadata> {
  const { alias } = await params;
  const armario = await buscarArmario(alias);
  if (!armario) {
    return { title: "Armario no encontrado", robots: { index: false } };
  }

  const lugar = provinciaPorCodigo(armario.perfil.provincia ?? "")?.nombre;
  return {
    title: `El armario de ${armario.perfil.alias}`,
    description: lugar
      ? `Ropa de bebé y niño de segunda mano de ${armario.perfil.alias}, en ${lugar}.`
      : `Ropa de bebé y niño de segunda mano de ${armario.perfil.alias}.`,
    // Un armario vacío no tiene nada que hacer en un buscador.
    robots:
      armario.enVenta.length === 0 ? { index: false, follow: true } : undefined,
  };
}

function antiguedad(fechaAlta: string): string {
  const mes = new Date(fechaAlta).toLocaleDateString("es-ES", {
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
  const armario = await buscarArmario(alias);
  if (!armario) notFound();

  const { perfil, enVenta, vendidos } = armario;
  const provincia = provinciaPorCodigo(perfil.provincia ?? "");

  return (
    <div className="pagina pagina-ancha">
      <h1 style={{ fontSize: "var(--fs-2xl)", lineHeight: "var(--lh-tight)" }}>
        El armario de {perfil.alias}
      </h1>

      <p className="ayuda" style={{ marginTop: "var(--sp-2)" }}>
        {[provincia?.nombre, perfil.ciudad].filter(Boolean).join(" · ")}
      </p>
      <p className="ayuda">{antiguedad(perfil.fecha_alta)}</p>
      {vendidos.length > 0 && (
        <p className="ayuda">
          {vendidos.length === 1
            ? "Ha vendido una vez"
            : `Ha vendido ${vendidos.length} veces`}
        </p>
      )}

      <section style={{ marginTop: "var(--sp-8)" }}>
        <h2 style={{ fontSize: "var(--fs-xl)" }}>En venta</h2>
        <RejillaDeAnuncios
          anuncios={enVenta}
          vacio="Ahora mismo no tiene nada en venta."
        />
      </section>

      {vendidos.length > 0 && (
        <section style={{ marginTop: "var(--sp-10)" }}>
          <h2 style={{ fontSize: "var(--fs-xl)" }}>Ya vendido</h2>
          <RejillaDeAnuncios anuncios={vendidos} />
        </section>
      )}
    </div>
  );
}
