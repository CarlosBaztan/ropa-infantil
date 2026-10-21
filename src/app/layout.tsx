import type { Metadata } from "next";
import "./globals.css";

/*
 * No se carga ninguna fuente web a propósito. La tipografía sale de la pila
 * del sistema (ver --font-cuerpo en globals.css): no añade una llamada de red
 * a cada compilación, el visitante no descarga nada, y evita ceder su IP a un
 * tercero, que es justo lo que el informe legal nos pide no hacer.
 * Si algún día se quiere Inter exacta, se aloja el archivo aquí mismo.
 */

export const metadata: Metadata = {
  title: "Ropa de bebé y niño de segunda mano entre familias",
  description:
    "Compra y vende lotes de ropa infantil por talla y temporada. Entrega en mano sin gastos de envío.",
};

export default function DisposicionRaiz({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
