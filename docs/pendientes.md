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
- [ ] **Borrar la carpeta vieja** `C:\Users\carlos3\OneDrive\Escritorio\APP mami`.
      Todavía contiene un `.env.local` con la clave secreta del proyecto de
      pruebas. Bórrala entera, no la vacíes.

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

## Deuda técnica anotada, sin prisa

- [ ] Alojar la tipografía Inter en el propio servidor, para cumplir el
      diseño sin cargarla de un tercero.
- [ ] Activar en la integración continua las pruebas de permisos, añadiendo
      los secretos del proyecto de pruebas en GitHub. Las tres líneas que
      hay que descomentar están en `.github/workflows/pruebas.yml`.
- [ ] Quitar el ruido de `vitest.config.ts`, que se carga como CommonJS.
