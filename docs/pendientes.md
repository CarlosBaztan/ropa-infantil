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

## Las migraciones que faltan en producción

La base de pruebas va por la 0010. La de producción se quedó en la 0007,
así que allí todavía no existen los anuncios. Hay que aplicar, **en este
orden y en el proyecto `ropa-infantil-produccion`**:

      0008_anuncios.sql
      0009_fotos.sql
      0010_cerrar_los_permisos_de_columna.sql

Con `.\scripts\preparar-sql.ps1` se copia todo junto al portapapeles; se
pega en el editor SQL del panel de Supabase y se ejecuta. Hasta que estén,
publicar en la web desplegada da error.

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
