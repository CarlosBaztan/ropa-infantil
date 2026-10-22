import type { Metadata } from "next";
import Link from "next/link";
import { pedirEnlaceDeRecuperacion } from "../acciones";

export const metadata: Metadata = {
  title: "Recuperar la contraseña",
  robots: { index: false },
};

export default function Recuperar() {
  return (
    <div className="pagina">
      <h1 style={{ fontSize: "var(--fs-2xl)", lineHeight: "var(--lh-tight)" }}>
        Recuperar la contraseña
      </h1>
      <p className="ayuda" style={{ marginTop: "var(--sp-2)" }}>
        Te enviamos un enlace para que entres y puedas cambiarla.
      </p>

      <form
        action={pedirEnlaceDeRecuperacion}
        className="pila"
        style={{ marginTop: "var(--sp-6)" }}
      >
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
        <button type="submit" className="boton">
          Enviar el enlace
        </button>
      </form>

      <p style={{ marginTop: "var(--sp-8)" }}>
        <Link href="/acceso">Volver</Link>
      </p>
    </div>
  );
}
