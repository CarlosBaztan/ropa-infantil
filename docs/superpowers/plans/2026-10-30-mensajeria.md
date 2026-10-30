# Plan de implementación — Mensajería (plan 4 de 5)

**Objetivo:** que alguien pueda preguntar «¿sigue disponible?» y quedar.
Sin eso no se cierra una sola venta, y vender es el número con el que se
decide si este proyecto sigue adelante.

**Especificación:** sección 2 («Mensajería») del diseño del hito 1.
**Plan anterior:** `docs/superpowers/plans/2026-10-30-catalogo-y-busqueda.md`

## Restricciones

- **La conversación va atada a un anuncio.** No hay mensajería suelta
  entre personas: eso convierte la plataforma en un chat, con todo lo
  que trae —acoso, publicidad, contactos fuera de contexto— y sin
  ninguna de las ventajas. Atada al anuncio, la cabecera recuerda de qué
  se habla y quien vende puede marcar vendido desde ahí.
- **Solo texto.** Ni fotos ni archivos: la foto que importa está en el
  anuncio, y aceptar archivos abre la puerta a alojar cosas que no
  queremos alojar.
- **Un mensaje enviado no se reescribe.** Una conversación que se puede
  editar después no vale para resolver una discusión sobre lo que se
  acordó.
- **La fecha y el autor los pone la base de datos**, no quien escribe.
- **El aviso de seguridad, donde hace falta**: al abrir la conversación,
  no escondido en las condiciones.

---

### Tarea 1: Las tablas y sus permisos — HECHA (sin aplicar)

`supabase/migrations/0012_conversaciones.sql` y
`tests/permisos/conversaciones.test.ts`.

Es la tabla más delicada del proyecto. Un anuncio mal protegido deja que
alguien cambie un precio; una conversación mal protegida deja que un
desconocido lea dónde y a qué hora ha quedado una madre con otra. Por
eso las veinte pruebas son sobre todo de lo que NO se puede hacer: abrir
conversación en nombre de otra persona, inventarse quién vende, leer un
hilo ajeno, firmar un mensaje con el nombre del otro, poner fecha falsa
o reescribir lo enviado.

**La migración no está aplicada en ningún sitio**, así que esas veinte
pruebas se saltan. Está en `docs/pendientes.md`.

### Tarea 2: La bandeja y la conversación — HECHAS

`src/lib/mensajes/consulta.ts`, `src/app/mensajes/page.tsx`,
`src/app/mensajes/[id]/page.tsx`, `src/app/mensajes/acciones.ts`.

Preguntar se hace desde la ficha, con la caja y el texto ya escrito: sin
pantallas de por medio, porque cada pantalla intermedia es gente que no
pregunta. Abrir la conversación y mandar la primera pregunta son la
misma acción: una conversación vacía no le dice nada a quien vende.

Todo aguanta que la migración no esté puesta y lo dice en pantalla en
vez de devolver un error del servidor. Comprobado de punta a punta.

### Tarea 3: El aviso por correo — PENDIENTE

Lo único que impide que una conversación muera sin app. **Depende de
algo que no es código**: el correo gratuito de Supabase manda unos pocos
mensajes por hora y acaba en spam, así que hace falta un servicio propio
(Resend o similar) y un dominio. Las dos cosas están en
`docs/pendientes.md`.

Cuando lo haya: un aviso por conversación y no por mensaje, con un
resumen si llegan varios seguidos, y un enlace directo al hilo.

### Tarea 4: Marcar vendido desde la conversación — PENDIENTE

Hoy la conversación recuerda que se puede hacer y enlaza a «Tus
anuncios». Falta el botón ahí mismo. Es pequeño y conviene hacerlo con
la migración ya aplicada, para poder probarlo de verdad.

### Tarea 5: Denuncia y bloqueo — PENDIENTE (plan 5)

La especificación los sitúa en «lo imprescindible alrededor». La base
ya tiene la columna `bloqueado` y las políticas de mensajes ya la miran:
quien esté bloqueado no puede abrir conversación ni escribir. Falta la
pantalla de denunciar y el panel para actuar.

---

## Qué falta para poder decir que la mensajería está terminada

1. Aplicar la 0012 en pruebas y ver pasar sus veinte pruebas.
2. Una prueba de recorrido completo: dos cuentas, una pregunta, una
   respuesta, y que ninguna de las dos vea la conversación de nadie más.
3. El aviso por correo, cuando haya dominio y servicio de correo.
4. El botón de marcar vendido dentro de la conversación.
