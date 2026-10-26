-- Hace sitio al acceso con Google sin aflojar la edad mínima.
--
-- El problema: quien entra con Google no pasa por nuestro formulario, así
-- que no da su fecha de nacimiento, y la migración anterior rechazaba toda
-- cuenta sin ella. O se bloqueaba el acceso con Google, o se abría un
-- agujero por detrás.
--
-- La salida: la cuenta puede nacer sin fecha, pero no se puede publicar ni
-- escribir hasta declararla. La exigencia legal está donde de verdad
-- importa —no se puede contratar siendo menor— y no donde solo estorba.

----------------------------------------------------------------------
-- 1. El registro acepta que no venga fecha, pero no que venga mal
----------------------------------------------------------------------

create or replace function crear_perfil_al_registrarse()
returns trigger language plpgsql security definer
set search_path = public as $$
declare
  fecha_nac date;
  marketing boolean;
  trae_fecha boolean;
begin
  -- Se distingue "no la ha dado" (Google) de "la ha dado mal" (alguien
  -- llamando a la API con basura o con la fecha de un menor).
  trae_fecha := new.raw_user_meta_data ? 'fecha_nacimiento';

  if trae_fecha then
    begin
      fecha_nac := (new.raw_user_meta_data ->> 'fecha_nacimiento')::date;
    exception
      when others then fecha_nac := null;
    end;
    perform comprobar_mayoria_de_edad(fecha_nac);
  end if;

  begin
    marketing := coalesce(
      (new.raw_user_meta_data ->> 'acepta_marketing')::boolean, false);
  exception
    when others then marketing := false;
  end;

  insert into perfiles (id, fecha_nacimiento, acepta_marketing)
  values (new.id, fecha_nac, marketing)
  on conflict (id) do nothing;

  return new;
end;
$$;

----------------------------------------------------------------------
-- 2. Lo que antes se llamaba "tiene el correo verificado" ahora se llama
--    por lo que de verdad decide: si esta persona puede publicar.
--
--    Añade la condición que faltaba: haber declarado una fecha de
--    nacimiento de persona adulta. Quien entre con Google tendrá cuenta,
--    pero no podrá publicar hasta rellenarla en su perfil.
----------------------------------------------------------------------

drop function if exists tiene_correo_verificado();

create or replace function puede_publicar()
returns boolean language sql stable security definer
set search_path = public, auth as $$
  select coalesce(
    (select u.email_confirmed_at is not null
        and not p.bloqueado
        and p.fecha_nacimiento is not null
        and p.fecha_nacimiento
            <= (now() at time zone 'Europe/Madrid')::date - interval '18 years'
       from auth.users u
       join public.perfiles p on p.id = u.id
      where u.id = auth.uid()),
    false
  );
$$;

grant execute on function puede_publicar() to anon, authenticated;
