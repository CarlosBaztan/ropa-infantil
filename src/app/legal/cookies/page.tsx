import type { Metadata } from "next";
import { faltanDatosDelTitular } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Política de cookies",
  robots: faltanDatosDelTitular() ? { index: false, follow: false } : undefined,
};

export default function Cookies() {
  return (
    <>
      <h1 style={{ fontSize: "var(--fs-2xl)", lineHeight: "var(--lh-tight)" }}>
        Política de cookies
      </h1>

      <p style={{ marginTop: "var(--sp-5)" }}>
        Esta web <strong>no tiene banner de cookies</strong>, y no es un
        descuido: es que no usa ninguna cookie que lo necesite.
      </p>

      <h2 style={{ fontSize: "var(--fs-xl)", marginTop: "var(--sp-8)" }}>
        Las únicas cookies que usamos
      </h2>
      <p>
        Las que mantienen tu sesión abierta cuando inicias sesión. Sin ellas
        tendrías que escribir la contraseña en cada página, así que la ley no
        exige pedir permiso para ponerlas. Se borran al cerrar sesión o al
        caducar.
      </p>

      <h2 style={{ fontSize: "var(--fs-xl)", marginTop: "var(--sp-8)" }}>
        Lo que no hacemos
      </h2>
      <ul style={{ marginTop: "var(--sp-3)", paddingLeft: "var(--sp-5)" }}>
        <li style={{ marginTop: "var(--sp-2)" }}>
          No usamos cookies de publicidad ni de redes sociales.
        </li>
        <li style={{ marginTop: "var(--sp-2)" }}>
          No te seguimos por otras webs.
        </li>
        <li style={{ marginTop: "var(--sp-2)" }}>
          No cargamos tipografías ni recursos de terceros, para que tu
          dirección IP no llegue a empresas con las que tú no has querido
          tratar.
        </li>
        <li style={{ marginTop: "var(--sp-2)" }}>
          Si algún día medimos visitas, será con una herramienta que no use
          cookies ni identifique a nadie. Si eso cambiara, aparecería aquí y
          te pediríamos permiso antes.
        </li>
      </ul>

      <h2 style={{ fontSize: "var(--fs-xl)", marginTop: "var(--sp-8)" }}>
        Cómo borrarlas
      </h2>
      <p>
        Desde los ajustes de tu navegador puedes ver y borrar las cookies de
        cualquier sitio. Si borras las nuestras, simplemente se cerrará tu
        sesión.
      </p>
    </>
  );
}
