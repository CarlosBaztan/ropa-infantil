import type { Metadata } from "next";
import { faltanDatosDelTitular, TITULAR } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Aviso legal",
  // Mientras falten los datos del titular, esta página no se ofrece a
  // Google: publicar un aviso legal incompleto es peor que no tenerlo.
  robots: faltanDatosDelTitular() ? { index: false, follow: false } : undefined,
};

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string | null }) {
  return (
    <p>
      <strong>{etiqueta}:</strong>{" "}
      {valor ?? <em>[pendiente de rellenar]</em>}
    </p>
  );
}

export default function AvisoLegal() {
  return (
    <>
      <h1 style={{ fontSize: "var(--fs-2xl)", lineHeight: "var(--lh-tight)" }}>
        Aviso legal
      </h1>

      <h2 style={{ fontSize: "var(--fs-xl)", marginTop: "var(--sp-8)" }}>
        Quién está detrás de esta web
      </h2>
      <p>
        La Ley 34/2002 de servicios de la sociedad de la información obliga a
        identificar a quien presta el servicio. Estos son los datos:
      </p>
      <div style={{ marginTop: "var(--sp-4)" }}>
        <Dato etiqueta="Titular" valor={TITULAR.nombre} />
        <Dato etiqueta="NIF" valor={TITULAR.nif} />
        <Dato etiqueta="Domicilio" valor={TITULAR.domicilio} />
        <Dato etiqueta="Correo de contacto" valor={TITULAR.correoDeContacto} />
      </div>

      <h2 style={{ fontSize: "var(--fs-xl)", marginTop: "var(--sp-8)" }}>
        Qué es este sitio
      </h2>
      <p>
        Una plataforma donde personas particulares publican ropa de bebé y
        niño de segunda mano y contactan entre ellas para comprarla y
        venderla.
      </p>

      <h2 style={{ fontSize: "var(--fs-xl)", marginTop: "var(--sp-8)" }}>
        No somos parte en las compraventas
      </h2>
      <p>
        Esta plataforma pone en contacto a las personas, pero{" "}
        <strong>no vende nada</strong> y no interviene en el acuerdo entre
        comprador y vendedor: ni en el precio, ni en el estado de la prenda,
        ni en la entrega, ni en el pago. El contrato es entre ellos dos.
      </p>
      <p style={{ marginTop: "var(--sp-3)" }}>
        Como intermediario, tampoco revisamos de antemano lo que publica cada
        persona. Sí retiramos el contenido que nos denuncien y resulte
        contrario a estas normas o a la ley, y damos una respuesta motivada a
        quien lo denuncia.
      </p>

      <h2 style={{ fontSize: "var(--fs-xl)", marginTop: "var(--sp-8)" }}>
        Contenido de la web
      </h2>
      <p>
        El diseño, los textos y el código de la plataforma pertenecen al
        titular. Las fotografías y descripciones de cada anuncio pertenecen a
        la persona que las publica, que nos autoriza a mostrarlas aquí
        mientras el anuncio esté activo.
      </p>

      <h2 style={{ fontSize: "var(--fs-xl)", marginTop: "var(--sp-8)" }}>
        Ley aplicable
      </h2>
      <p>
        Se aplica la legislación española. Si eres consumidor, puedes acudir a
        los tribunales de tu domicilio.
      </p>
    </>
  );
}
