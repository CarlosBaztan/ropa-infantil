import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AJUSTES_DE_TALLA,
  CATEGORIAS,
  ESTADOS_DE_CONSERVACION,
  GENEROS,
  TEMPORADAS,
} from "@/lib/anuncios/modelo";
import { PROVINCIAS } from "@/lib/provincias";
import { clienteServidor } from "@/lib/supabase/servidor";
import { TALLAS } from "@/lib/tallas";
import { FormularioDePublicar } from "./FormularioDePublicar";

export const metadata: Metadata = {
  title: "Publicar",
  robots: { index: false },
};

export default async function Publicar() {
  const supabase = await clienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/acceso");

  // La base de datos lo volvería a negar, pero vale más decirlo aquí que
  // dejar que alguien rellene el formulario entero para nada.
  const { data: puede } = await supabase.rpc("puede_publicar");

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("provincia, ciudad")
    .eq("id", user.id)
    .single();

  if (!puede) {
    return (
      <div className="pagina">
        <h1 style={{ fontSize: "var(--fs-2xl)", lineHeight: "var(--lh-tight)" }}>
          Todavía no puedes publicar
        </h1>
        <p role="alert" className="aviso-error" style={{ marginTop: "var(--sp-5)" }}>
          <span>
            Para publicar hace falta tener el correo verificado y haber
            puesto tu fecha de nacimiento. Comprar y vender son contratos,
            y hay que ser mayor de edad.
          </span>
        </p>
        <p style={{ marginTop: "var(--sp-6)" }}>
          <Link href="/perfil">Ir a tu perfil</Link>
        </p>
      </div>
    );
  }

  return (
    <FormularioDePublicar
      tallas={TALLAS.map((t) => ({ codigo: t.codigo, etiqueta: t.etiqueta }))}
      categorias={[...CATEGORIAS]}
      estados={[...ESTADOS_DE_CONSERVACION]}
      temporadas={[...TEMPORADAS]}
      generos={[...GENEROS]}
      ajustes={[...AJUSTES_DE_TALLA]}
      provincias={PROVINCIAS.map((p) => ({
        codigo: p.codigo,
        etiqueta: p.nombre,
      }))}
      provinciaPorDefecto={perfil?.provincia ?? ""}
      ciudadPorDefecto={perfil?.ciudad ?? ""}
    />
  );
}
