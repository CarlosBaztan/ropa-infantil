# Plan de implementación — Cimientos y cuentas (plan 1 de 5)

> **Para quien ejecute este plan:** SUB-SKILL OBLIGATORIA: usa `superpowers:subagent-driven-development` (recomendada) o `superpowers:executing-plans` para implementarlo tarea por tarea. Los pasos usan casillas (`- [ ]`) para ir marcando el avance.

**Objetivo:** dejar en pie el proyecto y el sistema de cuentas: una web en español donde alguien puede registrarse, verificar su correo, entrar, editar su perfil y ver el perfil público de otra persona, con las reglas de permisos vigentes en la propia base de datos y las cuatro páginas legales publicadas.

**Arquitectura:** aplicación Next.js con App Router desplegada en Vercel, y Supabase (PostgreSQL + autenticación + almacenamiento) en región europea como única fuente de datos. La autorización no vive en el código de las pantallas, sino en políticas de seguridad a nivel de fila dentro de PostgreSQL: aunque una pantalla tenga un fallo, la base de datos sigue negando el acceso. Las listas cerradas del dominio (tallas, categorías, provincias) son tablas de referencia con datos de semilla, no texto libre.

**Tecnologías:** Next.js 15 (App Router), TypeScript en modo estricto, Supabase (`@supabase/supabase-js` y `@supabase/ssr`), Vitest para pruebas unitarias y de permisos, Playwright para el recorrido completo, ESLint y Prettier, npm como gestor de paquetes.

**Especificación:** `docs/superpowers/specs/2026-10-20-marketplace-ropa-infantil-hito1-design.md`
**Análisis de viabilidad (contexto de negocio):** `docs/analisis/2026-10-20-analisis-viabilidad.md`

## Restricciones globales

Se aplican a todas las tareas de este plan y de los siguientes.

- **La base de datos se crea en región de la Unión Europea** (Frankfurt). Es una casilla al crear el proyecto y después es una mudanza.
- **Listas cerradas, nunca texto libre:** talla, categoría, género, estado de conservación, temporada, marca y provincia son tablas de referencia o tipos enumerados.
- **Los precios se guardan en céntimos, como enteros.** Nunca decimales.
- **Edad mínima: 18 años.** Comprar y vender son contratos.
- **No existe ninguna casilla "acepto la política de privacidad".** La privacidad se informa; lo que lleva casilla propia, separada y desmarcada por defecto es el marketing.
- **El catálogo se puede ver sin cuenta.** Solo publicar, guardar y escribir exigen sesión.
- **Idioma único: español.** `<html lang="es">`, sin etiquetas de idioma alternativo.
- **Accesibilidad:** zona táctil mínima de 48 px, contraste de 4,5:1 en texto y 3:1 en bordes de control, foco visible siempre, y el color nunca como única señal de información.
- **Colores exactos del sistema visual:** claro `--c-bg:#FFFCF8` · `--c-ink:#1C2420` · `--c-primary:#0F6B5C` · `--c-accent:#B4543A`; oscuro `--c-bg:#10161A` · `--c-ink:#ECF1EF` · `--c-primary:#5FD1B8` · `--c-accent:#E8907A`. Tipografía Inter, con números tabulares en los precios.
- **TypeScript en modo estricto.** Nada de `any` sin un comentario que lo justifique.
- **Commits frecuentes**, uno por tarea como mínimo, en español y en modo imperativo.

## Foco de revisión

Cinco clases de entrada que la especificación da por supuestas y que ninguna prueba del diseño original cubría. Cada una tiene ya su prueba asignada a la tarea dueña del código.

1. **Fecha de nacimiento futura o imposible** (mañana, el año 1800): el registro debe rechazarla con un mensaje claro, no guardar basura. → Tarea 6.
2. **Correo con mayúsculas, espacios alrededor o repetido con otra capitalización** (`Ana@X.com` frente a `ana@x.com`): no deben crearse dos cuentas distintas. → Tarea 6.
3. **Exactamente 18 años cumplidos hoy**: el límite debe dejar pasar, no rechazar por un día. → Tarea 6.
4. **Alias vacío, solo espacios, o con etiquetas HTML dentro:** el perfil público no debe romperse ni ejecutar nada. → Tarea 7.
5. **Usuario sin el correo verificado que intenta escribir en la base de datos saltándose la interfaz:** debe negarlo PostgreSQL, no la pantalla. → Tarea 5.

---

## Los cinco planes, y por qué este va primero

El tramo A del hito 1 son cinco subsistemas. Cada plan deja software que funciona y se puede probar solo:

| Plan | Qué deja funcionando |
|---|---|
| **1. Cimientos y cuentas** (este) | Registrarse, verificar, entrar, perfil propio y público, permisos en la base de datos, páginas legales |
| 2. Anuncios | Publicar prenda y lote con fotos (sin datos de GPS), ficha, situaciones, editar y retirar |
| 3. Catálogo, búsqueda y visibilidad | Portada, filtros, rejilla, direcciones limpias, umbral de indexación, mapa del sitio |
| 4. Mensajería | Conversación ligada al anuncio, avisos por correo, marcar vendido |
| 5. Siembra, denuncias y panel | Publicar en nombre de otra familia, denuncias con respuesta motivada, panel mínimo |

Este va primero porque todos los demás escriben en tablas que dependen de `perfiles` y de las políticas de permisos que aquí se establecen.

---

## Estructura de archivos

```
package.json                          npm, scripts de prueba y desarrollo
tsconfig.json                         TypeScript estricto
.env.local.example                    plantilla de variables, sin secretos
src/app/layout.tsx                    esqueleto, lang="es", tokens de color
src/app/globals.css                   variables de color, claro y oscuro
src/app/page.tsx                      portada provisional
src/app/registro/page.tsx             formulario de registro
src/app/acceso/page.tsx               formulario de acceso
src/app/salir/route.ts                cierre de sesión
src/app/perfil/page.tsx               edición del perfil propio
src/app/armario/[alias]/page.tsx      perfil público
src/app/legal/aviso-legal/page.tsx    los cuatro textos legales
src/app/legal/condiciones/page.tsx
src/app/legal/privacidad/page.tsx
src/app/legal/cookies/page.tsx
src/lib/supabase/servidor.ts          cliente de servidor (lee cookies)
src/lib/supabase/navegador.ts         cliente de navegador
src/lib/tallas.ts                     lista cerrada de tallas y talla por edad
src/lib/validacion/perfil.ts          reglas de alias, correo y fecha de nacimiento
supabase/migrations/*.sql             esquema y políticas de permisos
supabase/seed/tallas.sql              datos de semilla de las tallas
tests/unidad/*.test.ts                pruebas unitarias
tests/permisos/*.test.ts              pruebas de permisos contra PostgreSQL
tests/e2e/registro.spec.ts            recorrido completo con Playwright
```

Un archivo por responsabilidad. `src/lib/validacion/perfil.ts` existe aparte de las pantallas porque sus reglas se prueban sin navegador y las usan tanto el formulario como el servidor.

---

### Tarea 1: Proyecto en pie, con pruebas que corren

**Archivos:**
- Crear: `package.json`, `tsconfig.json`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`, `vitest.config.ts`, `.gitignore`
- Prueba: `tests/unidad/humo.test.ts`

**Interfaces:**
- Consume: nada, es la primera tarea.
- Produce: los scripts `npm run dev`, `npm run build`, `npm test` y `npm run lint`.

- [ ] **Paso 1: Crear el proyecto**

```bash
npx create-next-app@15 . --typescript --app --eslint --no-tailwind --no-src-dir=false --import-alias "@/*"
git init && git add -A && git commit -m "Crear proyecto Next.js con TypeScript"
```

- [ ] **Paso 2: Poner TypeScript en estricto**

En `tsconfig.json`, dentro de `compilerOptions`, asegurar:

```json
{ "strict": true, "noUncheckedIndexedAccess": true, "noImplicitOverride": true }
```

- [ ] **Paso 3: Instalar Vitest y escribir la prueba de humo**

```bash
npm install -D vitest @vitejs/plugin-react
```

`vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { environment: "node", include: ["tests/**/*.test.ts"] },
});
```

`tests/unidad/humo.test.ts`:

```ts
import { describe, expect, it } from "vitest";

describe("entorno de pruebas", () => {
  it("ejecuta pruebas", () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Paso 4: Añadir el script y comprobar que la prueba pasa**

En `package.json`, dentro de `scripts`: `"test": "vitest run"`.

Ejecutar: `npm test`
Esperado: 1 prueba superada.

- [ ] **Paso 5: Idioma y tokens de color**

En `src/app/layout.tsx`, la etiqueta raíz debe ser `<html lang="es">`.

En `src/app/globals.css`:

```css
:root {
  --c-bg: #FFFCF8;
  --c-surface: #FFFFFF;
  --c-border: #E6DFD5;
  --c-ink: #1C2420;
  --c-ink-muted: #5A6460;
  --c-primary: #0F6B5C;
  --c-accent: #B4543A;
  --c-danger: #B3261E;
  --tap-min: 48px;
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --c-bg: #10161A;
    --c-surface: #171E22;
    --c-border: #2E3A3E;
    --c-ink: #ECF1EF;
    --c-ink-muted: #A6B2AE;
    --c-primary: #5FD1B8;
    --c-accent: #E8907A;
  }
}

:root[data-theme="dark"] {
  --c-bg: #10161A;
  --c-surface: #171E22;
  --c-border: #2E3A3E;
  --c-ink: #ECF1EF;
  --c-ink-muted: #A6B2AE;
  --c-primary: #5FD1B8;
  --c-accent: #E8907A;
}

body { background: var(--c-bg); color: var(--c-ink); }

:focus-visible { outline: 2px solid var(--c-primary); outline-offset: 2px; }
```

- [ ] **Paso 6: Comprobar que compila y commit**

Ejecutar: `npm run build`
Esperado: compilación sin errores.

```bash
git add -A
git commit -m "Añadir pruebas con Vitest, TypeScript estricto y tokens de color"
```

---

### Tarea 2: Supabase conectado, con proyecto de pruebas aparte

**Archivos:**
- Crear: `src/lib/supabase/servidor.ts`, `src/lib/supabase/navegador.ts`, `.env.local.example`
- Prueba: `tests/permisos/conexion.test.ts`

**Interfaces:**
- Consume: los scripts de la tarea 1.
- Produce: `clienteServidor(): Promise<SupabaseClient>` y `clienteNavegador(): SupabaseClient`.

**Decisión que conviene entender:** se crean **dos** proyectos de Supabase, `produccion` y `pruebas`, los dos en Frankfurt. Las pruebas de permisos se ejecutan contra el de pruebas. La alternativa habitual —levantar Supabase en local— exige Docker, que en Windows añade una capa de complicación que no compensa aquí. El precio de esta decisión es que las pruebas de permisos van por red y son más lentas; a cambio, no hay nada que instalar.

- [ ] **Paso 1: Crear los dos proyectos en Supabase**

En el panel de Supabase, crear `ropa-infantil-produccion` y `ropa-infantil-pruebas`, **ambos con región Frankfurt (eu-central-1)**. Apuntar de cada uno la URL del proyecto, la clave anónima y la clave de servicio.

- [ ] **Paso 2: Plantilla de variables de entorno**

`.env.local.example` (se versiona; `.env.local` nunca):

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_TEST_URL=
SUPABASE_TEST_ANON_KEY=
SUPABASE_TEST_SERVICE_ROLE_KEY=
```

Comprobar que `.gitignore` contiene `.env*.local`.

- [ ] **Paso 3: Instalar los clientes**

```bash
npm install @supabase/supabase-js @supabase/ssr
npm install -D dotenv
```

- [ ] **Paso 4: Escribir los dos clientes**

`src/lib/supabase/navegador.ts`:

```ts
import { createBrowserClient } from "@supabase/ssr";

export function clienteNavegador() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
```

`src/lib/supabase/servidor.ts`:

```ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function clienteServidor() {
  const almacen = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => almacen.getAll(),
        setAll: (lista) => {
          try {
            lista.forEach(({ name, value, options }) =>
              almacen.set(name, value, options),
            );
          } catch {
            // Llamado desde un componente de servidor: la sesión se
            // renueva en el middleware, aquí no hay nada que hacer.
          }
        },
      },
    },
  );
}
```

- [ ] **Paso 5: Prueba de que la conexión de pruebas responde**

`tests/permisos/conexion.test.ts`:

```ts
import { createClient } from "@supabase/supabase-js";
import "dotenv/config";
import { expect, it } from "vitest";

it("el proyecto de pruebas responde", async () => {
  const cliente = createClient(
    process.env.SUPABASE_TEST_URL!,
    process.env.SUPABASE_TEST_SERVICE_ROLE_KEY!,
  );
  const { error } = await cliente.from("tallas").select("codigo").limit(1);
  // Todavía no existe la tabla: lo que se comprueba es que responde
  // el servidor y no que falle la red o la clave.
  expect(error?.code).toBe("42P01");
});
```

- [ ] **Paso 6: Ejecutar y commit**

Ejecutar: `npm test`
Esperado: pasa, con el error `42P01` (la tabla no existe todavía).

```bash
git add -A
git commit -m "Conectar Supabase con proyectos de produccion y pruebas en region UE"
```

---

### Tarea 3: La tabla de tallas y la talla sugerida por edad

La tabla más importante del proyecto. Si la talla fuera texto libre, el filtro por talla —la razón por la que alguien entra en esta web— no funcionaría nunca.

**Archivos:**
- Crear: `supabase/migrations/0001_tallas.sql`, `supabase/seed/tallas.sql`, `src/lib/tallas.ts`
- Prueba: `tests/unidad/tallas.test.ts`

**Interfaces:**
- Consume: los clientes de la tarea 2.
- Produce:
  - `type GrupoTalla = "meses" | "anios"`
  - `interface Talla { codigo: string; grupo: GrupoTalla; etiqueta: string; tallaEu: string; edadMesesMin: number; edadMesesMax: number; orden: number }`
  - `const TALLAS: readonly Talla[]`
  - `function tallaSugeridaPorEdad(edadEnMeses: number): Talla | null`
  - `function tallaSiguiente(codigo: string): Talla | null`

- [ ] **Paso 1: Escribir las pruebas antes del código**

`tests/unidad/tallas.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { TALLAS, tallaSiguiente, tallaSugeridaPorEdad } from "@/lib/tallas";

describe("tallaSugeridaPorEdad", () => {
  it("un recién nacido usa la 0-3 meses", () => {
    expect(tallaSugeridaPorEdad(0)?.codigo).toBe("0-3-meses");
  });

  it("a los 4 meses usa la 3-6 meses", () => {
    expect(tallaSugeridaPorEdad(4)?.codigo).toBe("3-6-meses");
  });

  it("el límite inferior de un tramo pertenece a ese tramo", () => {
    expect(tallaSugeridaPorEdad(3)?.codigo).toBe("3-6-meses");
  });

  it("a los 30 meses usa la de 2 años", () => {
    expect(tallaSugeridaPorEdad(30)?.codigo).toBe("2-anos");
  });

  it("devuelve null con una edad negativa", () => {
    expect(tallaSugeridaPorEdad(-1)).toBeNull();
  });

  it("devuelve null por encima de los 14 años", () => {
    expect(tallaSugeridaPorEdad(200)).toBeNull();
  });
});

describe("tallaSiguiente", () => {
  it("después de la 3-6 meses viene la 6-9 meses", () => {
    expect(tallaSiguiente("3-6-meses")?.codigo).toBe("6-9-meses");
  });

  it("el salto de meses a años funciona", () => {
    expect(tallaSiguiente("18-24-meses")?.codigo).toBe("2-anos");
  });

  it("la última talla no tiene siguiente", () => {
    expect(tallaSiguiente("14-anos")).toBeNull();
  });

  it("un código inexistente devuelve null", () => {
    expect(tallaSiguiente("inventada")).toBeNull();
  });
});

describe("TALLAS", () => {
  it("los códigos no se repiten", () => {
    const codigos = TALLAS.map((t) => t.codigo);
    expect(new Set(codigos).size).toBe(codigos.length);
  });

  it("los tramos de edad no se solapan y van en orden", () => {
    for (let i = 1; i < TALLAS.length; i++) {
      expect(TALLAS[i]!.edadMesesMin).toBe(TALLAS[i - 1]!.edadMesesMax + 1);
      expect(TALLAS[i]!.orden).toBeGreaterThan(TALLAS[i - 1]!.orden);
    }
  });
});
```

- [ ] **Paso 2: Ejecutar y ver que falla**

Ejecutar: `npx vitest run tests/unidad/tallas.test.ts`
Esperado: FALLA, no encuentra el módulo `@/lib/tallas`.

- [ ] **Paso 3: Escribir la lista de tallas**

`src/lib/tallas.ts`:

```ts
export type GrupoTalla = "meses" | "anios";

export interface Talla {
  codigo: string;
  grupo: GrupoTalla;
  etiqueta: string;
  tallaEu: string;
  edadMesesMin: number;
  edadMesesMax: number;
  orden: number;
}

function meses(
  codigo: string,
  etiqueta: string,
  tallaEu: string,
  min: number,
  max: number,
  orden: number,
): Talla {
  return { codigo, grupo: "meses", etiqueta, tallaEu, edadMesesMin: min, edadMesesMax: max, orden };
}

function anios(anio: number, tallaEu: string, orden: number): Talla {
  return {
    codigo: `${anio}-anos`,
    grupo: "anios",
    etiqueta: `${anio} años`,
    tallaEu,
    edadMesesMin: anio * 12,
    edadMesesMax: anio * 12 + 11,
    orden,
  };
}

export const TALLAS: readonly Talla[] = [
  meses("0-3-meses", "0-3 meses", "56", 0, 2, 10),
  meses("3-6-meses", "3-6 meses", "62", 3, 5, 20),
  meses("6-9-meses", "6-9 meses", "68", 6, 8, 30),
  meses("9-12-meses", "9-12 meses", "74", 9, 11, 40),
  meses("12-18-meses", "12-18 meses", "80", 12, 17, 50),
  meses("18-24-meses", "18-24 meses", "86", 18, 23, 60),
  anios(2, "92", 70),
  anios(3, "98", 80),
  anios(4, "104", 90),
  anios(5, "110", 100),
  anios(6, "116", 110),
  anios(7, "122", 120),
  anios(8, "128", 130),
  anios(9, "134", 140),
  anios(10, "140", 150),
  anios(11, "146", 160),
  anios(12, "152", 170),
  anios(13, "158", 180),
  anios(14, "164", 190),
];

export function tallaSugeridaPorEdad(edadEnMeses: number): Talla | null {
  if (!Number.isFinite(edadEnMeses) || edadEnMeses < 0) return null;
  return (
    TALLAS.find(
      (t) => edadEnMeses >= t.edadMesesMin && edadEnMeses <= t.edadMesesMax,
    ) ?? null
  );
}

export function tallaSiguiente(codigo: string): Talla | null {
  const indice = TALLAS.findIndex((t) => t.codigo === codigo);
  if (indice === -1) return null;
  return TALLAS[indice + 1] ?? null;
}
```

- [ ] **Paso 4: Ejecutar y ver que pasa**

Ejecutar: `npx vitest run tests/unidad/tallas.test.ts`
Esperado: todas superadas.

- [ ] **Paso 5: La misma lista en la base de datos**

`supabase/migrations/0001_tallas.sql`:

```sql
create type grupo_talla as enum ('meses', 'anios');

create table tallas (
  codigo text primary key,
  grupo grupo_talla not null,
  etiqueta text not null,
  talla_eu text not null,
  edad_meses_min int not null,
  edad_meses_max int not null,
  orden int not null unique,
  constraint tramo_valido check (edad_meses_max >= edad_meses_min)
);

alter table tallas enable row level security;

-- Las tallas son datos de referencia: cualquiera puede leerlas, incluso
-- sin sesión, porque el catálogo se ve sin cuenta. Nadie puede escribirlas
-- salvo con la clave de servicio.
create policy "las tallas las lee cualquiera"
  on tallas for select to anon, authenticated using (true);
```

`supabase/seed/tallas.sql` con las diecinueve filas, en el mismo orden y con los mismos valores que `TALLAS`.

- [ ] **Paso 6: Aplicar y comprobar que las dos listas coinciden**

```bash
npx supabase link --project-ref <referencia-del-proyecto-de-pruebas>
npx supabase db push
```

Añadir a `tests/permisos/tallas.test.ts` una prueba que lea las tallas de la base de datos con la clave anónima y compruebe que sus códigos y tramos son exactamente los de `TALLAS`. Es la prueba que evita que las dos listas se separen con el tiempo.

Ejecutar: `npm test`
Esperado: todas superadas.

- [ ] **Paso 7: Commit**

```bash
git add -A
git commit -m "Anadir la tabla de tallas y la talla sugerida por edad"
```

---

### Tarea 4: Perfiles con permisos en la base de datos

La tarea de seguridad del plan. Lo que aquí se escribe protege todo lo que vendrá después.

**Archivos:**
- Crear: `supabase/migrations/0002_perfiles.sql`
- Prueba: `tests/permisos/perfiles.test.ts`

**Interfaces:**
- Consume: la tabla `tallas` y los clientes de la tarea 2.
- Produce: la tabla `perfiles` y su disparador de creación automática; el ayudante de pruebas `crearUsuarioDePrueba(correo: string): Promise<{ id: string; cliente: SupabaseClient }>`.

- [ ] **Paso 1: Escribir las pruebas de permisos antes del esquema**

`tests/permisos/perfiles.test.ts`:

```ts
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import "dotenv/config";
import { afterAll, beforeAll, expect, it } from "vitest";

const admin = createClient(
  process.env.SUPABASE_TEST_URL!,
  process.env.SUPABASE_TEST_SERVICE_ROLE_KEY!,
);

async function crearUsuarioDePrueba(correo: string) {
  const { data, error } = await admin.auth.admin.createUser({
    email: correo,
    password: "contrasena-de-prueba-1234",
    email_confirm: true,
  });
  if (error) throw error;
  const cliente = createClient(
    process.env.SUPABASE_TEST_URL!,
    process.env.SUPABASE_TEST_ANON_KEY!,
  );
  await cliente.auth.signInWithPassword({
    email: correo,
    password: "contrasena-de-prueba-1234",
  });
  return { id: data.user!.id, cliente };
}

let ana: Awaited<ReturnType<typeof crearUsuarioDePrueba>>;
let berta: Awaited<ReturnType<typeof crearUsuarioDePrueba>>;

beforeAll(async () => {
  ana = await crearUsuarioDePrueba(`ana-${Date.now()}@ejemplo.test`);
  berta = await crearUsuarioDePrueba(`berta-${Date.now()}@ejemplo.test`);
});

afterAll(async () => {
  await admin.auth.admin.deleteUser(ana.id);
  await admin.auth.admin.deleteUser(berta.id);
});

it("al registrarse se crea su perfil automáticamente", async () => {
  const { data } = await admin.from("perfiles").select("id").eq("id", ana.id).single();
  expect(data?.id).toBe(ana.id);
});

it("cualquiera puede leer un perfil, incluso sin sesión", async () => {
  const anonimo = createClient(
    process.env.SUPABASE_TEST_URL!,
    process.env.SUPABASE_TEST_ANON_KEY!,
  );
  const { data, error } = await anonimo.from("perfiles").select("alias").eq("id", ana.id);
  expect(error).toBeNull();
  expect(data).toHaveLength(1);
});

it("cada una puede cambiar su propio alias", async () => {
  const { error } = await ana.cliente
    .from("perfiles")
    .update({ alias: "ana" })
    .eq("id", ana.id);
  expect(error).toBeNull();
});

it("NADIE puede cambiar el perfil de otra persona", async () => {
  const { error } = await berta.cliente
    .from("perfiles")
    .update({ alias: "secuestrado" })
    .eq("id", ana.id);
  const { data } = await admin.from("perfiles").select("alias").eq("id", ana.id).single();
  expect(data?.alias).not.toBe("secuestrado");
  expect(error).not.toBeNull();
});

it("nadie puede marcarse el correo como verificado por su cuenta", async () => {
  await ana.cliente.from("perfiles").update({ correo_verificado: true }).eq("id", ana.id);
  const { data } = await admin
    .from("perfiles")
    .select("correo_verificado")
    .eq("id", ana.id)
    .single();
  expect(data?.correo_verificado).toBe(false);
});

it("nadie puede desbloquearse a sí mismo", async () => {
  await admin.from("perfiles").update({ bloqueado: true }).eq("id", ana.id);
  await ana.cliente.from("perfiles").update({ bloqueado: false }).eq("id", ana.id);
  const { data } = await admin.from("perfiles").select("bloqueado").eq("id", ana.id).single();
  expect(data?.bloqueado).toBe(true);
});

it("nadie puede borrar un perfil directamente", async () => {
  const { error } = await ana.cliente.from("perfiles").delete().eq("id", ana.id);
  expect(error).not.toBeNull();
});
```

- [ ] **Paso 2: Ejecutar y ver que falla**

Ejecutar: `npx vitest run tests/permisos/perfiles.test.ts`
Esperado: FALLA, la tabla `perfiles` no existe.

- [ ] **Paso 3: Escribir el esquema y las políticas**

`supabase/migrations/0002_perfiles.sql`:

```sql
create type tipo_vendedor as enum ('particular', 'profesional');

create table perfiles (
  id uuid primary key references auth.users on delete cascade,
  alias text unique,
  foto text,
  provincia text,
  ciudad text,
  fecha_nacimiento date,
  tipo_vendedor tipo_vendedor not null default 'particular',
  correo_verificado boolean not null default false,
  acepta_marketing boolean not null default false,
  bloqueado boolean not null default false,
  fecha_alta timestamptz not null default now(),
  constraint alias_con_forma check (
    alias is null or alias ~ '^[a-z0-9][a-z0-9_-]{1,28}[a-z0-9]$'
  )
);

alter table perfiles enable row level security;

-- El catálogo se ve sin cuenta, así que el perfil público también.
create policy "los perfiles los lee cualquiera"
  on perfiles for select to anon, authenticated using (true);

-- Cada quien edita el suyo, y solo las columnas que le corresponden:
-- correo_verificado, bloqueado y tipo_vendedor quedan fuera de su alcance
-- mediante el disparador de abajo, porque PostgreSQL no restringe columnas
-- en las políticas de fila.
create policy "cada quien edita su perfil"
  on perfiles for update to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);

-- Nadie borra perfiles a mano: el borrado va por auth.users en cascada,
-- que es lo que exige el derecho de supresión sin romper conversaciones.

create or replace function proteger_columnas_de_perfil()
returns trigger language plpgsql security definer as $$
begin
  if auth.role() = 'service_role' then
    return new;
  end if;
  new.correo_verificado := old.correo_verificado;
  new.bloqueado := old.bloqueado;
  new.tipo_vendedor := old.tipo_vendedor;
  new.fecha_alta := old.fecha_alta;
  return new;
end;
$$;

create trigger perfiles_columnas_protegidas
  before update on perfiles
  for each row execute function proteger_columnas_de_perfil();

create or replace function crear_perfil_al_registrarse()
returns trigger language plpgsql security definer as $$
begin
  insert into perfiles (id, correo_verificado)
  values (new.id, new.email_confirmed_at is not null);
  return new;
end;
$$;

create trigger al_crear_usuario
  after insert on auth.users
  for each row execute function crear_perfil_al_registrarse();

create or replace function sincronizar_verificacion()
returns trigger language plpgsql security definer as $$
begin
  update perfiles
     set correo_verificado = new.email_confirmed_at is not null
   where id = new.id;
  return new;
end;
$$;

create trigger al_verificar_correo
  after update of email_confirmed_at on auth.users
  for each row execute function sincronizar_verificacion();
```

- [ ] **Paso 4: Aplicar, ejecutar y ver que pasa**

```bash
npx supabase db push
npx vitest run tests/permisos/perfiles.test.ts
```

Esperado: las siete superadas. Si la de "no puede cambiar el perfil de otra" pasara por accidente, **parar y revisar la política**: es el fallo más grave posible en este proyecto.

- [ ] **Paso 5: Commit**

```bash
git add -A
git commit -m "Anadir perfiles con permisos a nivel de fila y columnas protegidas"
```

---

### Tarea 5: Registro con verificación obligatoria del correo

**Archivos:**
- Crear: `src/app/registro/page.tsx`, `src/app/registro/acciones.ts`, `supabase/migrations/0003_verificacion_para_escribir.sql`
- Prueba: `tests/permisos/verificacion.test.ts`

**Interfaces:**
- Consume: `clienteServidor()`, la tabla `perfiles`, y `validarRegistro()` de la tarea 6.
- Produce: la acción de servidor `registrar(datos: FormData): Promise<{ error?: string }>` y la función SQL `tiene_correo_verificado(): boolean`, que usarán las políticas de los planes 2 a 5.

- [ ] **Paso 1: Escribir la prueba del foco de revisión número 5**

Un usuario sin verificar no debe poder escribir, **y lo tiene que negar la base de datos**, no la pantalla. Se comprueba sobre una tabla de prueba que imita a la de anuncios:

`tests/permisos/verificacion.test.ts`:

```ts
import { createClient } from "@supabase/supabase-js";
import "dotenv/config";
import { expect, it } from "vitest";

const admin = createClient(
  process.env.SUPABASE_TEST_URL!,
  process.env.SUPABASE_TEST_SERVICE_ROLE_KEY!,
);

it("quien no ha verificado el correo no puede escribir, aunque llame a la API directamente", async () => {
  const correo = `sin-verificar-${Date.now()}@ejemplo.test`;
  const { data } = await admin.auth.admin.createUser({
    email: correo,
    password: "contrasena-de-prueba-1234",
    email_confirm: false,
  });
  const cliente = createClient(
    process.env.SUPABASE_TEST_URL!,
    process.env.SUPABASE_TEST_ANON_KEY!,
  );
  await cliente.auth.signInWithPassword({
    email: correo,
    password: "contrasena-de-prueba-1234",
  });

  const { data: verificado } = await cliente.rpc("tiene_correo_verificado");
  expect(verificado).toBe(false);

  await admin.auth.admin.deleteUser(data.user!.id);
});

it("quien lo ha verificado, sí", async () => {
  const correo = `verificada-${Date.now()}@ejemplo.test`;
  const { data } = await admin.auth.admin.createUser({
    email: correo,
    password: "contrasena-de-prueba-1234",
    email_confirm: true,
  });
  const cliente = createClient(
    process.env.SUPABASE_TEST_URL!,
    process.env.SUPABASE_TEST_ANON_KEY!,
  );
  await cliente.auth.signInWithPassword({
    email: correo,
    password: "contrasena-de-prueba-1234",
  });

  const { data: verificado } = await cliente.rpc("tiene_correo_verificado");
  expect(verificado).toBe(true);

  await admin.auth.admin.deleteUser(data.user!.id);
});
```

- [ ] **Paso 2: Ejecutar y ver que falla**

Ejecutar: `npx vitest run tests/permisos/verificacion.test.ts`
Esperado: FALLA, la función `tiene_correo_verificado` no existe.

- [ ] **Paso 3: Escribir la función SQL**

`supabase/migrations/0003_verificacion_para_escribir.sql`:

```sql
-- La usarán las políticas de anuncios, mensajes y favoritos de los planes
-- siguientes, para que la regla "hay que verificar el correo antes de
-- publicar" viva en la base de datos y no solo en las pantallas.
create or replace function tiene_correo_verificado()
returns boolean language sql stable security definer as $$
  select coalesce(
    (select correo_verificado and not bloqueado
       from perfiles where id = auth.uid()),
    false
  );
$$;

grant execute on function tiene_correo_verificado() to anon, authenticated;
```

- [ ] **Paso 4: Aplicar, ejecutar y ver que pasa**

```bash
npx supabase db push
npx vitest run tests/permisos/verificacion.test.ts
```

Esperado: las dos superadas.

- [ ] **Paso 5: Escribir la acción de registro**

`src/app/registro/acciones.ts`:

```ts
"use server";

import { clienteServidor } from "@/lib/supabase/servidor";
import { validarRegistro } from "@/lib/validacion/perfil";

export async function registrar(datos: FormData): Promise<{ error?: string }> {
  const resultado = validarRegistro({
    correo: String(datos.get("correo") ?? ""),
    contrasena: String(datos.get("contrasena") ?? ""),
    fechaNacimiento: String(datos.get("fecha_nacimiento") ?? ""),
    aceptaMarketing: datos.get("acepta_marketing") === "on",
  });
  if (!resultado.valido) return { error: resultado.error };

  const supabase = await clienteServidor();
  const { error } = await supabase.auth.signUp({
    email: resultado.valor.correo,
    password: resultado.valor.contrasena,
    options: {
      data: {
        fecha_nacimiento: resultado.valor.fechaNacimiento,
        acepta_marketing: resultado.valor.aceptaMarketing,
      },
    },
  });
  if (error) return { error: "No hemos podido crear la cuenta. Inténtalo de nuevo." };
  return {};
}
```

- [ ] **Paso 6: Escribir el formulario**

`src/app/registro/page.tsx`, con tres requisitos que vienen de la ley y del sistema visual:

- **No hay casilla de "acepto la política de privacidad".** Debajo del botón, un texto informativo con enlace a `/legal/privacidad`.
- **Sí hay una casilla separada y desmarcada** para `acepta_marketing`, con su etiqueta propia.
- Todos los campos con `<label>` explícito, y los controles con una altura mínima de `var(--tap-min)`.

- [ ] **Paso 7: Commit**

```bash
git add -A
git commit -m "Anadir registro con verificacion obligatoria del correo"
```

---

### Tarea 6: Las reglas de validación, con sus casos límite

Aquí viven tres de los cinco puntos del foco de revisión.

**Archivos:**
- Crear: `src/lib/validacion/perfil.ts`
- Prueba: `tests/unidad/validacion-perfil.test.ts`

**Interfaces:**
- Consume: nada.
- Produce:
  - `type Resultado<T> = { valido: true; valor: T } | { valido: false; error: string }`
  - `function normalizarCorreo(correo: string): string`
  - `function edadEnAnios(fechaNacimiento: string, hoy?: Date): number | null`
  - `function validarRegistro(entrada: EntradaRegistro): Resultado<EntradaRegistro>`

- [ ] **Paso 1: Escribir las pruebas**

`tests/unidad/validacion-perfil.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { edadEnAnios, normalizarCorreo, validarRegistro } from "@/lib/validacion/perfil";

const base = {
  correo: "ana@ejemplo.com",
  contrasena: "contrasena-larga-1234",
  fechaNacimiento: "1990-05-04",
  aceptaMarketing: false,
};

describe("normalizarCorreo", () => {
  it("quita espacios y pasa a minúsculas", () => {
    expect(normalizarCorreo("  Ana@Ejemplo.COM ")).toBe("ana@ejemplo.com");
  });

  it("dos escrituras del mismo correo acaban igual", () => {
    expect(normalizarCorreo("ANA@ejemplo.com")).toBe(normalizarCorreo("ana@Ejemplo.com"));
  });
});

describe("edadEnAnios", () => {
  const hoy = new Date("2026-10-21T12:00:00Z");

  it("cumplir 18 hoy cuenta como 18", () => {
    expect(edadEnAnios("2008-10-21", hoy)).toBe(18);
  });

  it("cumplirlos mañana cuenta como 17", () => {
    expect(edadEnAnios("2008-10-22", hoy)).toBe(17);
  });

  it("una fecha futura devuelve null", () => {
    expect(edadEnAnios("2030-01-01", hoy)).toBeNull();
  });

  it("una fecha imposible devuelve null", () => {
    expect(edadEnAnios("1800-01-01", hoy)).toBeNull();
    expect(edadEnAnios("no-es-fecha", hoy)).toBeNull();
    expect(edadEnAnios("2008-02-30", hoy)).toBeNull();
  });
});

describe("validarRegistro", () => {
  it("acepta un registro correcto y devuelve el correo normalizado", () => {
    const r = validarRegistro({ ...base, correo: " Ana@Ejemplo.com " });
    expect(r.valido).toBe(true);
    if (r.valido) expect(r.valor.correo).toBe("ana@ejemplo.com");
  });

  it("rechaza a quien tiene 17 años", () => {
    const r = validarRegistro({ ...base, fechaNacimiento: "2010-01-01" });
    expect(r.valido).toBe(false);
    if (!r.valido) expect(r.error).toContain("18");
  });

  it("rechaza una fecha de nacimiento futura", () => {
    const r = validarRegistro({ ...base, fechaNacimiento: "2030-01-01" });
    expect(r.valido).toBe(false);
  });

  it("rechaza un correo sin arroba", () => {
    expect(validarRegistro({ ...base, correo: "ana" }).valido).toBe(false);
  });

  it("rechaza una contraseña corta", () => {
    expect(validarRegistro({ ...base, contrasena: "1234" }).valido).toBe(false);
  });

  it("el marketing es opcional y por defecto no se acepta", () => {
    const r = validarRegistro(base);
    expect(r.valido).toBe(true);
    if (r.valido) expect(r.valor.aceptaMarketing).toBe(false);
  });
});
```

- [ ] **Paso 2: Ejecutar y ver que falla**

Ejecutar: `npx vitest run tests/unidad/validacion-perfil.test.ts`
Esperado: FALLA, no encuentra el módulo.

- [ ] **Paso 3: Escribir las reglas**

`src/lib/validacion/perfil.ts`:

```ts
export type Resultado<T> =
  | { valido: true; valor: T }
  | { valido: false; error: string };

export interface EntradaRegistro {
  correo: string;
  contrasena: string;
  fechaNacimiento: string;
  aceptaMarketing: boolean;
}

const EDAD_MINIMA = 18;
const EDAD_MAXIMA_RAZONABLE = 120;

export function normalizarCorreo(correo: string): string {
  return correo.trim().toLowerCase();
}

export function edadEnAnios(fechaNacimiento: string, hoy = new Date()): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaNacimiento)) return null;
  const fecha = new Date(`${fechaNacimiento}T00:00:00Z`);
  if (Number.isNaN(fecha.getTime())) return null;
  // Rechaza "2008-02-30", que Date normalizaría a marzo en silencio.
  if (fecha.toISOString().slice(0, 10) !== fechaNacimiento) return null;
  if (fecha > hoy) return null;

  let edad = hoy.getUTCFullYear() - fecha.getUTCFullYear();
  const mes = hoy.getUTCMonth() - fecha.getUTCMonth();
  if (mes < 0 || (mes === 0 && hoy.getUTCDate() < fecha.getUTCDate())) edad--;

  if (edad > EDAD_MAXIMA_RAZONABLE) return null;
  return edad;
}

export function validarRegistro(entrada: EntradaRegistro): Resultado<EntradaRegistro> {
  const correo = normalizarCorreo(entrada.correo);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
    return { valido: false, error: "Ese correo no parece válido." };
  }
  if (entrada.contrasena.length < 10) {
    return { valido: false, error: "La contraseña necesita al menos 10 caracteres." };
  }
  const edad = edadEnAnios(entrada.fechaNacimiento);
  if (edad === null) {
    return { valido: false, error: "Revisa la fecha de nacimiento." };
  }
  if (edad < EDAD_MINIMA) {
    return {
      valido: false,
      error: "Para comprar y vender hay que tener 18 años o más.",
    };
  }
  return { valido: true, valor: { ...entrada, correo } };
}
```

- [ ] **Paso 4: Ejecutar y ver que pasa**

Ejecutar: `npx vitest run tests/unidad/validacion-perfil.test.ts`
Esperado: las dieciséis superadas.

- [ ] **Paso 5: Commit**

```bash
git add -A
git commit -m "Anadir validacion de registro con edad minima y correo normalizado"
```

---

### Tarea 7: Acceso, cierre de sesión y perfil público

**Archivos:**
- Crear: `src/app/acceso/page.tsx`, `src/app/acceso/acciones.ts`, `src/app/salir/route.ts`, `src/app/perfil/page.tsx`, `src/app/armario/[alias]/page.tsx`, `middleware.ts`
- Prueba: `tests/unidad/alias.test.ts`, `tests/e2e/registro.spec.ts`

**Interfaces:**
- Consume: `clienteServidor()`, `clienteNavegador()`, la tabla `perfiles`.
- Produce: `function validarAlias(alias: string): Resultado<string>`; la ruta pública `/armario/[alias]`.

- [ ] **Paso 1: Escribir la prueba del foco de revisión número 4**

`tests/unidad/alias.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { validarAlias } from "@/lib/validacion/perfil";

describe("validarAlias", () => {
  it("acepta un alias normal", () => {
    expect(validarAlias("ana-garcia").valido).toBe(true);
  });

  it("rechaza el alias vacío", () => {
    expect(validarAlias("").valido).toBe(false);
  });

  it("rechaza un alias de solo espacios", () => {
    expect(validarAlias("   ").valido).toBe(false);
  });

  it("rechaza etiquetas HTML", () => {
    expect(validarAlias("<script>alert(1)</script>").valido).toBe(false);
  });

  it("rechaza un alias con barras, que rompería la dirección", () => {
    expect(validarAlias("ana/berta").valido).toBe(false);
  });

  it("pasa a minúsculas y quita los espacios de los extremos", () => {
    const r = validarAlias("  Ana-Garcia  ");
    expect(r.valido).toBe(true);
    if (r.valido) expect(r.valor).toBe("ana-garcia");
  });

  it("rechaza un alias demasiado largo", () => {
    expect(validarAlias("a".repeat(40)).valido).toBe(false);
  });
});
```

- [ ] **Paso 2: Ejecutar y ver que falla**

Ejecutar: `npx vitest run tests/unidad/alias.test.ts`
Esperado: FALLA, `validarAlias` no está exportada.

- [ ] **Paso 3: Añadir `validarAlias` al archivo de validación**

En `src/lib/validacion/perfil.ts`:

```ts
export function validarAlias(alias: string): Resultado<string> {
  const limpio = alias.trim().toLowerCase();
  if (limpio.length < 3) {
    return { valido: false, error: "El alias necesita al menos 3 caracteres." };
  }
  if (limpio.length > 30) {
    return { valido: false, error: "El alias no puede pasar de 30 caracteres." };
  }
  if (!/^[a-z0-9][a-z0-9_-]{1,28}[a-z0-9]$/.test(limpio)) {
    return {
      valido: false,
      error: "El alias solo admite letras sin acentos, números, guiones y guiones bajos.",
    };
  }
  return { valido: true, valor: limpio };
}
```

La expresión es la misma que la restricción `alias_con_forma` de la tarea 4: la base de datos es la última palabra y la validación de aquí solo sirve para dar un mensaje decente.

- [ ] **Paso 4: Ejecutar y ver que pasa**

Ejecutar: `npx vitest run tests/unidad/alias.test.ts`
Esperado: las siete superadas.

- [ ] **Paso 5: Renovación de la sesión en el middleware**

`middleware.ts` en la raíz, usando `createServerClient` de `@supabase/ssr` para refrescar la sesión en cada petición y devolver las cookies actualizadas. Sin esto, la sesión caduca a mitad de navegación.

- [ ] **Paso 6: Las tres pantallas**

- `/acceso`: correo, contraseña y enlace de contraseña olvidada.
- `/perfil`: edición de alias, foto, provincia y ciudad, usando `validarAlias`. Muestra el error del alias repetido con un mensaje propio, no el de PostgreSQL.
- `/armario/[alias]`: perfil público con alias, provincia, antigüedad y pestañas *En venta* y *Vendido*, vacías de momento porque los anuncios llegan en el plan 2. Si el alias no existe, `notFound()`.

- [ ] **Paso 7: El recorrido completo con Playwright**

```bash
npm install -D @playwright/test && npx playwright install chromium
```

`tests/e2e/registro.spec.ts`: registrarse con un correo nuevo, confirmar que la web dice que hay que verificar el correo, verificarlo con la clave de servicio, entrar, ponerse un alias, abrir `/armario/<alias>` y comprobar que el alias aparece.

- [ ] **Paso 8: Ejecutar todo y commit**

```bash
npm test && npx playwright test
git add -A
git commit -m "Anadir acceso, cierre de sesion y perfil publico"
```

---

### Tarea 8: Las cuatro páginas legales y el registro de aceptaciones

**Archivos:**
- Crear: `supabase/migrations/0004_documentos_legales.sql`, las cuatro páginas bajo `src/app/legal/`, `src/components/PieLegal.tsx`
- Prueba: `tests/permisos/aceptaciones.test.ts`, `tests/e2e/legal.spec.ts`

**Interfaces:**
- Consume: la tabla `perfiles`.
- Produce: las tablas `documentos_legales` y `aceptaciones`; `registrarAceptacion(documento: string, version: string): Promise<void>`.

- [ ] **Paso 1: Escribir la prueba de permisos**

`tests/permisos/aceptaciones.test.ts`: cada usuario puede leer **solo sus propias** aceptaciones y puede insertar las suyas, pero no las de otra persona ni modificar una ya registrada. Una aceptación es un hecho con fecha: si se pudiera editar, no serviría como prueba.

- [ ] **Paso 2: Ejecutar y ver que falla**

Ejecutar: `npx vitest run tests/permisos/aceptaciones.test.ts`
Esperado: FALLA, las tablas no existen.

- [ ] **Paso 3: Escribir el esquema**

`supabase/migrations/0004_documentos_legales.sql`:

```sql
create table documentos_legales (
  slug text not null,
  version text not null,
  titulo text not null,
  publicado_el timestamptz not null default now(),
  primary key (slug, version)
);

create table aceptaciones (
  id bigserial primary key,
  usuario uuid not null references perfiles(id) on delete cascade,
  documento_slug text not null,
  documento_version text not null,
  fecha timestamptz not null default now(),
  foreign key (documento_slug, documento_version)
    references documentos_legales(slug, version),
  unique (usuario, documento_slug, documento_version)
);

alter table documentos_legales enable row level security;
alter table aceptaciones enable row level security;

create policy "los documentos legales los lee cualquiera"
  on documentos_legales for select to anon, authenticated using (true);

create policy "cada quien ve sus aceptaciones"
  on aceptaciones for select to authenticated using (auth.uid() = usuario);

create policy "cada quien registra sus aceptaciones"
  on aceptaciones for insert to authenticated with check (auth.uid() = usuario);

-- No hay política de update ni de delete: una aceptación es un hecho
-- con fecha y no se reescribe.
```

- [ ] **Paso 4: Aplicar, ejecutar y ver que pasa**

```bash
npx supabase db push
npx vitest run tests/permisos/aceptaciones.test.ts
```

- [ ] **Paso 5: Escribir los cuatro textos**

Las cuatro páginas con el contenido real, no de relleno. En el aviso legal van **nombre, NIF y domicilio del titular**, que la ley exige publicar; hasta que decidas qué domicilio usar, el texto lleva un marcador visible `[PENDIENTE: datos del titular]` **y la página no se publica**. Es la única excepción a la regla de no dejar marcadores, y es deliberada: es preferible un hueco señalado a un dato inventado.

El pie de página enlaza las cuatro desde todas las pantallas.

- [ ] **Paso 6: Comprobar en el navegador y commit**

`tests/e2e/legal.spec.ts`: que las cuatro páginas respondan con 200 y que el pie las enlace desde la portada.

```bash
npx playwright test tests/e2e/legal.spec.ts
git add -A
git commit -m "Anadir paginas legales y registro de aceptaciones"
```

---

### Tarea 9: Despliegue y repaso de accesibilidad

**Archivos:**
- Crear: `.github/workflows/pruebas.yml`
- Modificar: `README.md`

**Interfaces:**
- Consume: todo lo anterior.
- Produce: la web publicada y las pruebas corriendo en cada subida.

- [ ] **Paso 1: Publicar en Vercel**

Conectar el repositorio, cargar las variables de entorno de **producción** y desplegar.

- [ ] **Paso 2: Pruebas automáticas en cada subida**

`.github/workflows/pruebas.yml` que ejecute `npm ci`, `npm run lint`, `npm test` y `npm run build`, con los secretos del proyecto de **pruebas**, nunca los de producción.

- [ ] **Paso 3: Repaso de accesibilidad a mano**

Sobre la web publicada, en un móvil de verdad: recorrer registro, acceso y perfil solo con el teclado comprobando que el foco se ve siempre; comprobar que ningún control táctil baja de 48 px; y abrirla en modo oscuro.

- [ ] **Paso 4: Commit**

```bash
git add -A
git commit -m "Anadir integracion continua y documentar el arranque del proyecto"
```

---

## Qué queda fuera de este plan

Anuncios, fotos, búsqueda, mensajería, siembra asistida, denuncias, panel de administración, direcciones de catálogo y mapa del sitio. Cada uno en su plan, y los cinco construyen sobre `perfiles`, `tallas` y `tiene_correo_verificado()`, que es lo que este plan deja en pie.

## Repaso del plan contra la especificación

- **Cobertura:** de la sección 2 del diseño, este plan cubre "Cuentas y perfil" por completo y "Lo imprescindible alrededor" en su parte legal. El panel mínimo y las denuncias quedan para el plan 5, y todo lo demás tiene su plan asignado en la tabla de arriba.
- **Marcadores:** solo uno, deliberado y señalado: los datos del titular en el aviso legal, que dependen de una decisión tuya y que impiden publicar esa página hasta que exista.
- **Tipos:** `Resultado<T>`, `Talla`, `EntradaRegistro`, `tiene_correo_verificado()` y `validarAlias` se usan con el mismo nombre y la misma forma en todas las tareas que los mencionan. La expresión del alias es literalmente la misma en la restricción SQL de la tarea 4 y en el código de la tarea 7.
- **Foco de revisión:** los cinco puntos tienen prueba asignada — fecha imposible y edad límite en la tarea 6, correo normalizado en la tarea 6, alias hostil en la tarea 7, y escritura sin verificar en la tarea 5.
