-- Perfiles: la tabla de personas, y la pieza de seguridad del proyecto.
--
-- Las reglas de "quién puede ver y modificar qué" viven aquí, en la base de
-- datos, no en el código de las pantallas. Aunque un día una pantalla tenga
-- un fallo, PostgreSQL sigue negando el acceso.

create type tipo_vendedor as enum ('particular', 'profesional');

create table perfiles (
  id uuid primary key references auth.users on delete cascade,
  alias text unique,
  foto text,
  provincia text,
  ciudad text,
  fecha_nacimiento date,
  -- Hoy siempre 'particular'. Existe desde el primer día para que admitir
  -- tiendas algún día no obligue a reescribir media base de datos.
  tipo_vendedor tipo_vendedor not null default 'particular',
  correo_verificado boolean not null default false,
  acepta_marketing boolean not null default false,
  bloqueado boolean not null default false,
  fecha_alta timestamptz not null default now(),
  -- Misma expresión que validarAlias en src/lib/validacion/perfil.ts: el
  -- alias va en la dirección pública /armario/<alias>.
  constraint alias_con_forma check (
    alias is null or alias ~ '^[a-z0-9][a-z0-9_-]{1,28}[a-z0-9]$'
  )
);

alter table perfiles enable row level security;

-- El proyecto no expone las tablas nuevas de forma automática: se abre a
-- mano, aquí, cuando sus reglas ya están escritas. Hacen falta las dos
-- cosas, el permiso de tabla y la política de fila.
grant select on table perfiles to anon, authenticated;
grant update (alias, foto, provincia, ciudad, fecha_nacimiento, acepta_marketing)
  on table perfiles to authenticated;

-- El catálogo se ve sin cuenta, así que el perfil público también.
create policy "los perfiles los lee cualquiera"
  on perfiles for select to anon, authenticated using (true);

-- Cada quien edita el suyo. Las columnas sensibles quedan fuera de su
-- alcance por dos vías: el grant de arriba, que no las incluye, y el
-- disparador de abajo, que las devuelve a su valor anterior.
create policy "cada quien edita su perfil"
  on perfiles for update to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);

-- No hay política de insert ni de delete: el perfil lo crea un disparador
-- al registrarse, y el borrado va en cascada desde auth.users, que es lo
-- que exige el derecho de supresión sin romper las conversaciones de la
-- otra parte.

create or replace function proteger_columnas_de_perfil()
returns trigger language plpgsql security definer
set search_path = public as $$
begin
  if auth.role() = 'service_role' then
    return new;
  end if;
  new.correo_verificado := old.correo_verificado;
  new.bloqueado         := old.bloqueado;
  new.tipo_vendedor     := old.tipo_vendedor;
  new.fecha_alta        := old.fecha_alta;
  new.id                := old.id;
  return new;
end;
$$;

create trigger perfiles_columnas_protegidas
  before update on perfiles
  for each row execute function proteger_columnas_de_perfil();

create or replace function crear_perfil_al_registrarse()
returns trigger language plpgsql security definer
set search_path = public as $$
begin
  insert into perfiles (id, correo_verificado)
  values (new.id, new.email_confirmed_at is not null)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger al_crear_usuario
  after insert on auth.users
  for each row execute function crear_perfil_al_registrarse();

create or replace function sincronizar_verificacion()
returns trigger language plpgsql security definer
set search_path = public as $$
begin
  update perfiles
     set correo_verificado = new.email_confirmed_at is not null
   where id = new.id;
  return new;
end;
$$;

create trigger al_verificar_correo
  after update of email_confirmed_at on auth.users
  for each row execute function sincronizar_verificacion();
