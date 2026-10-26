import type { Metadata } from "next";
import Link from "next/link";
import { BotonGoogle } from "@/components/BotonGoogle";
import { entrar } from "./acciones";

export const metadata: Metadata = {
  title: "Entrar",
  robots: { index: false },
};

export default async function Acceso({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="pagina">
      <h1 style={{ fontSize: "var(--fs-2xl)", lineHeight: "var(--lh-tight)" }}>
        Entrar
      </h1>

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
        <BotonGoogle texto="Entrar con Google" />
      </div>

      <form action={entrar} className="pila" style={{ marginTop: "var(--sp-4)" }}>
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
            autoComplete="current-password"
            required
          />
        </div>

        <button type="submit" className="boton">
          Entrar
        </button>
      </form>

      <p style={{ marginTop: "var(--sp-6)" }}>
        <Link href="/acceso/recuperar">He olvidado la contraseña</Link>
      </p>
      <p style={{ marginTop: "var(--sp-4)" }}>
        ¿No tienes cuenta? <Link href="/registro">Crear una</Link>
      </p>
    </div>
  );
}
