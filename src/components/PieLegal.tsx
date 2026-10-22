import Link from "next/link";

/** Pie común. Los cuatro enlaces legales tienen que estar en toda página. */
export function PieLegal() {
  return (
    <footer
      style={{
        borderTop: "1px solid var(--c-border)",
        marginTop: "var(--sp-16)",
        padding: "var(--sp-6) var(--sp-4)",
      }}
    >
      <nav
        aria-label="Información legal"
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "var(--sp-4)",
          maxWidth: "44rem",
          margin: "0 auto",
        }}
      >
        <Link href="/legal/aviso-legal">Aviso legal</Link>
        <Link href="/legal/condiciones">Condiciones de uso</Link>
        <Link href="/legal/privacidad">Privacidad</Link>
        <Link href="/legal/cookies">Cookies</Link>
      </nav>
    </footer>
  );
}
