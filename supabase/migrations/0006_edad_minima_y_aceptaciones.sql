-- Correcciones de la revisión final de la rama.
--
-- Las tres primeras cierran agujeros reales; la cuarta arregla un cerrojo
-- que estaba puesto del revés.

----------------------------------------------------------------------
-- 1. La edad mínima de 18 años vive en la base de datos
--
-- Estaba solo en TypeScript, así que llamando a la API de registro
-- directamente con la fecha de un menor se conseguía cuenta. Es una
-- obligación legal, no una comodidad del formulario: comprar y vender son
-- contratos y un menor no puede obligarse.
--
-- No se puede usar una restricción CHECK porque PostgreSQL no admite
-- funciones que dependan de la fecha actual dentro de una restricción.
----------------------------------------------------------------------

create or replace function comprobar_mayoria_de_edad(fecha_nac date)
returns void language plpgsql as $$
declare
  -- Siempre el calendario de España, nunca el de Greenwich: entre las
  -- once de la noche y medianoche no son el mismo día, y medir en UTC
  -- rechazaba por menor a quien ya había cumplido los 18 aquí. Es el
  -- mismo fallo que ya se corrigió en TypeScript; no se reintroduce aquí.
  hoy date := (now() at time zone 'Europe/Madrid')::date;
begin
  if fecha_nac is null then
    raise exception 'Falta la fecha de nacimiento'
      using errcode = 'check_violation';
  end if;
  if fecha_nac > hoy then
    raise exception 'La fecha de nacimiento no puede ser futura'
      using errcode = 'check_violation';
  end if;
  if fecha_nac < hoy - interval '120 years' then
    raise exception 'La fecha de nacimiento no es verosímil'
      using errcode = 'check_violation';
  end if;
  -- Quien cumple 18 hoy pasa: la comparación es estricta a propósito.
  if fecha_nac > hoy - interval '18 years' then
    raise exception 'Hay que tener 18 años o más'
      using errcode = 'check_violation';
  end if;
end;
$$;

-- Al registrarse: si la fecha falta o no vale, no hay cuenta.
create or replace function crear_perfil_al_registrarse()
returns trigger language plpgsql security definer
set search_path = public as $$
declare
  fecha_nac date;
  marketing boolean;
begin
  begin
    fecha_nac := (new.raw_user_meta_data ->> 'fecha_nacimiento')::date;
  exception
    when others then fecha_nac := null;
  end;

  -- Antes se guardaba null y se dejaba pasar, con la idea de que ya lo
  -- corregiría en su perfil. Eso convertía la edad mínima en una
  -- sugerencia. Ahora el registro falla.
  perform comprobar_mayoria_de_edad(fecha_nac);

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

-- Y al editar el perfil: la fecha se puede corregir, pero no por una que
-- convierta a quien la pone en menor de edad.
create or replace function comprobar_edad_al_editar()
returns trigger language plpgsql
set search_path = public as $$
begin
  if new.fecha_nacimiento is distinct from old.fecha_nacimiento then
    perform comprobar_mayoria_de_edad(new.fecha_nacimiento);
  end if;
  return new;
end;
$$;

create trigger perfiles_edad_al_editar
  before update on perfiles
  for each row execute function comprobar_edad_al_editar();

----------------------------------------------------------------------
-- 2. El cerrojo de las columnas protegidas estaba del revés
--
-- Decía "si eres service_role, pasa", y auth.role() devuelve NULL fuera de
-- una peticion de la API. Resultado: desde el editor SQL del panel —que es
-- hoy la unica herramienta de administracion y como se aplican estas
-- mismas migraciones— un update sobre esas columnas decia "UPDATE 1" y no
-- cambiaba nada. En silencio, que es lo peor.
--
-- Ahora restringe solo a quien hay que restringir: la persona que ha
-- iniciado sesion.
----------------------------------------------------------------------

create or replace function proteger_columnas_de_perfil()
returns trigger language plpgsql security definer
set search_path = public as $$
begin
  if coalesce(auth.role(), '') <> 'authenticated' then
    return new;
  end if;
  new.bloqueado     := old.bloqueado;
  new.tipo_vendedor := old.tipo_vendedor;
  new.fecha_alta    := old.fecha_alta;
  new.id            := old.id;
  return new;
end;
$$;

----------------------------------------------------------------------
-- 3. La foto sale del permiso de escritura
--
-- La columna estaba abierta sin que nada la validara ni existiera pantalla
-- para subirla. Vuelve cuando exista la subida de imágenes.
----------------------------------------------------------------------

revoke update (foto) on table perfiles from authenticated;

----------------------------------------------------------------------
-- 4. La fecha de una aceptación deja de ser falsificable
--
-- El permiso de insercion abarcaba toda la fila, asi que quien aceptaba
-- podia elegir la fecha. Un registro cuya fecha elige el interesado no
-- sirve como prueba de cuando acepto.
----------------------------------------------------------------------

revoke insert on table aceptaciones from authenticated;
grant insert (usuario, documento_slug, documento_version)
  on table aceptaciones to authenticated;

create or replace function sellar_fecha_de_aceptacion()
returns trigger language plpgsql as $$
begin
  new.fecha := now();
  return new;
end;
$$;

create trigger aceptaciones_fecha_sellada
  before insert on aceptaciones
  for each row execute function sellar_fecha_de_aceptacion();
