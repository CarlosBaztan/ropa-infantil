# Cómo desplegar

Estado: el repositorio está en GitHub y la integración continua pasa. Falta
conectar Vercel, que son unos minutos y tienes que hacer tú porque implica
entrar en tu cuenta.

## 1. Conectar el repositorio con Vercel

1. Entra en **vercel.com** y crea la cuenta (el plan gratuito sobra para
   empezar). Hazlo con **"Continue with GitHub"**: así Vercel ve tus
   repositorios sin más configuración.
2. **Add New → Project**.
3. Busca **`ropa-infantil`** e **Import**. Si no aparece, pulsa *Adjust
   GitHub App Permissions* y dale acceso: el repositorio es privado.
4. **No toques la configuración de compilación.** Vercel detecta Next.js
   solo y acierta.
5. **Antes de pulsar Deploy**, despliega *Environment Variables* y añade
   las dos de abajo. Si despliegas sin ellas, la compilación falla.

## 2. Las variables de entorno

Solo dos, y son las de **producción**, no las de pruebas. Están en Supabase,
en el proyecto `ropa-infantil-produccion`, en *Project Settings → API Keys*:

**Cuidado al copiar: sin comillas ni acentos graves alrededor.** Si copias de
un texto con formato, es fácil que se cuelen y Vercel los toma como parte del
nombre o del valor. Los campos tienen que quedar exactamente así:

Primera variable — nombre:

    NEXT_PUBLIC_SUPABASE_URL

valor:

    https://mvdnoxdkychfgsyqkhrb.supabase.co

Segunda variable — nombre:

    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

valor: la clave del proyecto de producción que empieza por sb_publishable_
(Supabase → Project Settings → API Keys → Publishable key).

No marques ninguna de las dos como *sensible*: son públicas por definición
—viajan al navegador de cada visitante— y marcarlas solo impide que puedas
volver a leerlas desde el panel.

**La clave secreta NO se pone en Vercel.** La aplicación no la usa: actúa
siempre en nombre de quien ha iniciado sesión, y quien decide qué puede
hacer cada persona es PostgreSQL. Cuanto menos viaje esa clave, mejor.

Pulsa **Deploy**. En un par de minutos tendrás una dirección del tipo
`ropa-infantil-xxxx.vercel.app`.

## 3. La trampa: avisar a Supabase de la dirección nueva

**Esto hay que hacerlo o los correos de verificación no funcionarán.**
Supabase solo acepta devolver a las direcciones que conoce, y ahora mismo
solo conoce `localhost`.

En el panel de Supabase del proyecto de **producción**, en
*Authentication → URL Configuration*:

- **Site URL**: la dirección que te haya dado Vercel.
- **Redirect URLs**: añade `https://<tu-direccion>/auth/callback`.

Si luego pones un dominio propio, hay que volver aquí y actualizarlo.

## 4. Comprobar que funciona de verdad

No des el despliegue por bueno hasta haber hecho esto, **desde el móvil**:

1. Abre la portada.
2. Crea una cuenta con un correo tuyo real.
3. **Comprueba que llega el correo de verificación** y que el enlace te
   lleva a tu perfil. Es el paso que más falla, y casi siempre es por el
   punto 3.
4. Ponte un alias y mira que tu armario público se vea.
5. Cierra sesión y vuelve a entrar.

## 5. Antes de enseñárselo a nadie

- **Rellena tus datos en `src/lib/legal.ts`** (nombre, NIF, domicilio y
  correo). Mientras falten, las cuatro páginas legales se muestran con un
  aviso de borrador y no se ofrecen a Google.
- **Que un abogado revise los cuatro textos.** Están escritos con criterio,
  pero no por un abogado.

## Activar el acceso con Google

El código está hecho y probado, pero **el botón no aparece** hasta que
existan las credenciales, que solo puedes crear tú. Mientras tanto la web
funciona con correo y contraseña con normalidad.

1. En **console.cloud.google.com**, crea un proyecto.
2. *APIs y servicios → Pantalla de consentimiento de OAuth*: tipo
   **Externo**, pon el nombre de la plataforma y tu correo de contacto.
3. *Credenciales → Crear credenciales → ID de cliente de OAuth*, tipo
   **Aplicación web**. En **URI de redirección autorizados** pega la que
   te da Supabase en *Authentication → Sign In / Providers → Google*
   (termina en `/auth/v1/callback`).
4. Copia el **ID de cliente** y el **secreto de cliente** y pégalos en esa
   misma pantalla de Supabase, en el proyecto de **producción**. Activa el
   proveedor.
5. En Vercel, añade la variable `NEXT_PUBLIC_ACCESO_GOOGLE` con valor `1`
   y vuelve a desplegar. El botón aparecerá.

Para que funcione también en tu equipo, repite los pasos 3 y 4 en el
proyecto de **pruebas** y añade la misma variable a tu `.env.local`.

**Una consecuencia que conviene entender:** quien entre con Google no pasa
por nuestro formulario, así que no declara su fecha de nacimiento. La
cuenta se crea igual, pero **no podrá publicar ni escribir a nadie hasta
rellenarla en su perfil**, y al entrar verá un aviso diciéndoselo. La
edad mínima sigue siendo obligatoria; se exige al contratar, que es donde
la ley la pide, en lugar de al entrar.

## Un aviso sobre el correo

Supabase envía los correos de verificación con un servicio compartido y muy
limitado: unos pocos por hora, y es fácil que acaben en spam. Para el
lanzamiento de verdad hay que conectar un servicio de correo propio (Resend
o similar) en *Authentication → Emails*. Con el dominio ya decidido, es
media hora de trabajo.

## El límite del plan gratuito de Vercel

El plan Hobby es para uso **no comercial**. En cuanto esto sea un negocio
—en cuanto haya comisiones— hay que pasar al plan de pago, unos 20 $ al
mes. Mientras sea una prueba sin ingresos, el gratuito vale.
