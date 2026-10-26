import type { Metadata } from "next";
import Link from "next/link";
import { BotonGoogle } from "@/components/BotonGoogle";
import { registrar } from "./acciones";

export const metadata: Metadata = {
  title: "Crear una cuenta",
  description:
    "Regístrate para publicar la ropa que tus hijos ya no usan y encontrar la talla siguiente.",
};

export default async function Registro({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="pagina">
      <h1 style={{ fontSize: "var(--fs-2xl)", lineHeight: "var(--lh-tight)" }}>
        Crear una cuenta
      </h1>
      <p className="ayuda" style={{ marginTop: "var(--sp-2)" }}>
        Para mirar el catálogo no hace falta cuenta. Se pide para publicar,
        guardar y escribir.
      </p>

      {/* role="alert" para que un lector de pantalla lo anuncie al volver */}
      {error ? (
        <p
          role="alert"
          className="aviso-error"
          style={{ marginTop: "var(--sp-5)" }}
        >
          {error}
        </p>
      ) : null}

      <div className="pila" style={{ marginTop: "var(--sp-6)" }}>
        <BotonGoogle texto="Crear cuenta con Google" />
      </div>

      <form action={registrar} className="pila" style={{ marginTop: "var(--sp-4)" }}>
        <div className="campo">
          <label htmlFor="correo">Correo electrónico</label>
          <input
            id="correo"
            name="correo"
            type="email"
            autoComplete="email"
            required
          />
        </div>

        <div className="campo">
          <label htmlFor="contrasena">Contraseña</label>
          <input
            id="contrasena"
            name="contrasena"
            type="password"
            autoComplete="new-password"
            minLength={10}
            required
            aria-describedby="ayuda-contrasena"
          />
          <span id="ayuda-contrasena" className="ayuda">
            Al menos 10 caracteres.
          </span>
        </div>

        <div className="campo">
          <label htmlFor="fecha_nacimiento">Fecha de nacimiento</label>
          <input
            id="fecha_nacimiento"
            name="fecha_nacimiento"
            type="date"
            required
            aria-describedby="ayuda-edad"
          />
          <span id="ayuda-edad" className="ayuda">
            Hay que ser mayor de edad: comprar y vender son contratos.
          </span>
        </div>

        {/*
          Casilla separada y desmarcada, solo para marketing. NO existe una
          casilla de "acepto la política de privacidad": la privacidad se
          informa, no se consiente. Es el error más común del sector.
        */}
        <label>
          <input type="checkbox" name="acepta_marketing" />
          <span>
            Quiero recibir avisos por correo de novedades y consejos. Puedes
            darte de baja cuando quieras.
          </span>
        </label>

        <button type="submit" className="boton">
          Crear cuenta
        </button>

        <p className="ayuda">
          Al crear la cuenta aceptas las{" "}
          <Link href="/legal/condiciones">condiciones de uso</Link>. Tratamos
          tus datos como se explica en la{" "}
          <Link href="/legal/privacidad">política de privacidad</Link>.
        </p>
      </form>

      <p style={{ marginTop: "var(--sp-8)" }}>
        ¿Ya tienes cuenta? <Link href="/acceso">Entrar</Link>
      </p>
    </div>
  );
}
