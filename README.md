# Ropa infantil de segunda mano

Plataforma española donde madres y padres venden la ropa que sus hijos ya no
usan y compran la talla siguiente. Compraventa entre particulares, con el
**lote por talla y temporada** como unidad de venta y la **entrega en mano**
como opción destacada.

## Por dónde empezar a leer

| Documento | Qué contiene |
|---|---|
| [`docs/analisis/`](docs/analisis/) | Análisis de viabilidad: mercado, competencia, riesgos, gastos y burocracia. **Incluye el criterio escrito de cuándo abandonar.** |
| [`docs/superpowers/specs/`](docs/superpowers/specs/) | El diseño del hito 1: qué se construye y por qué |
| [`docs/superpowers/plans/`](docs/superpowers/plans/) | El plan de implementación, tarea por tarea |

## Poner el proyecto en marcha

```bash
npm install
cp .env.local.example .env.local   # y rellenar con las claves de Supabase
npm run dev
```

Las claves están en Supabase, en *Project Settings → API Keys*. **En local se
usan siempre las del proyecto de pruebas**, nunca las de producción.

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm test` | Todas las pruebas. Las de permisos se saltan si no hay credenciales |
| `npm run typecheck` | Comprueba los tipos |
| `npm run lint` | Comprueba el estilo |
| `npm run build` | Compila para producción |

## Base de datos

Las migraciones están en `supabase/migrations/`, numeradas y en orden.

Para aplicarlas, **usa el guion y no copies los archivos a mano**:

```powershell
.\scripts\preparar-sql.ps1             # todas, para una base vacía
.\scripts\preparar-sql.ps1 -Solo 0012  # solo esa, que es lo normal
.\scripts\preparar-sql.ps1 -Desde 0008 # esa y todas las siguientes
.\scripts\preparar-sql.ps1 -Reinicio   # además borra antes lo que haya
```

Después se pega en el editor SQL del panel de Supabase. El guion existe
porque PowerShell lee los archivos como texto antiguo y destroza los
acentos: «2 años» llegó una vez a la base de datos como «2 aÃ±os» y ninguna
prueba se enteró. El guion verifica los acentos y aborta si no sobreviven.

## Cosas que conviene saber antes de tocar nada

- **Las reglas de permisos viven en PostgreSQL**, no en las pantallas. Si
  cambias algo de acceso, cámbialo en una migración y añade su prueba en
  `tests/permisos/`.
- **Las listas son cerradas**: tallas, provincias, categorías. Cada una
  existe en TypeScript y en SQL, y hay pruebas que vigilan que no se
  separen.
- **Los precios se guardan en céntimos**, como enteros.
- **No hay casilla de «acepto la política de privacidad»**: la privacidad se
  informa, no se consiente. La casilla separada es solo para marketing.
- **Los contrastes de color se comprueban solos** en
  `tests/unidad/contraste.test.ts`, leyendo la hoja de estilos. Si tocas un
  color y no cumple, la prueba te lo dice y por cuánto.
- **No se carga ninguna fuente web**, para no ceder la IP del visitante a un
  tercero.
- **Supabase concede TODO sobre cada tabla nueva** a los roles `anon` y
  `authenticated`, y un `grant update (columna…)` solo añade permisos: no
  quita los que ya había. Una migración que cree una tabla tiene que hacer
  `revoke all … from anon, authenticated` ANTES de conceder lo suyo. Esto
  costó un agujero real —se podía falsear la fecha de venta de un anuncio
  propio desde el navegador— y lo cerró la migración 0010.
- **Las páginas públicas no tocan las cookies.** Usan `clientePublico()` en
  vez de `clienteServidor()`: en cuanto una página lee una cookie, Next
  tiene que calcularla entera en cada visita, y son justo las páginas que
  recibirán el tráfico de Google.
- **Ruta limpia se indexa; con interrogación, nunca.** Y una página de
  catálogo solo se le ofrece a Google a partir de **diez anuncios**
  (`UMBRAL_PARA_GOOGLE`). Publicar cientos de páginas vacías es el error
  que hunde a los marketplaces pequeños.
- **En Next, un mismo tramo de la ruta tiene que llamarse igual en todas
  las rutas que pasan por él.** `/ropa/[categoria]` y `/ropa/[genero]/[x]`
  compilaban sin una queja y después el servidor devolvía 500 en TODAS las
  páginas del sitio. Por eso el tramo se llama `[seccion]` en las dos.

## Estado

Hito 1, tramo A. Funcionan de punta a punta:

- **Cuentas**: registro con verificación por correo, acceso, recuperación de
  contraseña, perfil y armario público.
- **Publicar**: formulario de tres pasos pensado para una mano y un pulgar,
  con las fotos reducidas y sin metadatos desde el propio navegador.
- **Anuncios**: ficha pública con datos para buscadores, prenda y lote con
  su precio por pieza, y «mis anuncios» para reservar, vender, retirar y
  recuperar.
- **Catálogo**: portada, `/lotes`, páginas por talla, categoría, género,
  marca y provincia, buscador, mapa del sitio con umbral y `robots.txt`.

Lo que falta para que alguien pueda comprar de verdad es **la mensajería**:
hoy se puede publicar y se puede encontrar, pero no se puede preguntar «¿te
queda?». Su migración está escrita (`0012`) y sus pruebas también; falta
aplicarla. Después llegan el perfil del niño con el aviso de talla
siguiente, la siembra asistida y el panel.

Lo que está pendiente de una persona, y no de código, está en
[`docs/pendientes.md`](docs/pendientes.md).
