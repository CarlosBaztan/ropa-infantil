# Pendientes

Lo que está esperando una decisión o una acción tuya. Ordenado por lo que
más bloquea.

## Antes de enseñar la web a nadie

- [ ] **Tus datos para el aviso legal**: nombre o razón social, NIF,
      domicilio y correo de contacto. Van en `src/lib/legal.ts`. Mientras
      falten, las cuatro páginas legales muestran un aviso de borrador y no
      se ofrecen a Google.
- [ ] **Decidir qué domicilio publicar.** La ley obliga a que sea público.
      Si no quieres tu dirección de casa en internet, las salidas habituales
      son un domicilio profesional, el de una gestoría, o constituir una
      sociedad. Conviene resolverlo antes y no después.
- [ ] **Que un abogado revise los cuatro textos legales.** Están escritos
      con criterio, pero no por un abogado.

## Seguridad, cuanto antes

- [ ] **Cambiar la contraseña de la base de datos de pruebas.** Se escribió
      en una conversación de chat el 21/10/2026, así que ha quedado en un
      historial. Se cambia en Supabase → Project Settings → Database →
      Reset database password.
- [ ] **Aplicar la migración 0010 a producción.** Cierra un agujero real:
      los permisos por columna no estaban restringiendo nada, porque
      Supabase concede todo por omisión sobre cada tabla nueva y nuestros
      `grant` solo añadían. Desde el navegador se podía falsear la fecha de
      venta de un anuncio propio, o su fecha de publicación para dejarlo
      siempre arriba. **Ya está aplicada en pruebas y comprobada**; en
      producción no, porque allí todavía no están ni la 0008 ni la 0009.
      Van las tres juntas, en orden. Ver «Las migraciones que faltan».
- [ ] **Decidir si el repositorio debe ser público.** Lo creé privado y lo
      verifiqué en su momento; ahora está público. He vuelto a repasar todo
      el historial y no hay ninguna credencial, ningún valor de `.env` ni
      la contraseña que escribiste en el chat: el único archivo de entorno
      versionado es la plantilla vacía. O sea que daño no hay; es una
      decisión tuya, no una urgencia.
- [ ] Borrar la carpeta vacía `C:\Users\carlos3\Proyectos\ropa-infantil`,
      que quedó de cuando el proyecto estuvo fuera de OneDrive. Está vacía:
      no hay nada dentro, ni claves ni código. **No borres
      `OneDrive\Escritorio\APP mami`: ahí vive el proyecto.**

## Las migraciones que faltan

### En PRUEBAS: la 0012

La base de pruebas va por la 0011. La **0012**, que crea las
conversaciones y los mensajes, está escrita y **sin aplicar**: se me cerró
el navegador antes de poder pegarla. Mientras no esté, sus veinte pruebas
de permisos **se saltan en silencio** —no fallan, pero tampoco protegen
nada—. Lo veras en la salida de `npm test` como «20 skipped».

      .\scripts\preparar-sql.ps1 -Solo 0012

      https://supabase.com/dashboard/project/qbdlgxonjamdsagyjjes/sql/new

En cuanto esté, dímelo y compruebo que las veinte pasan. Es la tabla más
delicada del proyecto: un anuncio mal protegido deja que alguien cambie
un precio, pero una conversación mal protegida deja que un desconocido
lea dónde y a qué hora ha quedado una madre con otra.

### En PRODUCCIÓN: de la 0008 en adelante

Allí la base se quedó en la 0007, así que todavía no existen los anuncios
y publicar en la web desplegada da error. Hay que aplicar, en este orden,
en el proyecto `ropa-infantil-produccion`:

      0008_anuncios.sql
      0009_fotos.sql
      0010_cerrar_los_permisos_de_columna.sql
      0011_todo_el_mundo_tiene_alias.sql
      0012_conversaciones.sql   (después de probarla en pruebas)

Se copian juntas, en orden y en una sola transacción —si algo falla no se
aplica nada— con:

      .\scripts\preparar-sql.ps1 -Desde 0008

Y se pegan aquí, que es el editor SQL de producción:

      https://supabase.com/dashboard/project/mvdnoxdkychfgsyqkhrb/sql/new

Comprueba que arriba del panel pone **ropa-infantil-produccion** antes de
darle a Run. Tiene que contestar «Success. No rows returned».

Yo las dejé pegadas y listas, pero el último paso —darle a Run sobre
producción— no me deja darlo el sistema de seguridad, y me parece bien:
una migración en producción no es una acción que deba ejecutar sola.

Después, esta consulta tiene que devolver ocho tablas (hoy devuelve cinco):

      select table_name from information_schema.tables
       where table_schema = 'public' order by table_name;

## Para que el proyecto avance

- [ ] **Nombre y dominio.** Condiciona las direcciones, el SEO y los
      correos. Ahora mismo la web vive en `ropa-infantil.vercel.app`.
- [ ] **Cuántas horas semanales puedes dedicar**, y durante cuántos meses.
      Es el dato que más condiciona cómo se reparte el trabajo que queda.
- [ ] **La zona de arranque**: qué ciudad o comunidad, y si tienes acceso
      real a un grupo de madres allí. Sin eso, el riesgo número uno del
      proyecto —que el catálogo nazca vacío— no tiene mitigación.
- [ ] **Empezar a reunir las primeras familias.** No depende de que la web
      esté terminada, y es el trabajo que decide el proyecto.

## Cuando haya dominio

- [ ] **Conectar un servicio de correo propio** (Resend o similar) en
      Supabase → Authentication → Emails. El correo gratuito de Supabase
      manda unos pocos mensajes por hora y acaba en spam.
- [ ] **Actualizar las direcciones de retorno** en Supabase con el dominio
      nuevo, o los correos de verificación dejarán de funcionar.

## Cuando esto empiece a facturar

- [ ] **Pasar al plan de pago de Vercel.** El gratuito es para uso no
      comercial.
- [ ] **Darse de alta como autónomo** y contratar asesoría. El cálculo de
      costes está en el análisis de viabilidad.

## Para activar el acceso con Google

- [ ] **Crear las credenciales en Google Cloud** y pegarlas en Supabase.
      El código está hecho y probado; el botón no aparece hasta que
      existan. Los pasos están en `docs/despliegue.md`.

## Deuda técnica anotada, sin prisa

- [ ] Alojar la tipografía Inter en el propio servidor, para cumplir el
      diseño sin cargarla de un tercero.
- [ ] **Activar en la integración continua las pruebas de permisos.** Lo
      intenté y el sistema de seguridad me lo impidió, con razón: escribir
      en un almacén de secretos no es algo que deba hacer sin ti delante.
      Hay que añadir `SUPABASE_TEST_URL`, `SUPABASE_TEST_PUBLISHABLE_KEY` y
      `SUPABASE_TEST_SECRET_KEY` en GitHub (*Settings → Secrets and
      variables → Actions*) y descomentar las tres líneas señaladas en
      `.github/workflows/pruebas.yml`. **Solo las del proyecto de pruebas,
      nunca las de producción**: esas pruebas crean y borran usuarios sin
      preguntar.
- [ ] Quitar el ruido de `vitest.config.ts`, que se carga como CommonJS.
