-- "Hay que verificar el correo antes de publicar" tiene que ser una regla
-- de la base de datos, no de la pantalla: si solo viviera en el formulario,
-- bastaría con llamar a la API directamente para saltársela.
--
-- Lee el estado de verificación de auth.users, que es donde vive de verdad,
-- en lugar de una copia en perfiles. La copia se probó y se quedó desfasada
-- al primer intento, porque no controlamos en qué orden escribe Supabase en
-- su propio esquema.
--
-- La usarán las políticas de anuncios, mensajes y favoritos de los planes
-- siguientes.

create or replace function tiene_correo_verificado()
returns boolean language sql stable security definer
set search_path = public, auth as $$
  select coalesce(
    (select u.email_confirmed_at is not null and not p.bloqueado
       from auth.users u
       join public.perfiles p on p.id = u.id
      where u.id = auth.uid()),
    false
  );
$$;

grant execute on function tiene_correo_verificado() to anon, authenticated;
