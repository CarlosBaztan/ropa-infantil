-- "Hay que verificar el correo antes de publicar" tiene que ser una regla
-- de la base de datos, no de la pantalla: si solo viviera en el formulario,
-- bastaría con llamar a la API directamente para saltársela.
--
-- La usarán las políticas de anuncios, mensajes y favoritos de los planes
-- siguientes.

create or replace function tiene_correo_verificado()
returns boolean language sql stable security definer
set search_path = public as $$
  select coalesce(
    (select correo_verificado and not bloqueado
       from perfiles
      where id = auth.uid()),
    false
  );
$$;

grant execute on function tiene_correo_verificado() to anon, authenticated;
