# Plan de implementación — Catálogo y búsqueda (plan 3 de 5)

**Objetivo:** que una madre que llega desde Google a una página de talla
encuentre algo que le sirva en los primeros diez segundos, y que el
catálogo exista como sitio navegable en vez de como una colección de
fichas sueltas.

**El problema que resuelve:** hoy se puede publicar un anuncio y abrir su
ficha, pero no hay forma de llegar a ella salvo con el enlace en la mano.
No hay catálogo, no hay búsqueda, la portada es un cartel y el armario
público dice «todavía no hay nada publicado» aunque lo haya.

**Especificación:** `docs/superpowers/specs/2026-10-20-marketplace-ropa-infantil-hito1-design.md`,
secciones 2 («Catálogo y búsqueda»), 7 (direcciones) y 8 (interfaz).
**Plan anterior:** `docs/superpowers/plans/2026-10-26-anuncios.md`

## Restricciones globales

Las de los planes 1 y 2 siguen vigentes. Añade estas, todas de la
sección 7 de la especificación, que es la que paga el marketing:

- **Ruta limpia, puede ir a Google; con interrogación, nunca.** Los
  filtros no indexables se construyen como botones de un formulario, no
  como enlaces. Si un filtro genera direcciones infinitas, Google se come
  el presupuesto de rastreo en páginas que no interesan.
- **Umbral de existencia: diez anuncios.** Una página de catálogo se
  ofrece a Google solo a partir de diez. Por debajo existe para quien
  entre, pero lleva `noindex`. Es lo que evita el error que hunde a los
  marketplaces pequeños: miles de páginas vacías.
- **Nada del nombre de quien vende en la tarjeta.** Es ruido: quien
  compra mira foto, precio, talla y dónde.
- **Carga con botón, no desplazamiento infinito.** El infinito rompe el
  botón de atrás, y en un móvil con una mano el botón de atrás es la
  mitad de la navegación.
- **Orden por cercanía, sin excluir a nadie.** El catálogo es nacional
  desde el día uno: con poca oferta, esconder lo de otra provincia sería
  absurdo. La provincia ordena; no filtra salvo que lo pidan.
- **La talla admite varias a la vez.** Un bebé siempre está a caballo
  entre dos, y obligar a elegir una es obligar a buscar dos veces.

## Foco de revisión

1. **Una página de talla con tres anuncios** no puede pedirle a Google
   que la indexe. → Tarea 4.
2. **Un filtro de texto con comillas, porcentajes o guiones bajos**
   —`%`, `_`, `'`— no puede romper la consulta ni colarse en el `like`.
   → Tarea 5.
3. **Una página 7 de un catálogo con dos anuncios** no puede devolver un
   error: devuelve vacío y lo dice. → Tarea 3.
4. **Un anuncio retirado** no aparece en ninguna rejilla, ni siquiera en
   la de su dueña cuando mira su propio armario público. → Tarea 1.
5. **La talla en la dirección tiene que ser de la lista cerrada.**
   `/ropa/nina/talla-inventada` es un 404, no una página vacía. → Tarea 4.

---

## Estructura de archivos

```
src/lib/anuncios/catalogo.ts          la consulta con filtros y su tipo
src/lib/anuncios/direcciones-seo.ts   las rutas limpias y sus atajos
src/components/TarjetaDeAnuncio.tsx   la tarjeta, compartida por todos
src/components/RejillaDeAnuncios.tsx  rejilla y boton de cargar mas
src/app/page.tsx                      portada con atajos y novedades
src/app/lotes/page.tsx                /lotes
src/app/lotes/talla/[talla]/page.tsx  /lotes/talla/3-6-meses
src/app/ropa/[genero]/[que]/page.tsx  /ropa/nina/3-6-meses y /ropa/nina/vestidos
src/app/buscar/page.tsx               /buscar?... nunca indexable
src/app/armario/[alias]/page.tsx      con sus anuncios de verdad
src/app/sitemap.ts                    solo lo que pasa el umbral
src/app/robots.ts
tests/unidad/direcciones-seo.test.ts
tests/permisos/catalogo.test.ts
tests/e2e/catalogo.spec.ts
```

---

### Tarea 1: La consulta del catálogo

Lo que todo lo demás llama. Vive en lib para poder probarla contra la
base de verdad sin levantar Next, igual que la de la ficha.

**Archivos:** crear `src/lib/anuncios/catalogo.ts`,
`tests/permisos/catalogo.test.ts`.

**Interfaz:**

```ts
export interface Filtros {
  tallas?: string[];        // varias a la vez, siempre de la lista cerrada
  tipo?: "lote" | "prenda";
  categoria?: string;
  genero?: string;
  marca?: string;
  provincia?: string;       // ordena primero; no excluye
  precioMaximoCentimos?: number;
  texto?: string;
  pagina?: number;          // desde 1
}
export interface Pagina {
  anuncios: ResumenDeAnuncio[];
  hayMas: boolean;
  total: number;
}
export async function buscarCatalogo(supabase, filtros): Promise<Pagina>
```

- [ ] **Paso 1: las pruebas, contra la base de pruebas**

Siembra media docena de anuncios de una usuaria y comprueba: que filtra
por varias tallas a la vez; que `tipo: "lote"` deja fuera las prendas
sueltas; que la provincia ordena pero no excluye; que un anuncio
retirado no sale **nunca**, ni para su dueña; que un vendido sí sale
pero detrás; que la página 7 de un catálogo corto devuelve vacío y
`hayMas: false`; y que el total cuenta lo que hay, no lo que cabe en la
página.

- [ ] **Paso 2: ejecutar y ver que falla**
- [ ] **Paso 3: escribir la consulta**
- [ ] **Paso 4: ejecutar y ver que pasa**
- [ ] **Paso 5: commit**

---

### Tarea 2: La tarjeta y la rejilla

**Archivos:** crear `src/components/TarjetaDeAnuncio.tsx` y
`src/components/RejillaDeAnuncios.tsx`; quitar la copia que vive dentro
de `src/app/anuncio/[slug]/page.tsx`.

Dos columnas, foto vertical, y en la tarjeta: foto, distintivo
*LOTE · 12 piezas* cuando procede, precio, precio por pieza, talla o
rango, estado, temporada y provincia. Nada de quien vende.

La rejilla recibe los anuncios ya cargados y, si hay más, un enlace de
«Ver más» que suma una página a la dirección. Con dirección, no con
JavaScript: así el botón de atrás sigue funcionando y la página 2 se
puede compartir.

- [ ] **Paso 1: prueba de la tarjeta con un lote y con una prenda**
- [ ] **Paso 2: escribirlas y sustituir la copia de la ficha**
- [ ] **Paso 3: commit**

---

### Tarea 3: La portada y el armario público

**Archivos:** `src/app/page.tsx`, `src/app/armario/[alias]/page.tsx`.

La portada: atajos por talla, lo último publicado, y **una franja propia
de lotes**, que es el argumento del nicho. El armario: lo que esa persona
tiene en venta y lo que ha vendido, que es la mejor señal de que se puede
confiar en ella.

- [ ] **Paso 1: prueba de recorrido que publique y lo vea en la portada**
- [ ] **Paso 2: escribirlas**
- [ ] **Paso 3: commit**

---

### Tarea 4: Las páginas de aterrizaje y el umbral

**Archivos:** `src/lib/anuncios/direcciones-seo.ts`, las rutas de
`/lotes` y `/ropa`, `tests/unidad/direcciones-seo.test.ts`.

Las direcciones de la sección 7. Con dos reglas que se prueban aparte de
las pantallas, porque son lógica pura:

- Una talla que no esté en la lista cerrada es un **404**, no una página
  vacía.
- Los meses sueltos (`/ropa/talla/3-meses`) **redirigen** a su rango
  (`3-6-meses`). Una madre busca «ropa bebé 3 meses», no el rango; el
  código de talla sigue siendo el rango, el atajo vive solo aquí.
- Menos de diez anuncios → `robots: noindex`. Diez o más → indexable.

- [ ] **Paso 1: las pruebas de unidad de las direcciones y del umbral**
- [ ] **Paso 2: escribirlas**
- [ ] **Paso 3: commit**

---

### Tarea 5: Buscar

**Archivos:** `src/app/buscar/page.tsx`.

Todo lo que no sea una ruta limpia vive aquí, y esta página **nunca** se
ofrece a Google. Los filtros son un formulario con botones.

El texto se busca en título, marca y descripción. Hay que escaparlo: en
un `like` de PostgreSQL, `%` y `_` son comodines, y una búsqueda de
«100% algodón» no puede acabar devolviendo el catálogo entero.

- [ ] **Paso 1: prueba de que el texto con comodines no rompe nada**
- [ ] **Paso 2: escribirla**
- [ ] **Paso 3: commit**

---

### Tarea 6: El sitemap, el robots y la barra de abajo

**Archivos:** `src/app/sitemap.ts`, `src/app/robots.ts`, la barra.

En el sitemap solo entra lo que pasa el umbral: las fichas vivas y las
páginas de aterrizaje con diez anuncios o más. Las provincias nacen una
a una, cuando llegan a sus diez; no se crean las 52 de golpe.

La barra de abajo que pide la sección 8, con cuatro destinos en vez de
cinco —Inicio, Buscar, Publicar, Perfil—: los mensajes son del plan 4 y
un botón que no lleva a ninguna parte es peor que no tenerlo.

- [ ] **Paso 1: prueba de que el sitemap no ofrece páginas por debajo del umbral**
- [ ] **Paso 2: escribirlos**
- [ ] **Paso 3: commit**

---

## Qué queda fuera de este plan

Los favoritos, que necesitan tabla propia y sesión, y que sin catálogo
que recorrer no sirven de nada: entran al final de este plan o al
principio del cuarto. La mensajería (plan 4). El perfil del niño y el
aviso de siguiente talla (tramo B). La siembra asistida y el panel
(plan 5).
