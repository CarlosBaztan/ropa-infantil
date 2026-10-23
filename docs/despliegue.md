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

| Nombre | Valor |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://mvdnoxdkychfgsyqkhrb.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | La clave que empieza por `sb_publishable_` |

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
