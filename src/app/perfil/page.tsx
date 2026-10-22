import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PROVINCIAS } from "@/lib/provincias";
import { clienteServidor } from "@/lib/supabase/servidor";
import { cambiarContrasena, guardarPerfil } from "./acciones";

export const metadata: Metadata = {
  title: "Tu perfil",
  robots: { index: false },
};

interface Perfil {
  alias: string | null;
  provincia: string | null;
  ciudad: string | null;
}

export default async function Perfil({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    guardado?: string;
    contrasena?: string;
    bienvenida?: string;
  }>;
}) {
  const { error, guardado, contrasena, bienvenida } = await searchParams;

  const supabase = await clienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/acceso");

  const { data } = await supabase
    .from("perfiles")
    .select("alias, provincia, ciudad")
    .eq("id", user.id)
    .single();
  const perfil = (data ?? { alias: null, provincia: null, ciudad: null }) as Perfil;

  return (
    <div className="pagina">
      <h1 style={{ fontSize: "var(--fs-2xl)", lineHeight: "var(--lh-tight)" }}>
        Tu perfil
      </h1>

      {bienvenida ? (
        <p className="tarjeta" style={{ marginTop: "var(--sp-5)" }}>
          Cuenta confirmada. Ponte un alias y ya podrás publicar.
        </p>
      ) : null}

      {/* aria-live para que el lector de pantalla anuncie el resultado */}
      <div aria-live="polite">
        {guardado ? (
          <p className="tarjeta" style={{ marginTop: "var(--sp-5)" }}>
            Cambios guardados.
          </p>
        ) : null}
        {contrasena ? (
          <p className="tarjeta" style={{ marginTop: "var(--sp-5)" }}>
            Contraseña cambiada.
          </p>
        ) : null}
      </div>

      {error ? (
        <p
          role="alert"
          className="aviso-error"
          style={{ marginTop: "var(--sp-5)" }}
        >
          {error}
        </p>
      ) : null}

      <form
        action={guardarPerfil}
        className="pila"
        style={{ marginTop: "var(--sp-6)" }}
      >
        <div className="campo">
          <label htmlFor="alias">Alias</label>
          <input
            id="alias"
            name="alias"
            type="text"
            defaultValue={perfil.alias ?? ""}
            required
            aria-describedby="ayuda-alias"
          />
          <span id="ayuda-alias" className="ayuda">
            Es tu nombre público y va en la dirección de tu armario. Letras
            sin acentos, números y guiones.
          </span>
        </div>

        <div className="campo">
          <label htmlFor="provincia">Provincia</label>
          <select
            id="provincia"
            name="provincia"
            defaultValue={perfil.provincia ?? ""}
            required
          >
            <option value="" disabled>
              Elige una provincia
            </option>
            {PROVINCIAS.map((p) => (
              <option key={p.codigo} value={p.codigo}>
                {p.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="campo">
          <label htmlFor="ciudad">Ciudad o pueblo (opcional)</label>
          <input
            id="ciudad"
            name="ciudad"
            type="text"
            defaultValue={perfil.ciudad ?? ""}
            maxLength={80}
            aria-describedby="ayuda-ciudad"
          />
          <span id="ayuda-ciudad" className="ayuda">
            No pongas tu dirección. Solo sirve para que te encuentren cerca.
          </span>
        </div>

        <button type="submit" className="boton">
          Guardar
        </button>
      </form>

      <hr
        style={{
          margin: "var(--sp-10) 0 var(--sp-6)",
          border: "none",
          borderTop: "1px solid var(--c-border)",
        }}
      />

      <h2 style={{ fontSize: "var(--fs-xl)" }}>Cambiar la contraseña</h2>
      <form action={cambiarContrasena} className="pila" style={{ marginTop: "var(--sp-4)" }}>
        <div className="campo">
          <label htmlFor="contrasena-nueva">Contraseña nueva</label>
          <input
            id="contrasena-nueva"
            name="contrasena"
            type="password"
            autoComplete="new-password"
            minLength={10}
            required
          />
        </div>
        <button type="submit" className="boton boton-secundario">
          Cambiar la contraseña
        </button>
      </form>

      <div style={{ marginTop: "var(--sp-10)" }}>
        {perfil.alias ? (
          <p>
            Tu armario público:{" "}
            <Link href={`/armario/${perfil.alias}`}>
              /armario/{perfil.alias}
            </Link>
          </p>
        ) : null}

        {/* Cerrar sesión por POST: un GET lo dispararía cualquier precarga */}
        <form action="/salir" method="post" style={{ marginTop: "var(--sp-5)" }}>
          <button type="submit" className="boton boton-secundario">
            Cerrar sesión
          </button>
        </form>
      </div>
    </div>
  );
}
