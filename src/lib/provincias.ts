/*
 * Las 52 provincias españolas, como lista cerrada.
 *
 * Igual que las tallas: si la provincia fuera texto libre, "Bizkaia",
 * "Vizcaya" y "bizkaia" serían tres sitios distintos y el filtro por zona
 * no funcionaría. El código es el oficial del INE; el slug va en las
 * direcciones públicas (/ropa-segunda-mano/<slug>).
 */

export interface Provincia {
  codigo: string;
  nombre: string;
  slug: string;
}

export const PROVINCIAS: readonly Provincia[] = [
  { codigo: "01", nombre: "Álava", slug: "alava" },
  { codigo: "02", nombre: "Albacete", slug: "albacete" },
  { codigo: "03", nombre: "Alicante", slug: "alicante" },
  { codigo: "04", nombre: "Almería", slug: "almeria" },
  { codigo: "05", nombre: "Ávila", slug: "avila" },
  { codigo: "06", nombre: "Badajoz", slug: "badajoz" },
  { codigo: "07", nombre: "Illes Balears", slug: "illes-balears" },
  { codigo: "08", nombre: "Barcelona", slug: "barcelona" },
  { codigo: "09", nombre: "Burgos", slug: "burgos" },
  { codigo: "10", nombre: "Cáceres", slug: "caceres" },
  { codigo: "11", nombre: "Cádiz", slug: "cadiz" },
  { codigo: "12", nombre: "Castellón", slug: "castellon" },
  { codigo: "13", nombre: "Ciudad Real", slug: "ciudad-real" },
  { codigo: "14", nombre: "Córdoba", slug: "cordoba" },
  { codigo: "15", nombre: "A Coruña", slug: "a-coruna" },
  { codigo: "16", nombre: "Cuenca", slug: "cuenca" },
  { codigo: "17", nombre: "Girona", slug: "girona" },
  { codigo: "18", nombre: "Granada", slug: "granada" },
  { codigo: "19", nombre: "Guadalajara", slug: "guadalajara" },
  { codigo: "20", nombre: "Gipuzkoa", slug: "gipuzkoa" },
  { codigo: "21", nombre: "Huelva", slug: "huelva" },
  { codigo: "22", nombre: "Huesca", slug: "huesca" },
  { codigo: "23", nombre: "Jaén", slug: "jaen" },
  { codigo: "24", nombre: "León", slug: "leon" },
  { codigo: "25", nombre: "Lleida", slug: "lleida" },
  { codigo: "26", nombre: "La Rioja", slug: "la-rioja" },
  { codigo: "27", nombre: "Lugo", slug: "lugo" },
  { codigo: "28", nombre: "Madrid", slug: "madrid" },
  { codigo: "29", nombre: "Málaga", slug: "malaga" },
  { codigo: "30", nombre: "Murcia", slug: "murcia" },
  { codigo: "31", nombre: "Navarra", slug: "navarra" },
  { codigo: "32", nombre: "Ourense", slug: "ourense" },
  { codigo: "33", nombre: "Asturias", slug: "asturias" },
  { codigo: "34", nombre: "Palencia", slug: "palencia" },
  { codigo: "35", nombre: "Las Palmas", slug: "las-palmas" },
  { codigo: "36", nombre: "Pontevedra", slug: "pontevedra" },
  { codigo: "37", nombre: "Salamanca", slug: "salamanca" },
  { codigo: "38", nombre: "Santa Cruz de Tenerife", slug: "santa-cruz-de-tenerife" },
  { codigo: "39", nombre: "Cantabria", slug: "cantabria" },
  { codigo: "40", nombre: "Segovia", slug: "segovia" },
  { codigo: "41", nombre: "Sevilla", slug: "sevilla" },
  { codigo: "42", nombre: "Soria", slug: "soria" },
  { codigo: "43", nombre: "Tarragona", slug: "tarragona" },
  { codigo: "44", nombre: "Teruel", slug: "teruel" },
  { codigo: "45", nombre: "Toledo", slug: "toledo" },
  { codigo: "46", nombre: "Valencia", slug: "valencia" },
  { codigo: "47", nombre: "Valladolid", slug: "valladolid" },
  { codigo: "48", nombre: "Bizkaia", slug: "bizkaia" },
  { codigo: "49", nombre: "Zamora", slug: "zamora" },
  { codigo: "50", nombre: "Zaragoza", slug: "zaragoza" },
  { codigo: "51", nombre: "Ceuta", slug: "ceuta" },
  { codigo: "52", nombre: "Melilla", slug: "melilla" },
];

export function provinciaPorCodigo(codigo: string): Provincia | null {
  return PROVINCIAS.find((p) => p.codigo === codigo) ?? null;
}

/** La provincia de una direccion como /ropa-segunda-mano/alicante. */
export function provinciaPorSlug(slug: string): Provincia | null {
  return PROVINCIAS.find((p) => p.slug === slug.toLowerCase()) ?? null;
}

export function esCodigoDeProvincia(codigo: string): boolean {
  return PROVINCIAS.some((p) => p.codigo === codigo);
}
