/*
 * Genera la imagen que se ve al compartir un enlace del sitio en
 * WhatsApp, que es por donde se va a mover esto.
 *
 *   node scripts/generar-imagen-para-compartir.mjs
 *
 * Deja src/app/opengraph-image.png, que Next sirve solo para cualquier
 * página que no traiga la suya. Las fichas de anuncio sí traen la suya
 * —la foto de la prenda, que es mucho mejor reclamo que cualquier
 * cartel—, así que esta sale en la portada, en las páginas de talla y
 * en las de categoría.
 *
 * Es un guion y no una imagen hecha a mano porque el nombre del
 * proyecto todavía no está decidido: el día que lo esté, se cambia el
 * texto de aquí y se vuelve a ejecutar.
 *
 * Usa sharp, que viene con Next. Si algún día deja de venir, hay que
 * instalarlo: npm i -D sharp
 */

import { readFileSync, writeFileSync } from "node:fs";
import sharp from "sharp";

const FONDO = "#fffcf8";
const TINTA = "#1c2420";
const SUAVE = "#5a6460";
const VERDE = "#0f6b5c";
const TERRACOTA = "#a94b32";

const TITULO = ["Ropa de bebé y niño,", "entre familias"];
const BAJADA = "Lotes por talla y temporada. Entrega en mano, sin portes.";

/*
 * La percha, del mismo archivo que el icono del navegador, para que no
 * haya dos dibujos que se puedan separar. Hay que ponerle un tamano
 * explicito: un <svg> metido dentro de otro sin width ni height ocupa el
 * cartel entero, y la primera version salio con una mancha verde gigante
 * donde tenia que haber una percha pequena.
 */
const percha = readFileSync(new URL("../src/app/icon.svg", import.meta.url))
  .toString()
  .replace(/<\?xml[^>]*\?>/, "")
  .replace(/^[\s\S]*?<svg/, "<svg")
  .replace("<svg", '<svg width="104" height="104"')
  .trim();

const cartel = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <rect width="1200" height="630" fill="${FONDO}"/>
  <rect x="0" y="0" width="1200" height="14" fill="${VERDE}"/>
  <g transform="translate(80, 104)">${percha}</g>
  <text x="80" y="330" font-family="Segoe UI, Arial, sans-serif"
        font-size="76" font-weight="700" fill="${TINTA}">${TITULO[0]}</text>
  <text x="80" y="424" font-family="Segoe UI, Arial, sans-serif"
        font-size="76" font-weight="700" fill="${TINTA}">${TITULO[1]}</text>
  <text x="80" y="508" font-family="Segoe UI, Arial, sans-serif"
        font-size="34" fill="${SUAVE}">${BAJADA}</text>
  <rect x="80" y="548" width="120" height="8" rx="4" fill="${TERRACOTA}"/>
</svg>`;

const salida = new URL("../src/app/opengraph-image.png", import.meta.url);
const png = await sharp(Buffer.from(cartel)).png().toBuffer();
writeFileSync(salida, png);

console.log(`Escrita ${salida.pathname} (${png.length} bytes)`);
