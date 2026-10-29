-- Nadie se queda sin nombre
--
-- EL FALLO. El alias es opcional y nada lo exige para publicar, así que
-- un anuncio podía quedarse sin ninguna forma de nombrar a quien vende y
-- sin enlace a su armario. En una plataforma donde dos desconocidas
-- quedan en la puerta de un metro para intercambiar ropa y dinero, eso no
-- es un detalle de maquetación: la confianza es el producto.
--
-- POR QUÉ NO SE EXIGE AL PUBLICAR. Era la salida evidente —añadir
-- `alias is not null` a puede_publicar()— y es peor. El objetivo del
-- formulario de publicar es «una mano, un pulgar, un minuto»; mandar a
-- quien acaba de registrarse a otra pantalla a inventarse un apodo antes
-- de dejarle subir la primera foto es exactamente el tropiezo que vacía
-- un catálogo recién nacido.
--
-- LO QUE SE HACE. Cada perfil nace con un alias puesto, del tipo
-- «familia-a1b2c3». No se saca del correo a propósito: el alias va en una
-- dirección pública y la parte de delante de un correo suele llevar el
-- nombre y el apellido de alguien. Quien quiera uno bonito lo cambia en
-- su perfil, que es donde ya se podía.

----------------------------------------------------------------------
-- El generador
--
-- Comprueba antes de devolver, y lo intenta diez veces. Con seis
-- caracteres hexadecimales hay dieciséis millones de combinaciones: diez
-- choques seguidos no van a pasar, pero si pasaran vale más un alias
-- largo y feo que una cuenta que no se crea.
----------------------------------------------------------------------

create or replace function alias_nuevo()
returns text language plpgsql
set search_path = public as $$
declare
  candidato text;
begin
  for intento in 1..10 loop
    candidato := 'familia-' ||
      lower(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
    if not exists (select 1 from perfiles where alias = candidato) then
      return candidato;
    end if;
  end loop;
  return 'familia-' ||
    lower(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12));
end;
$$;

----------------------------------------------------------------------
-- Al registrarse, con alias
--
-- Es la misma función de la 0007 con una columna más. Se repite entera
-- porque PostgreSQL no sabe modificar media función, y porque leerla de
-- un tirón vale más que ir a buscar qué hacía antes.
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

  insert into perfiles (id, alias, fecha_nacimiento, acepta_marketing)
  values (new.id, alias_nuevo(), fecha_nac, marketing)
  on conflict (id) do nothing;

  return new;
end;
$$;

----------------------------------------------------------------------
-- Los que ya estaban
----------------------------------------------------------------------

update perfiles set alias = alias_nuevo() where alias is null;

-- Y que no vuelva a entrar ninguno sin él. La restricción se añade al
-- final, cuando ya no queda ninguna fila que la incumpla.
alter table perfiles alter column alias set not null;
