/*
 * Preparar una foto antes de subirla.
 *
 * Hace dos cosas con un solo gesto: la reduce de tamaño y le quita TODOS
 * los metadatos. No hace falta ninguna librería que "limpie EXIF": al
 * volver a dibujar la imagen en un lienzo, lo único que sobrevive son los
 * píxeles. Las coordenadas GPS que el móvil incrusta en cada foto se
 * quedan por el camino, que es justo lo que se busca: publicarlas sería
 * publicar dónde vive una familia con niños pequeños.
 */

/** Lado largo máximo. Suficiente para una ficha; una foto de 12 megapíxeles
 *  pesa varios megas y no aporta nada en una tarjeta de catálogo. */
export const LADO_MAXIMO = 1600;

export interface Tamano {
  ancho: number;
  alto: number;
}

/**
 * El tamaño al que hay que dibujar, conservando la proporción. Devuelve
 * null si las dimensiones no tienen sentido.
 *
 * Nunca agranda: estirar una foto pequeña no añade detalle, solo peso.
 */
export function calcularTamano(ancho: number, alto: number): Tamano | null {
  if (
    !Number.isFinite(ancho) ||
    !Number.isFinite(alto) ||
    ancho <= 0 ||
    alto <= 0
  ) {
    return null;
  }

  const ladoLargo = Math.max(ancho, alto);
  if (ladoLargo <= LADO_MAXIMO) {
    return { ancho: Math.round(ancho), alto: Math.round(alto) };
  }

  const factor = LADO_MAXIMO / ladoLargo;
  return {
    // Un lado nunca puede quedar en cero por muy estrecha que sea la foto.
    ancho: Math.max(1, Math.round(ancho * factor)),
    alto: Math.max(1, Math.round(alto * factor)),
  };
}

export interface FotoPreparada {
  blob: Blob;
  ancho: number;
  alto: number;
}

/**
 * Redimensiona y re-codifica la foto en el navegador. Solo funciona en el
 * navegador: usa el lienzo.
 */
export async function prepararFoto(archivo: File): Promise<FotoPreparada> {
  const imagen = await createImageBitmap(archivo);
  try {
    const tamano = calcularTamano(imagen.width, imagen.height);
    if (!tamano) throw new Error("La imagen no tiene un tamaño válido");

    const lienzo = document.createElement("canvas");
    lienzo.width = tamano.ancho;
    lienzo.height = tamano.alto;

    const pincel = lienzo.getContext("2d");
    if (!pincel) throw new Error("Este navegador no permite procesar imágenes");

    // Aquí es donde se pierden los metadatos: lo que se dibuja son
    // píxeles, y lo que se exporta después solo contiene píxeles.
    pincel.drawImage(imagen, 0, 0, tamano.ancho, tamano.alto);

    const blob = await new Promise<Blob | null>((resolver) =>
      lienzo.toBlob(resolver, "image/webp", 0.82),
    );
    if (!blob) throw new Error("No se ha podido preparar la imagen");

    return { blob, ancho: tamano.ancho, alto: tamano.alto };
  } finally {
    imagen.close();
  }
}
