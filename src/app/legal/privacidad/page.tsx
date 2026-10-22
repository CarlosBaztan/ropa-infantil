import type { Metadata } from "next";
import { faltanDatosDelTitular, TITULAR } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Política de privacidad",
  robots: faltanDatosDelTitular() ? { index: false, follow: false } : undefined,
};

const TRATAMIENTOS = [
  {
    para: "Crear y mantener tu cuenta",
    datos: "Correo, contraseña cifrada, fecha de nacimiento, alias, provincia y ciudad",
    base: "Ejecución del contrato: sin estos datos no hay cuenta",
    tiempo: "Mientras tengas la cuenta abierta",
  },
  {
    para: "Publicar anuncios y que otras personas te escriban",
    datos: "Lo que publicas y los mensajes que envías",
    base: "Ejecución del contrato",
    tiempo: "Mientras el anuncio esté activo; los mensajes, mientras dure la conversación",
  },
  {
    para: "Evitar fraudes, moderar y mantener la plataforma segura",
    datos: "Denuncias, decisiones de moderación y datos técnicos de acceso",
    base: "Interés legítimo en que esto sea un sitio seguro para familias",
    tiempo: "Un año desde la última incidencia",
  },
  {
    para: "Enviarte avisos comerciales",
    datos: "Correo",
    base: "Tu consentimiento, que das marcando la casilla y puedes retirar cuando quieras",
    tiempo: "Hasta que te des de baja",
  },
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

export default function Privacidad() {
  return (
    <>
      <h1 style={{ fontSize: "var(--fs-2xl)", lineHeight: "var(--lh-tight)" }}>
        Política de privacidad
      </h1>

      <Seccion titulo="Quién trata tus datos">
        <p>
          El titular de esta web, cuyos datos completos están en el{" "}
          <a href="/legal/aviso-legal">aviso legal</a>. Para cualquier asunto
          de privacidad, escribe a{" "}
          {TITULAR.correoDeContacto ?? <em>[correo pendiente]</em>}.
        </p>
      </Seccion>

      <Seccion titulo="Qué datos tratamos y por qué">
        <div style={{ overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", minWidth: "36rem" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "var(--sp-2)" }}>
                  Para qué
                </th>
                <th style={{ textAlign: "left", padding: "var(--sp-2)" }}>
                  Qué datos
                </th>
                <th style={{ textAlign: "left", padding: "var(--sp-2)" }}>
                  Con qué derecho
                </th>
                <th style={{ textAlign: "left", padding: "var(--sp-2)" }}>
                  Cuánto tiempo
                </th>
              </tr>
            </thead>
            <tbody>
              {TRATAMIENTOS.map((t) => (
                <tr key={t.para} style={{ borderTop: "1px solid var(--c-border)" }}>
                  <td style={{ padding: "var(--sp-2)" }}>{t.para}</td>
                  <td style={{ padding: "var(--sp-2)" }}>{t.datos}</td>
                  <td style={{ padding: "var(--sp-2)" }}>{t.base}</td>
                  <td style={{ padding: "var(--sp-2)" }}>{t.tiempo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Seccion>

      <Seccion titulo="Dónde están guardados">
        <p>
          En servidores situados en la Unión Europea, concretamente en
          Fráncfort. Usamos dos proveedores que tratan los datos por encargo
          nuestro y solo siguiendo nuestras instrucciones:{" "}
          <strong>Supabase</strong>, que guarda la base de datos y las
          fotografías, y <strong>Vercel</strong>, donde funciona la web.
        </p>
      </Seccion>

      <Seccion titulo="Las fotos y los menores">
        <p>
          Está prohibido subir fotografías en las que aparezcan personas, y
          en especial niños. Además,{" "}
          <strong>
            borramos los datos de localización que el móvil incrusta en cada
            foto
          </strong>{" "}
          antes de guardarla. Si no lo hiciéramos, cada imagen publicaría las
          coordenadas de la casa de una familia con niños pequeños.
        </p>
      </Seccion>

      <Seccion titulo="Qué puedes pedirnos">
        <p>
          Acceder a tus datos, corregirlos, borrarlos, llevártelos a otro
          sitio, limitar su uso y oponerte a que los tratemos. Escribe al
          correo de contacto y responderemos en un mes como máximo.
        </p>
        <p style={{ marginTop: "var(--sp-3)" }}>
          Si borras tu cuenta, retiramos tus anuncios y{" "}
          <strong>anonimizamos tus mensajes</strong>: la conversación sigue
          existiendo para la otra persona, pero sin tus datos. También puedes
          reclamar ante la Agencia Española de Protección de Datos.
        </p>
      </Seccion>

      <Seccion titulo="Nada de perfilado ni de decisiones automáticas">
        <p>
          No elaboramos perfiles tuyos, no te mostramos publicidad
          personalizada y ninguna decisión que te afecte se toma de forma
          automática.
        </p>
      </Seccion>
    </>
  );
}
