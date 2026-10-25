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
  fecha_nacimiento: string | null;
  acepta_marketing: boolean;
}

export default async function Perfil({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    guardado?: string;
    contrasena?: string;
    bienvenida?: string;
    recuperar?: string;
  }>;
}) {
  const { error, guardado, contrasena, bienvenida, recuperar } =
    await searchParams;

  const supabase = await clienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/acceso");

  const { data } = await supabase
    .from("perfiles")
    .select("alias, provincia, ciudad, fecha_nacimiento, acepta_marketing")
    .eq("id", user.id)
    .single();
  const perfil = (data ?? {
    alias: null,
    provincia: null,
    ciudad: null,
    fecha_nacimiento: null,
    acepta_marketing: false,
  }) as Perfil;

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

      {recuperar ? (
        <p className="tarjeta" style={{ marginTop: "var(--sp-5)" }}>
          Ya has entrado. Elige una contraseña nueva abajo, en{" "}
          <strong>Cambiar la contraseña</strong>.
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

        <div className="campo">
          <label htmlFor="fecha_nacimiento">Fecha de nacimiento</label>
          <input
            id="fecha_nacimiento"
            name="fecha_nacimiento"
            type="date"
            defaultValue={perfil.fecha_nacimiento ?? ""}
            required
            aria-describedby="ayuda-edad"
          />
          <span id="ayuda-edad" className="ayuda">
            No se muestra a nadie. Hace falta porque comprar y vender son
            contratos y hay que ser mayor de edad.
          </span>
        </div>

        {/* Retirar el consentimiento tiene que ser tan fácil como darlo:
            desmarcar y guardar. Lo exige el RGPD y lo promete la política
            de privacidad. */}
        <label>
          <input
            type="checkbox"
            name="acepta_marketing"
            defaultChecked={perfil.acepta_marketing}
          />
          <span>
            Quiero recibir avisos por correo de novedades y consejos.
            Desmárcalo y guarda para dejar de recibirlos.
          </span>
        </label>

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
