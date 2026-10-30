"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/*
 * La barra de abajo, fija, que pide la sección 8 del diseño.
 *
 * Con el botón de publicar destacado y en color de acento, porque es el
 * motor del catálogo: sin gente publicando no hay nada que enseñar, y en
 * un móvil el pulgar llega abajo mucho mejor que arriba.
 *
 * Los cinco destinos de la especificación. Si los mensajes todavía no
 * están disponibles, su pantalla lo dice con todas las letras en vez de
 * enseñar una bandeja vacía que haría pensar que nadie ha escrito.
 *
 * Es de cliente solo para saber en qué página estamos y decirlo con
 * aria-current, que es lo que permite a un lector de pantalla situar a
 * quien no ve el resaltado.
 */

interface Destino {
  href: string;
  texto: string;
  icono: string;
  destacado?: boolean;
}

const DESTINOS: readonly Destino[] = [
  { href: "/", texto: "Inicio", icono: "casa" },
  { href: "/buscar", texto: "Buscar", icono: "lupa" },
  { href: "/publicar", texto: "Publicar", icono: "mas", destacado: true },
  { href: "/mensajes", texto: "Mensajes", icono: "sobre" },
  { href: "/perfil", texto: "Cuenta", icono: "persona" },
];

function Icono({ nombre }: { nombre: string }) {
  const comun = {
    width: 24,
    height: 24,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  if (nombre === "casa") {
    return (
      <svg {...comun}>
        <path d="M3 10.5 12 3l9 7.5" />
        <path d="M5 9.5V21h14V9.5" />
      </svg>
    );
  }
  if (nombre === "lupa") {
    return (
      <svg {...comun}>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
    );
  }
  if (nombre === "sobre") {
    return (
      <svg {...comun}>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 7 9 6 9-6" />
      </svg>
    );
  }
  if (nombre === "mas") {
    return (
      <svg {...comun}>
        <path d="M12 5v14M5 12h14" />
      </svg>
    );
  }
  return (
    <svg {...comun}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.6-6 8-6s8 2 8 6" />
    </svg>
  );
}

export function BarraDeAbajo() {
  const ruta = usePathname();

  return (
    <nav className="barra-abajo" aria-label="Secciones">
      {DESTINOS.map((destino) => {
        const aqui =
          destino.href === "/" ? ruta === "/" : ruta.startsWith(destino.href);
        return (
          <Link
            key={destino.href}
            href={destino.href}
            className={destino.destacado ? "destino destacado" : "destino"}
            aria-current={aqui ? "page" : undefined}
          >
            <Icono nombre={destino.icono} />
            <span>{destino.texto}</span>
          </Link>
        );
      })}
    </nav>
  );
}
