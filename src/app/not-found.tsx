import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Esta página no existe",
  robots: { index: false },
};

/*
 * La página de error propia. Sin ella, Next muestra la suya, que está en
 * inglés: un visitante perdido en una web española se encontraba con
 * "This page could not be found".
 */
export default function NoEncontrada() {
  return (
    <div className="pagina">
      <h1 style={{ fontSize: "var(--fs-2xl)", lineHeight: "var(--lh-tight)" }}>
        Esta página no existe
      </h1>
      <p style={{ marginTop: "var(--sp-4)" }}>
        Puede que el enlace esté mal escrito, o que lo que buscabas ya se
        haya vendido y lo hayamos retirado.
      </p>
      <p style={{ marginTop: "var(--sp-6)" }}>
        <Link href="/">Volver al inicio</Link>
      </p>
    </div>
  );
}
