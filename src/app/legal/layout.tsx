import {
  datosDelTitularQueFaltan,
  faltanDatosDelTitular,
  VERSION_LEGAL,
} from "@/lib/legal";

/*
 * Disposición común de los cuatro textos legales. Mientras falten los
 * datos del titular, las cuatro páginas muestran el aviso: así nadie las
 * da por buenas sin querer, y el aviso desaparece solo en cuanto se
 * rellenen en src/lib/legal.ts.
 */
export default function DisposicionLegal({
  children,
}: {
  children: React.ReactNode;
}) {
  const faltan = faltanDatosDelTitular();

  return (
    <div className="pagina" style={{ maxWidth: "44rem" }}>
      {faltan ? (
        <aside role="note" className="aviso-error">
          <span>
            <strong>Borrador sin publicar.</strong> Falta por rellenar:{" "}
            {datosDelTitularQueFaltan().join(", ")}. Este texto además tiene
            que revisarlo un abogado antes del lanzamiento.
          </span>
        </aside>
      ) : null}

      <article style={{ marginTop: "var(--sp-6)" }}>{children}</article>

      {/* Los enlaces a los otros textos los pone el pie de toda la web. */}
      <p className="ayuda" style={{ marginTop: "var(--sp-10)" }}>
        Versión {VERSION_LEGAL}.
      </p>
    </div>
  );
}
