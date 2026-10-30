"use client";

import { useEffect, useRef } from "react";

/*
 * Un aviso que, además de verse, se lee y recoge el foco.
 *
 * Después de una acción de servidor —marcar vendido, retirar, borrar— el
 * botón que se pulsó desaparece, porque el anuncio cambia de grupo. El
 * foco se cae entonces al principio del documento: con ocho anuncios,
 * volver donde estabas son veinte tabulaciones.
 *
 * Y hay un segundo problema que no se ve: el redirect de una acción de
 * servidor no recarga la página, repinta. Un aviso que nace ya con su
 * texto dentro no se anuncia de forma fiable —una región en vivo tiene
 * que existir ANTES de que su contenido cambie—, así que quien no ve la
 * pantalla pulsaba «Sí, lo he vendido» y no recibía confirmación de
 * nada.
 *
 * Llevar el foco aquí resuelve las dos cosas con un solo gesto, y por
 * eso no lleva role="status": al mover el foco el lector ya lo lee, y
 * las dos cosas juntas lo dirían dos veces.
 */
export function AvisoConFoco({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const caja = useRef<HTMLDivElement>(null);

  useEffect(() => {
    caja.current?.focus();
  }, []);

  return (
    <div
      ref={caja}
      tabIndex={-1}
      className={className}
      style={{ marginTop: "var(--sp-5)" }}
    >
      {children}
    </div>
  );
}
