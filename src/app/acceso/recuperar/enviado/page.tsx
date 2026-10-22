import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Enlace enviado",
  robots: { index: false },
};

export default function EnlaceEnviado() {
  return (
    <div className="pagina">
      <h1 style={{ fontSize: "var(--fs-2xl)", lineHeight: "var(--lh-tight)" }}>
        Enlace enviado
      </h1>
      <p style={{ marginTop: "var(--sp-4)" }}>
        Si ese correo tiene una cuenta aquí, le hemos enviado un enlace para
        entrar y cambiar la contraseña.
      </p>
      <p className="ayuda" style={{ marginTop: "var(--sp-4)" }}>
        Decimos &laquo;si tiene cuenta&raquo; a propósito: confirmar quién
        está registrado permitiría a cualquiera averiguarlo probando correos.
      </p>
      <p style={{ marginTop: "var(--sp-8)" }}>
        <Link href="/acceso">Volver</Link>
      </p>
    </div>
  );
}
