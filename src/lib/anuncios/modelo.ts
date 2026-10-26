/*
 * Las listas cerradas del anuncio.
 *
 * Misma norma que con las tallas y las provincias: nada de texto libre. Si
 * la categoría fuera texto, "pijama", "Pijamas" y "pijamitas" serían tres
 * cosas distintas, el filtro no funcionaría y las direcciones públicas del
 * catálogo se vendrían abajo.
 *
 * Cada lista tiene su copia en la migración 0008 y una prueba comprueba
 * que no se separen.
 */

export type TipoAnuncio = "prenda" | "lote";

export type SituacionAnuncio = "activa" | "reservada" | "vendida" | "retirada";

export type GeneroPrenda = "nina" | "nino" | "unisex";

/** Si la prenda viene grande o pequeña para su talla. Es la queja número
 *  dos de los usuarios de las plataformas generalistas. */
export type AjusteDeTalla = "pequena" | "normal" | "grande";

export interface OpcionConEtiqueta {
  codigo: string;
  etiqueta: string;
}

/** Los cuatro niveles, explicados con palabras y no solo nombrados: una
 *  madre tiene que saber qué está comprando sin tener que adivinarlo. */
export const ESTADOS_DE_CONSERVACION: readonly OpcionConEtiqueta[] = [
  { codigo: "nuevo-con-etiqueta", etiqueta: "Nuevo, con la etiqueta puesta" },
  { codigo: "como-nuevo", etiqueta: "Como nuevo — usado dos o tres veces" },
  { codigo: "buen-estado", etiqueta: "Buen estado — usado, sin desperfectos" },
  { codigo: "con-senales-de-uso", etiqueta: "Con señales de uso" },
];

export const TEMPORADAS: readonly OpcionConEtiqueta[] = [
  { codigo: "verano", etiqueta: "Verano" },
  { codigo: "invierno", etiqueta: "Invierno" },
  { codigo: "entretiempo", etiqueta: "Entretiempo" },
  { codigo: "todo-el-ano", etiqueta: "Todo el año" },
];

export const GENEROS: readonly OpcionConEtiqueta[] = [
  { codigo: "nina", etiqueta: "Niña" },
  { codigo: "nino", etiqueta: "Niño" },
  { codigo: "unisex", etiqueta: "Unisex" },
];

export const AJUSTES_DE_TALLA: readonly OpcionConEtiqueta[] = [
  { codigo: "pequena", etiqueta: "Talla pequeño" },
  { codigo: "normal", etiqueta: "Talla normal" },
  { codigo: "grande", etiqueta: "Talla grande" },
];

/**
 * Las categorías de ropa infantil. El código va en la dirección pública
 * (`/ropa/vestidos`), así que no lleva acentos ni espacios.
 */
export const CATEGORIAS: readonly OpcionConEtiqueta[] = [
  { codigo: "bodies", etiqueta: "Bodies" },
  { codigo: "camisetas", etiqueta: "Camisetas" },
  { codigo: "pantalones", etiqueta: "Pantalones" },
  { codigo: "vestidos", etiqueta: "Vestidos" },
  { codigo: "faldas", etiqueta: "Faldas" },
  { codigo: "jerseis", etiqueta: "Jerséis" },
  { codigo: "sudaderas", etiqueta: "Sudaderas" },
  { codigo: "abrigos", etiqueta: "Abrigos y chaquetas" },
  { codigo: "pijamas", etiqueta: "Pijamas" },
  { codigo: "conjuntos", etiqueta: "Conjuntos" },
  { codigo: "ropa-interior", etiqueta: "Ropa interior" },
  { codigo: "calcetines", etiqueta: "Calcetines y medias" },
  { codigo: "gorros", etiqueta: "Gorros y accesorios" },
  { codigo: "banadores", etiqueta: "Bañadores" },
  { codigo: "calzado", etiqueta: "Calzado" },
  { codigo: "canastilla", etiqueta: "Canastilla de recién nacido" },
  { codigo: "otros", etiqueta: "Otros" },
];

function existe(lista: readonly OpcionConEtiqueta[], codigo: string): boolean {
  return lista.some((o) => o.codigo === codigo);
}

export const esCategoria = (c: string) => existe(CATEGORIAS, c);
export const esEstado = (c: string) => existe(ESTADOS_DE_CONSERVACION, c);
export const esTemporada = (c: string) => existe(TEMPORADAS, c);
export const esGenero = (c: string) => existe(GENEROS, c);
export const esAjuste = (c: string) => existe(AJUSTES_DE_TALLA, c);

/** Qué se le muestra a la persona para un código dado. */
export function etiquetaDe(
  lista: readonly OpcionConEtiqueta[],
  codigo: string,
): string | null {
  return lista.find((o) => o.codigo === codigo)?.etiqueta ?? null;
}
