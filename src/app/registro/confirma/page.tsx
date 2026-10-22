import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Confirma tu correo",
  robots: { index: false },
};

export default function ConfirmaTuCorreo() {
  return (
    <div className="pagina">
      <h1 style={{ fontSize: "var(--fs-2xl)", lineHeight: "var(--lh-tight)" }}>
        Revisa tu correo
      </h1>
      <p style={{ marginTop: "var(--sp-4)" }}>
        Te hemos enviado un enlace. Ábrelo y tu cuenta quedará lista.
      </p>
      <p className="ayuda" style={{ marginTop: "var(--sp-4)" }}>
        Si no aparece en unos minutos, mira en la carpeta de correo no
        deseado. Hasta que no confirmes, no podrás entrar.
      </p>
      <p style={{ marginTop: "var(--sp-8)" }}>
        <Link href="/">Volver al inicio</Link>
      </p>
    </div>
  );
}
