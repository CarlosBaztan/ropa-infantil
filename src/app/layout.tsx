import type { Metadata, Viewport } from "next";
import { BarraDeAbajo } from "@/components/BarraDeAbajo";
import { Cabecera } from "@/components/Cabecera";
import { PieLegal } from "@/components/PieLegal";
import { sitio } from "@/lib/sitio";
import "./globals.css";

/*
 * No se carga ninguna fuente web a propósito. La tipografía sale de la pila
 * del sistema (ver --font-cuerpo en globals.css): no añade una llamada de red
 * a cada compilación, el visitante no descarga nada, y evita ceder su IP a un
 * tercero, que es justo lo que el informe legal nos pide no hacer.
 * Si algún día se quiere Inter exacta, se aloja el archivo aquí mismo.
 */

export const metadata: Metadata = {
  /*
   * Hace falta para que las direcciones de las imágenes de compartir y
   * las canónicas salgan enteras. Sin esto, Next las escribe relativas
   * y WhatsApp no sabe de dónde bajarse la imagen: el enlace se comparte
   * pelado, sin nada que mirar.
   */
  metadataBase: new URL(sitio()),
  title: "Ropa de bebé y niño de segunda mano entre familias",
  description:
    "Compra y vende lotes de ropa infantil por talla y temporada. Entrega en mano sin gastos de envío.",
};

/* Explícito para que nadie añada maximum-scale y bloquee la ampliación. */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  /*
   * El color de la barra del móvil, que se pinta del mismo color que la
   * página en vez de quedarse blanca encima de un fondo oscuro. Van los
   * dos modos porque el sistema visual también los tiene: con uno solo,
   * la mitad de la gente ve una franja que no pega con nada.
   */
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fffcf8" },
    { media: "(prefers-color-scheme: dark)", color: "#10161a" },
  ],
};

export default function DisposicionRaiz({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>
        {/* Primer elemento enfocable: permite saltarse la navegación. */}
        <a href="#contenido" className="salto-contenido">
          Ir al contenido
        </a>
        <Cabecera />
        <main id="contenido" style={{ scrollMarginTop: "var(--sp-4)" }}>
          {children}
        </main>
        <PieLegal />
        <BarraDeAbajo />
      </body>
    </html>
  );
}
