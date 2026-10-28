/*
 * Las reglas de publicar, separadas de la pantalla para poder probarlas
 * sin navegador. La base de datos las vuelve a comprobar: esto solo sirve
 * para dar un mensaje que se entienda.
 */

import { aCentimos } from "@/lib/anuncios/precio";
import { esCategoria, esEstado, etiquetaDe, CATEGORIAS } from "@/lib/anuncios/modelo";
import { TALLAS, tallaPorCodigo } from "@/lib/tallas";
import type { Resultado } from "@/lib/validacion/perfil";

export interface EntradaAnuncio {
  tipo: "prenda" | "lote";
  titulo: string;
  talla: string;
  tallaHasta: string | null;
  numeroPiezas: number | null;
  categoria: string;
  estado: string;
  precio: string;
  aceptaEntregaMano: boolean;
  aceptaEnvio: boolean;
  numeroDeFotos: number;
}

const MAXIMO_FOTOS = 5;
const PIEZAS_MINIMAS_DE_UN_LOTE = 2;

function ordenDeTalla(codigo: string): number | null {
  return TALLAS.find((t) => t.codigo === codigo)?.orden ?? null;
}

export function validarAnuncio(
  entrada: EntradaAnuncio,
): Resultado<EntradaAnuncio> {
  if (entrada.numeroDeFotos < 1) {
    return { valido: false, error: "Hace falta al menos una foto." };
  }
  if (entrada.numeroDeFotos > MAXIMO_FOTOS) {
    return {
      valido: false,
      error: `No se pueden subir más de ${MAXIMO_FOTOS} fotos.`,
    };
  }

  const titulo = entrada.titulo.trim();
  if (titulo.length < 3) {
    return { valido: false, error: "El título es demasiado corto." };
  }
  if (titulo.length > 120) {
    return { valido: false, error: "El título es demasiado largo." };
  }

  const ordenDesde = ordenDeTalla(entrada.talla);
  if (ordenDesde === null) {
    return { valido: false, error: "Elige una talla de la lista." };
  }

  if (!esCategoria(entrada.categoria)) {
    return { valido: false, error: "Elige una categoría de la lista." };
  }
  if (!esEstado(entrada.estado)) {
    return { valido: false, error: "Elige en qué estado está." };
  }

  if (entrada.tipo === "lote") {
    if (
      entrada.numeroPiezas === null ||
      !Number.isInteger(entrada.numeroPiezas) ||
      entrada.numeroPiezas < PIEZAS_MINIMAS_DE_UN_LOTE
    ) {
      return {
        valido: false,
        error: `Un lote necesita al menos ${PIEZAS_MINIMAS_DE_UN_LOTE} piezas.`,
      };
    }
    if (entrada.tallaHasta !== null) {
      const ordenHasta = ordenDeTalla(entrada.tallaHasta);
      if (ordenHasta === null) {
        return { valido: false, error: "Elige una talla final de la lista." };
      }
      if (ordenHasta <= ordenDesde) {
        return {
          valido: false,
          error: "La talla final tiene que ser mayor que la inicial.",
        };
      }
    }
  } else {
    if (entrada.numeroPiezas !== null) {
      return {
        valido: false,
        error: "Una prenda suelta no lleva número de piezas.",
      };
    }
    if (entrada.tallaHasta !== null) {
      return {
        valido: false,
        error: "Una prenda suelta es de una sola talla.",
      };
    }
  }

  if (aCentimos(entrada.precio) === null) {
    return { valido: false, error: "Revisa el precio." };
  }

  if (!entrada.aceptaEntregaMano && !entrada.aceptaEnvio) {
    return {
      valido: false,
      error: "Elige al menos una forma de entrega: en mano, envío, o las dos.",
    };
  }

  return { valido: true, valor: { ...entrada, titulo } };
}

/**
 * El título que se propone solo, y que la persona puede cambiar.
 *
 * Existe porque redactar es donde la gente se bloquea y abandona: si al
 * llegar al título ya hay uno escrito, se sigue adelante.
 */
export function tituloSugerido(entrada: EntradaAnuncio): string {
  const talla = tallaPorCodigo(entrada.talla)?.etiqueta ?? null;
  const categoria = etiquetaDe(CATEGORIAS, entrada.categoria);
  if (!talla || !categoria) return "";

  if (entrada.tipo === "lote") {
    const piezas = entrada.numeroPiezas ?? 0;
    const hasta = entrada.tallaHasta
      ? tallaPorCodigo(entrada.tallaHasta)?.etiqueta ?? null
      : null;
    const rango = hasta ? `${talla} a ${hasta}` : talla;
    return `Lote de ${piezas} ${categoria.toLowerCase()} · talla ${rango}`;
  }

  return `${categoria} · talla ${talla}`;
}
