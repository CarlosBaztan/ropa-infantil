# Diseño — Marketplace de ropa infantil de segunda mano · Hito 1

**Fecha:** 20 de octubre de 2026
**Estado:** 🟢 Diseño cerrado en lo esencial — los cuatro cambios estratégicos están aprobados e incorporados, y el orden de lanzamiento decidido (sección 3). Pendiente de tu revisión final del documento completo.
**Documento hermano:** el análisis de viabilidad —mercado, competencia, riesgos, gastos y burocracia— está en `docs/analisis/`.
**Informes integrados:** competencia ✅ · legal ✅ · SEO ✅ · interfaz ✅

---

## 1. Qué es esto y para quién

Una plataforma española donde madres y padres **venden la ropa que sus hijos ya no usan y compran la talla siguiente**. Compraventa entre particulares, no tienda propia.

La categoría funciona porque un bebé cambia de talla cada dos o tres meses: la ropa sale del armario casi sin usar. La oferta es abundante y gratuita y —lo más importante— **el que vende es el mismo que compra**.

Pero el análisis de competencia cambió la tesis del proyecto, y conviene tenerla escrita en una frase:

> **No competimos con Vinted en catálogo. Competimos en lo que Vinted no puede hacer: el lote por talla y temporada, la entrega local sin portes, y saber qué talla usará tu hijo dentro de cuatro meses.**

Vinted no falla en la talla: falla en el **envío**. Un body de 3 € le cuesta al comprador cerca de 8 € entre tasa y porte, y por eso no se vende. Los lotes y la entrega en mano arreglan precisamente eso.

### Decisiones cerradas

| Decisión | Elegido |
|---|---|
| Modelo | Compraventa entre particulares (C2C) |
| Unidad de venta principal | **El lote por talla y temporada**, no la prenda suelta |
| Vendedores profesionales (B2C) | Fase posterior; el diseño lo admite sin reescribir |
| Punto de partida | De cero: sin stock ni negocio detrás |
| Secuencia | Catálogo primero; pagos y envío gestionado en el hito 2 |
| Entrega | En mano destacada y gratuita; **envío permitido desde el día uno, acordado entre las partes** |
| Mercado | Catálogo nacional; captación concentrada en una zona |
| Quién construye | Tú y yo; posible freelance más adelante |
| Plataforma | Web que funciona como una aplicación en el móvil |
| Monetización del hito 1 | **Ninguna.** Cualquier comisión sin liquidez expulsa la poca oferta que haya |

### Qué cuenta como éxito, y cuándo se abandona

A las seis semanas del lanzamiento: **250** anuncios publicados, **40** cuentas verificadas, **60** conversaciones, **25** ventas cerradas y —el único número que no se puede maquillar— **15 personas que publican por segunda vez**.

Por debajo de 100 anuncios, o sin repetición, el hito 2 no se construye. El criterio completo está en la sección 9 del análisis de viabilidad.

---

## 2. Qué se construye

### Cuentas y perfil
- Registro con correo y contraseña, y acceso con Google.
- **Verificación del correo obligatoria antes de publicar**: la barrera antispam más barata que existe.
- **Mayores de 18 años** (comprar y vender son contratos), con campo de fecha de nacimiento.
- **El catálogo se ve sin cuenta.** Solo se pide cuenta para publicar, guardar o escribir. No es comodidad: si el catálogo exigiera registro, Google no podría verlo y perderíamos el único canal gratuito que tenemos.
- Perfil público: alias, foto opcional, provincia, antigüedad, prendas publicadas y vendidas, y pestañas *En venta* / *Vendido*.
- Ubicación: **provincia y ciudad, nunca la dirección.**

### Publicar: prenda o lote

**El lote es un anuncio de primera clase, no una casilla.** Al publicar, lo primero que se elige es qué se está vendiendo:

| | Prenda suelta | **Lote** |
|---|---|---|
| Talla | Una | **Rango** (de 3 a 6 meses) |
| Piezas | 1 | Número, con control de más y menos |
| Precio | Precio | Precio **y precio por pieza calculado en vivo** |
| Desglose | — | Opcional: *5 bodies, 3 pantalones, 2 jerséis* |
| Temporada | Opcional | **Destacada**, porque es el criterio de compra |

El precio por pieza en vivo —*"1,00 €/pieza"*— es el argumento de venta del nicho y ningún generalista lo muestra.

**El flujo son tres pasos y una revisión**, con el principio de *una mano, un pulgar, un minuto*:

1. **Fotos** — al pulsar publicar se abre la cámara directamente, sin pantalla en blanco. Una obligatoria, hasta cinco, reordenables.
2. **Qué es** — prenda o lote, talla o rango, categoría, temporada, género. Todo con botones grandes, **sin teclado y sin desplegables**.
3. **Precio y entrega** — teclado numérico, estado de conservación, y cómo se entrega (ver abajo).

Y los detalles que deciden si alguien termina o abandona:

- **El título se genera solo** y es editable: *"Lote de 12 bodies · talla 3-6m"*.
- **Borrador automático:** la publicación sobrevive a que el bebé se despierte.
- **"Publicar y subir otro igual"**, que repite todo menos las fotos. Imprescindible para quien vacía un armario entero, que es el caso real.
- **Campo opcional de defectos**, destacado en la ficha: declarar una mancha genera más confianza que esconderla.
- **Lista de comprobación del estado** específica de lo infantil: bolitas, manchas, costuras, y si la prenda talla grande o pequeño. Ataca la queja documentada número dos de Vinted.
- Nunca se bloquea el botón de continuar: si falta algo, se señala al revisar.

### Entrega: en mano destacada, envío permitido

Cada anuncio dice cómo se puede recibir:

- **Entrega en mano** con zona o punto de encuentro (un barrio o un punto público, nunca una dirección). Es la opción destacada: **cero euros de porte es lo que hace vendible un lote de 15 €.**
- **Acepto envío**, que comprador y vendedor acuerdan por el chat. La plataforma **no** genera etiquetas ni cobra: eso es el hito 2.
- Una **página con tres a cinco puntos de intercambio** pactados a mano con comercios, escuelas infantiles o centros cívicos de la zona de arranque. Es una página, no una función: se pacta hablando con gente.

El envío es malo para la prenda suelta barata y perfectamente razonable para un lote: 8 € de porte sobre un lote de 45 € es un 18 %, como cualquier compra por internet. Al hacer del lote el producto principal, el envío pasa a ser viable.

**El coste honesto de esta decisión:** sin pago retenido, un envío entre desconocidos tiene riesgo de fraude. No se puede evitar en el hito 1. Se mitiga con un aviso claro en la primera conversación, recomendando la entrega en mano cuando ambos están cerca, y con la antigüedad y la actividad visibles en el perfil. Habrá algún incidente: es el precio de no construir los pagos todavía.

### Catálogo y búsqueda
- Portada con atajos por talla, novedades y **una franja propia de lotes**.
- Rejilla de dos columnas, foto vertical, carga con botón y no desplazamiento infinito.
- **Cada tarjeta muestra:** foto, distintivo *LOTE · 12 piezas* cuando procede, precio, precio por pieza, talla o rango, estado, temporada y provincia. Nada del nombre del vendedor: es ruido.
- Filtros en dos niveles: botones rápidos (talla, lotes, cerca de mí, precio) y una hoja completa con el resto.
- **La talla admite selección múltiple**, porque un bebé siempre está a caballo entre dos.
- **Orden por cercanía por defecto, sin excluir a nadie.** El catálogo es nacional desde el día uno: con poca oferta, dejar fuera a quien está en otra provincia sería absurdo.
- Guardar en favoritos.

### El perfil del niño y el aviso de siguiente talla — tramo B

El foso del proyecto, y lo único difícil de copiar: Vinted es un catálogo de prendas; criar a un niño es un ciclo de crecimiento.

- Registras a tu hijo con su fecha de nacimiento y, si quieres, un alias.
- La plataforma **sugiere** la talla según la edad, y tú la corriges: los niños varían mucho y la talla real manda sobre la edad.
- **La talla avanza sola con el tiempo.**
- **Avisos por correo cuando entra algo compatible** con su talla actual o la siguiente: un resumen diario, nunca un correo por anuncio.

Esto convierte una compra puntual en una recurrencia cada tres o cuatro meses, que es la diferencia entre una web y un negocio.

### Siembra asistida
Una pantalla para que **tú publiques el armario de otra familia**, quedando ella como vendedora. Sin oferta no hay plataforma, y el día del lanzamiento el catálogo no puede tener once anuncios.

Dos detalles que no son opcionales: la familia **recibe una invitación por correo y confirma**, porque estamos publicando en su nombre y usando sus datos; y el anuncio guarda quién lo publicó materialmente, aparte de quién vende.

### Lo imprescindible alrededor
- Cuatro páginas legales: aviso legal, condiciones, privacidad y cookies.
- Denuncia en cada anuncio, perfil y conversación, con respuesta motivada.
- Panel mínimo para ti: ver lo publicado, ocultar un anuncio, bloquear a un usuario.

### Mensajería
- Conversación **ligada a un anuncio concreto**, con la cabecera recordándolo.
- Solo texto, con respuestas sugeridas de un toque.
- **Aviso por correo cuando alguien te escribe.** Sin app, es lo único que impide que la conversación muera.
- El vendedor marca vendido desde la conversación.
- Mensaje del sistema con consejos de encuentro y de envío seguro al abrir la primera conversación.

---

## 3. El orden de lanzamiento (decidido)

Con los cuatro cambios dentro, el hito 1 creció, así que se parte en dos tramos muy seguidos. **Decidido el 21 de octubre de 2026: se lanza el tramo A, y el tramo B llega dos o tres semanas después.**

**Tramo A — lo que se lanza:** cuentas, anuncios de prenda y de lote, entrega y envío, búsqueda y filtros, favoritos, mensajería, siembra asistida, páginas legales y panel mínimo.

**Tramo B — dos o tres semanas después del lanzamiento:** el perfil del niño y los avisos de siguiente talla.

**Por qué en ese orden, y no antes:** un aviso de "ha entrado un lote de talla 3-6 meses" no tiene valor si no hay lotes que avisar. El día del lanzamiento, con cincuenta anuncios, el sistema de avisos apenas se dispararía; en la semana tres, con doscientos, empieza a tener sentido. Construirlo antes del lanzamiento es trabajo que no se usa; construirlo justo después es cuando rinde.

La siembra asistida, en cambio, va **antes** del lanzamiento: es lo que crea el catálogo que el lanzamiento necesita.

El criterio que lo sostiene: en este proyecto el enemigo es el tiempo sin usuarios.

---

## 4. Qué queda fuera, a propósito

Gestión del envío (etiquetas, seguimiento), pago retenido, valoraciones, aplicación nativa, verificación de identidad, verificación por teléfono (los SMS cuestan dinero), devoluciones, fotos en el chat, avisos de bajada de precio, seguir a vendedores y recomendaciones.

---

## 5. Arquitectura

```
   Móvil / navegador
          |
   [ Next.js en Vercel ]  ← la web y su servidor
          |
   [ Supabase · región UE ]  ← PostgreSQL + cuentas + fotos
          |
   [ Correo transaccional ]  ← avisos de mensaje y de talla
```

Tecnología mayoritaria y documentada, capa gratuita para arrancar, sin servidores que administrar y con PostgreSQL por debajo, que es el estándar y es portable.

No montamos servidor propio, no programamos el sistema de contraseñas a mano —es donde se cometen los fallos de seguridad— y no usamos una base de datos de moda para datos que son de tabla.

**La pieza de seguridad clave** es la seguridad a nivel de fila de PostgreSQL: las reglas de quién ve y modifica qué viven en la base de datos, no en el código. Aunque un día metamos la pata en una pantalla, nadie puede editar los anuncios de otro.

**Cómo encaja el hito 2 sin reescribir:** el pago retenido y el envío gestionado se añaden sobre los mismos anuncios y conversaciones. Lo que lo hace posible es que ya guardamos el precio en céntimos, el tipo de vendedor y la situación de cada anuncio.

---

## 6. Modelo de datos

**La regla que lo gobierna todo:** talla, categoría, género, estado, temporada, marca y provincia son **listas cerradas, nunca texto libre**. Si la talla es texto libre, el filtro por talla —la razón por la que alguien entra aquí— no funciona nunca, y la estructura de direcciones se viene abajo.

**`perfiles`** — `id` · `alias` · `foto` · `provincia` · `ciudad` · `fecha_nacimiento` · `fecha_alta` · `correo_verificado` · `bloqueado` · `tipo_vendedor` *(particular o profesional: hoy siempre particular, y es lo que permitirá el B2C sin tocar nada más)*

**`anuncios`** — una tabla para prenda y lote, porque comparten fotos, conversaciones, favoritos y búsqueda:
`id` · `id_publico` *(seis caracteres, inmutable: va en la dirección y permite reescribir el texto sin romper el enlace)* · `slug` + histórico · `vendedor` · **`publicado_por`** *(siembra asistida)* · **`tipo`** (prenda o lote) · `titulo` · `descripcion` · `defectos` · `talla` · **`talla_hasta`** *(rango de los lotes)* · **`numero_piezas`** · **`desglose`** · `categoria` · `tipo_prenda` · `genero` · `marca` · `color` · `estado_conservacion` · **`talla_real`** (grande / normal / pequeña) · `temporada` · `precio_centimos` · **`acepta_entrega_mano`** · **`acepta_envio`** · **`zona_encuentro`** · `provincia` · `ciudad` · `situacion` (activa · reservada · vendida · retirada) · `publicada_el` · `vendida_el` · `actualizada_el`

**`tallas`** — la tabla más importante del proyecto:
`id` · `grupo` (meses / años) · `codigo` (*0-3-meses*, *3-meses*, *2-anos*…) · `talla_eu` · `edad_meses_min` · `edad_meses_max` · `orden`

**`ninos`** — `id` · `usuario` · `alias` · `fecha_nacimiento` · `talla_actual` *(sugerida por la edad, corregible a mano: la talla real manda)* · `genero`

**`avisos`** — `id` · `usuario` · `nino` · `tallas` · `temporada` · `categoria` · `precio_maximo` · `activo` · `ultimo_envio`

**`fotos`** — `id` · `anuncio` · `url` · `orden` · `ancho` · `alto` *(obligatorios: sin ellos la página salta al cargar)* · `texto_alternativo`

**`conversaciones`** — `id` · `anuncio` · `comprador` · `vendedor` · `fecha` · `cerrada`

**`mensajes`** — `id` · `conversacion` · `autor` · `texto` · `fecha` · `leido_el`

**`favoritos`** — `usuario` · `anuncio` · `fecha`

**`denuncias`** — `id` · `objeto` · `denunciante` · `motivo` · `texto` · `situacion` · `decision` *(la ley exige respuesta motivada y registro de decisiones)*

**`documentos_legales`** y **`aceptaciones`** — qué versión aceptó cada usuario y cuándo.

**`paginas_de_catalogo`** — `ruta` · `tipo` · `anuncios_activos` · `precio_minimo` · `indexable` · `texto_introductorio`

---

## 7. Direcciones y visibilidad en Google

El único canal de captación gratuito que vas a tener, y condiciona cómo se construyen las páginas.

```
/anuncio/lote-invierno-nina-2-anos-a7f3k2     ← ficha
/lotes                                         ← lotes (muy buscado)
/lotes/talla/3-6-meses                         ← lotes por talla
/ropa/nina/3-6-meses                           ← género + talla
/ropa/nina/vestidos                            ← género + categoría
/marca/zara                                    ← marca
/ropa-segunda-mano/{ciudad}                    ← la zona de arranque
/buscar?...                                    ← todo lo demás, nunca indexable
```

**La regla dura:** ruta limpia, puede aparecer en Google; con interrogación, nunca. Los filtros no indexables se construyen como botones, no como enlaces.

**Umbral de existencia:** una página de catálogo se ofrece a Google solo con **10 anuncios o más**. Por debajo existe para el usuario pero se le pide a Google que la ignore. Evita el error que hunde a los marketplaces pequeños: miles de páginas vacías. Con 250 anuncios saldrán unas 25-40 páginas útiles, y eso es lo correcto.

**Las provincias nacen una a una**, cuando alcanzan sus 10 anuncios. No se crean las 52 de golpe.

**Los anuncios vendidos no se borran:** su página sigue viva marcada como vendida, con un bloque de alternativas disponibles. Captura las búsquedas muy concretas, que serán tu único tráfico realista al principio.

**Dieciocho páginas de aterrizaje desde el primer día**, encabezadas por `/lotes`, las tallas de bebé (`0-3-meses`, `3-6-meses`, `6-9-meses`, `9-12-meses`, `12-18-meses`, `18-24-meses`), las de niño (`2-anos` y `4-anos`), categorías (abrigos, pijamas, vestidos, bodies), marcas y la canastilla de recién nacido.

**Sobre los códigos de talla:** la lista canónica usa rangos, que es como viene etiquetada la ropa infantil en España. Pero una madre busca "ropa bebé 3 meses", no "3-6 meses", así que en el plan 3 las direcciones de mes suelto (`/ropa/talla/3-meses`) existirán como atajos que redirigen a su rango. El código de talla, que es inmutable y va en la base de datos, se queda en rangos; el atajo vive solo en la capa de direcciones.

---

## 8. Interfaz y sistema visual

Barra inferior fija de cinco destinos —Inicio, Buscar, **Publicar**, Mensajes, Perfil— con el botón de publicar elevado y en color de acento, porque es el motor del catálogo.

La paleta huye del rosa y el azul bebé: neutros cálidos de lino, verde eucalipto como principal y terracota como acento. Contrastes verificados para accesibilidad en claro y oscuro.

```
Claro:  fondo #FFFCF8 · texto #1C2420 · principal #0F6B5C · acento #B4543A
Oscuro: fondo #10161A · texto #ECF1EF · principal #5FD1B8 · acento #E8907A
Tipografía: Inter, con números tabulares en los precios
Zona táctil mínima: 48 px
```

**Los estados vacíos importan más de lo normal**, porque al principio se verán constantemente: en lugar de un hueco en blanco, cada uno propone algo ("sé la primera en publicar un lote de talla 3 meses") y, si una provincia está vacía, muestra resultados del resto de España.

**Confianza sin valoraciones ni pagos protegidos**, que es el problema de este hito: perfil humano con antigüedad y actividad, los cuatro niveles de estado explicados con palabras, el campo de defectos destacado, la lista de comprobación del estado, fotos propias obligatorias, y denunciar y bloquear siempre a un toque.

**Accesibilidad** desde el diseño: zonas táctiles de 48 píxeles, foco visible, manejable con teclado y lector de pantalla, ampliación al 200 % sin romperse, y el color nunca como única señal.

---

## 9. Qué puede ir mal y qué hacemos

| Riesgo | Qué hacemos |
|---|---|
| **Fotos de menores** | Prohibidas las fotos con personas, con aviso en el propio subidor, **borrado de los datos de GPS que el móvil mete en la foto**, denuncia específica y revisión humana. Es el mayor riesgo reputacional y legal de esta plataforma |
| **Fraude en un envío sin pago retenido** | Aviso claro en la primera conversación, entrega en mano recomendada cuando ambos están cerca, antigüedad y actividad visibles. No se puede eliminar en el hito 1 |
| **Catálogo vacío** | El riesgo real del proyecto. Se combate con la siembra asistida y a mano, no programando |
| **El grupo de WhatsApp es más cómodo** | El filtro por talla, el aviso de siguiente talla y el precio por pieza son cosas que un grupo no puede hacer |
| Fotos enormes del móvil | Se redimensionan en el teléfono antes de subir |
| Estafas y spam | Correo verificado, límite de publicaciones en cuentas nuevas, denuncia en un toque, bloqueo manual |
| El usuario borra su cuenta | Sus anuncios se retiran y sus mensajes se anonimizan, conservando la conversación de la otra parte |
| Nadie vuelve | Avisos por correo de mensaje nuevo y de talla nueva. Sin app, el correo es el único hilo |
| Se cae un proveedor | Copias de seguridad diarias y datos en PostgreSQL, que es portable |

---

## 10. Cómo lo probamos

Pruebas antes que código, concentradas donde un fallo cuesta dinero o confianza:

1. **Reglas de permisos**, lo primero: que nadie edite anuncios ajenos ni lea conversaciones de otros. Contra la base de datos.
2. **Reglas de publicación:** no se publica sin foto, talla, categoría, estado ni precio; un lote exige número de piezas y rango válido; el precio no puede ser cero.
3. **El precio por pieza** se calcula bien, incluido el redondeo.
4. **Búsqueda y filtros:** que "talla 3 meses" devuelva las prendas de esa talla **y los lotes cuyo rango la contiene**. Es la prueba que más fácil se rompe y la que más importa.
5. **El avance de talla del niño** con el paso del tiempo, y que el aviso se dispare solo con anuncios compatibles *(tramo B)*.
6. **El umbral de indexación:** que una página con menos de 10 anuncios no se ofrezca a Google. Automática, porque es un error invisible y caro.
7. **Que se borren los datos de GPS** de toda foto subida. No negociable.
8. **Un recorrido completo:** registrarse → publicar un lote → encontrarlo buscando por talla → escribir → recibir el aviso por correo.
9. **Y la prueba que ningún programa sustituye:** publicar un lote de verdad desde un móvil de verdad, con una mano, cronómetro en marcha.

---

## 11. Obligaciones legales que condicionan la construcción

No son opcionales ni son "para después": cada una es un campo, una pantalla o un proceso. El detalle está en el análisis de viabilidad.

**Decisiones técnicas previas a escribir código**

1. **La base de datos se crea en región de la Unión Europea.** Es una casilla al crearla; después es una mudanza.
2. **Se borran los datos de localización de las fotos.** Publicarlos sería publicar dónde vive una familia con niños pequeños.
3. **Tablas `documentos_legales` y `aceptaciones`**, con versión.
4. **Edad mínima de 18 años**, con fecha de nacimiento.
5. **Analítica sin cookies**, para no necesitar un banner invasivo.

**Reglas de producto que vienen de la ley**

- **No existe la casilla "acepto la política de privacidad".** La privacidad se informa; lo que lleva casilla propia es el marketing. Es el error más común del sector.
- **Cuatro páginas legales** desde el primer día. El aviso legal obliga a publicar nombre, NIF y domicilio del titular.
- **Denuncia con respuesta motivada**, contacto publicado y política de moderación escrita en las condiciones.
- **Prohibidas las fotos con personas**, con aviso en el subidor y revisión humana.
- **Artículos prohibidos por seguridad infantil**, como categorías no seleccionables más una comprobación al publicar: ropa con cordones en capucha, cuello o pecho (lo prohíbe una norma específica para prendas de hasta 14 años), sillas de coche, cascos, cunas, colchones, nidos, chupetes, biberones, sacaleches, leche de fórmula y cosmética abierta.
- **Borrado de cuenta que anonimiza los mensajes** y exportación de los datos del usuario.

**Y una decisión del hito 2 que condiciona el diseño:** retener dinero ajeno es prestar un servicio de pago y requiere autorización del Banco de España. Se resuelve con Stripe Connect configurado de modo que **el dinero nunca entre en una cuenta nuestra** y la verificación de identidad la haga Stripe. Nunca un IBAN propio como depósito.

---

## 12. Lo que cuesta

| Etapa | Coste |
|---|---|
| Construir y lanzar | **0 €** más el dominio, unos 12 €/año |
| Con usuarios de verdad | **~60 €/mes** (alojamiento, base de datos, correos) |
| Captación del hito 1 | **0-150 € en total**, no mensual. El canal es la comunidad, no el anuncio |
| Hito 2, facturando | **~250 €/mes** de coste fijo, incluyendo autónomo y asesoría |

El detalle, los costes ocultos y el punto de equilibrio están en el análisis de viabilidad. El resumen: **55 lotes al mes cubren los costes del hito 2; 500 prendas sueltas al mes no son alcanzables.** Por eso el lote es el producto principal.

---

## 13. Lo que necesito que decidas

1. **Cuántas horas a la semana puedes dedicar**, que es el dato que más condiciona el plan de implementación.
2. **La zona de arranque**, que tiene que ser un sitio donde puedas conseguir a mano las primeras cincuenta familias.
3. **Nombre y dominio.**
4. **¿Hay problema con que tu nombre, NIF y domicilio sean públicos** en el aviso legal? Si lo hay, se resuelve antes de lanzar, no después.

---

*Diseño del hito 1. El siguiente paso, cuando esto esté aprobado, es el plan de implementación detallado.*
