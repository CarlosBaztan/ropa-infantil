import type { Metadata } from "next";
import Link from "next/link";
import { faltanDatosDelTitular } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Condiciones de uso",
  robots: faltanDatosDelTitular() ? { index: false, follow: false } : undefined,
};

const PROHIBIDO = [
  "Ropa infantil con cordones o cintas en la capucha, el cuello o el pecho. No es una manía nuestra: hay una norma específica (UNE-EN 14682) porque esos cordones han causado estrangulamientos.",
  "Sillas de coche, cascos y portabebés. No se puede saber si han sufrido un golpe, y un asiento que ha tenido un accidente ya no protege.",
  "Cunas, colchones, nidos, reductores y barreras de cama.",
  "Chupetes, tetinas, biberones y sacaleches.",
  "Leche de fórmula y alimentos infantiles.",
  "Cosmética y productos de higiene abiertos o empezados.",
  "Cualquier artículo que esté retirado del mercado por una alerta de seguridad.",
];

function Seccion({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section style={{ marginTop: "var(--sp-8)" }}>
      <h2 style={{ fontSize: "var(--fs-xl)" }}>{titulo}</h2>
      <div style={{ marginTop: "var(--sp-3)" }}>{children}</div>
    </section>
  );
}

export default function Condiciones() {
  return (
    <>
      <h1 style={{ fontSize: "var(--fs-2xl)", lineHeight: "var(--lh-tight)" }}>
        Condiciones de uso
      </h1>
      <p className="ayuda" style={{ marginTop: "var(--sp-2)" }}>
        Al crear una cuenta aceptas estas normas. Están escritas para que se
        entiendan.
      </p>

      <Seccion titulo="Quién puede usar la plataforma">
        <p>
          Personas mayores de 18 años. No es un capricho: comprar y vender
          son contratos, y un menor no puede obligarse por sí mismo. Si
          detectamos una cuenta de alguien menor de edad, la cerramos.
        </p>
        <p style={{ marginTop: "var(--sp-3)" }}>
          Cada persona tiene una sola cuenta y responde de lo que pasa en
          ella. Hay que verificar el correo antes de poder publicar.
        </p>
      </Seccion>

      <Seccion titulo="Fotos: la prenda sola, sin personas">
        <p>
          <strong>
            No se pueden subir fotografías en las que aparezca una persona, y
            muy especialmente un niño o una niña.
          </strong>{" "}
          Fotografía la prenda sola, sobre una superficie lisa o colgada.
        </p>
        <p style={{ marginTop: "var(--sp-3)" }}>
          La imagen de un menor identificable es un dato personal de un
          tercero y publicarla sin consentimiento tiene consecuencias serias.
          Retiramos de inmediato cualquier foto así, sin avisar antes, y hay
          un motivo de denuncia específico para ello.
        </p>
        <p style={{ marginTop: "var(--sp-3)" }}>
          Las fotos tienen que ser tuyas y de la prenda real que vendes, no
          imágenes sacadas del catálogo de una tienda.
        </p>
      </Seccion>

      <Seccion titulo="Qué no se puede vender aquí">
        <p>
          Hay artículos infantiles que no admitimos aunque estén en perfecto
          estado, porque de segunda mano no se puede comprobar si siguen
          siendo seguros:
        </p>
        <ul style={{ marginTop: "var(--sp-3)", paddingLeft: "var(--sp-5)" }}>
          {PROHIBIDO.map((linea) => (
            <li key={linea} style={{ marginTop: "var(--sp-2)" }}>
              {linea}
            </li>
          ))}
        </ul>
      </Seccion>

      <Seccion titulo="La plataforma no es parte en la compraventa">
        <p>
          Ponemos en contacto a las personas. El acuerdo es entre comprador y
          vendedor: el precio, el estado de la prenda, la entrega y el pago
          los arreglan ellos.
        </p>
        <p style={{ marginTop: "var(--sp-3)" }}>
          <strong>
            En una compra entre particulares no hay derecho de desistimiento
            ni garantía legal
          </strong>
          , que son derechos que la ley te da solo frente a una empresa. Por
          eso insistimos en describir los defectos con honestidad y en
          preguntar todo lo que haga falta antes de cerrar el trato.
        </p>
      </Seccion>

      <Seccion titulo="Entregas y envíos">
        <p>
          Recomendamos la entrega en mano en un lugar público. Si acordáis un
          envío, lo organizáis vosotros: la plataforma no cobra, no retiene
          el dinero ni gestiona el paquete, así que tampoco puede mediar si
          algo sale mal. Ten eso en cuenta antes de pagar a alguien que no
          conoces.
        </p>
      </Seccion>

      <Seccion titulo="Denuncias y moderación">
        <p>
          En cada anuncio, perfil y conversación hay un botón para denunciar.
          Revisamos lo que se denuncia y, cuando retiramos algo o cerramos una
          cuenta, explicamos por qué a quien ha denunciado y a quien ha sido
          afectado.
        </p>
        <p style={{ marginTop: "var(--sp-3)" }}>
          Retiramos el contenido que incumpla estas normas o la ley, y
          cerramos las cuentas que lo hagan de forma repetida o grave. Si
          sospechamos de un delito que ponga en peligro a una persona, lo
          comunicamos a las autoridades.
        </p>
      </Seccion>

      <Seccion titulo="Cambios en estas condiciones">
        <p>
          Si cambian, avisamos y pedimos que las aceptes de nuevo. Guardamos
          qué versión aceptó cada persona y cuándo.
        </p>
      </Seccion>

      <p style={{ marginTop: "var(--sp-8)" }}>
        Cómo tratamos tus datos se explica en la{" "}
        <Link href="/legal/privacidad">política de privacidad</Link>.
      </p>
    </>
  );
}
