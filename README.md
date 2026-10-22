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
.\scripts\preparar-sql.ps1            # deja el SQL en el portapapeles
.\scripts\preparar-sql.ps1 -Reinicio  # además borra antes lo que haya
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

## Estado

Hito 1, tramo A. Funcionan las cuentas: registro con verificación por correo,
acceso, recuperación de contraseña, perfil y armario público. Los anuncios,
el catálogo y la mensajería llegan en los planes 2 a 5.
