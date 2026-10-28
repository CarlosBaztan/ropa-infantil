-- Los permisos de columna no estaban cerrando nada
--
-- EL FALLO. El proyecto dice, desde la migración 0002, que «las tablas
-- nuevas no se exponen de forma automática: se abren a mano». No era
-- verdad. Supabase trae configurados unos permisos por omisión que
-- conceden TODO sobre cada tabla nueva del esquema public a los roles
-- anon y authenticated. Nuestros `grant update (columna, columna…)` solo
-- AÑADEN permisos; nunca quitan los que ya había. Así que la lista
-- cuidadosa de columnas de la migración 0008 no restringía absolutamente
-- nada.
--
-- Comprobado contra la base de pruebas: con la sesión de una usuaria
-- normal, desde el navegador, se podían cambiar vendido_el, publicado_el,
-- id_publico, slug, tipo, talla y provincia de un anuncio propio.
--
-- QUÉ SIGNIFICA ESO.
--   · vendido_el es el dato con el que se mide si el proyecto funciona.
--     Falsificable desde el navegador.
--   · publicado_el ordena el catálogo. Quien lo tocara tendría su anuncio
--     permanentemente arriba: es el fraude clásico de cualquier tablón de
--     anuncios.
--   · cambiar talla o tipo después de publicar es el cebo y cambiazo de
--     toda la vida.
--   · cambiar id_publico o slug rompe los enlaces ya compartidos.
--
-- El control de filas (RLS) sí funcionaba: nadie podía tocar lo ajeno. El
-- agujero era sobre lo propio.
--
-- EL ARREGLO, en tres capas:
--   1. Quitar el permiso general y volver a conceder solo lo justo.
--   2. Un disparador que devuelve a su sitio las columnas protegidas, por
--      si el permiso volviera a abrirse algún día.
--   3. Cambiar los permisos por omisión, para que la próxima tabla nazca
--      cerrada y esto no vuelva a pasar.

----------------------------------------------------------------------
-- 1. Quitar lo que nunca debió concederse, y conceder solo lo justo
--
-- A service_role no se le quita nada: es la llave de administración, la
-- que usan las pruebas y las tareas de mantenimiento.
----------------------------------------------------------------------

revoke all on table tallas               from anon, authenticated;
revoke all on table provincias           from anon, authenticated;
revoke all on table categorias           from anon, authenticated;
revoke all on table documentos_legales   from anon, authenticated;
revoke all on table aceptaciones         from anon, authenticated;
revoke all on table perfiles             from anon, authenticated;
revoke all on table anuncios             from anon, authenticated;
revoke all on table fotos                from anon, authenticated;

-- Listas de referencia: se leen y nada más.
grant select on table tallas             to anon, authenticated;
grant select on table provincias         to anon, authenticated;
grant select on table categorias         to anon, authenticated;
grant select on table documentos_legales to anon, authenticated;

-- Aceptaciones: cada quien ve las suyas y puede dejar constancia, pero la
-- fecha la pone la base de datos (disparador de la 0006).
grant select on table aceptaciones to authenticated;
grant insert (usuario, documento_slug, documento_version)
  on table aceptaciones to authenticated;
grant usage, select on sequence aceptaciones_id_seq to authenticated;

-- Perfiles: el perfil público lo lee cualquiera; cada quien edita el suyo
-- y solo estas columnas. La foto sigue fuera hasta que exista la subida.
grant select on table perfiles to anon, authenticated;
grant update (alias, provincia, ciudad, fecha_nacimiento, acepta_marketing)
  on table perfiles to authenticated;

-- Anuncios: la misma lista que decía la 0008, ahora de verdad.
grant select on table anuncios to anon, authenticated;
grant insert on table anuncios to authenticated;
grant update (titulo, descripcion, defectos, precio_centimos, situacion,
              acepta_entrega_mano, acepta_envio, zona_encuentro, desglose,
              marca, color, genero, temporada, ajuste, estado)
  on table anuncios to authenticated;
grant delete on table anuncios to authenticated;

-- Fotos: el índice se lee en abierto, y cada quien cuelga y quita las de
-- sus anuncios. Cambiar una fila ya escrita no tiene sentido: se borra y
-- se vuelve a subir.
grant select on table fotos to anon, authenticated;
grant insert, delete on table fotos to authenticated;

----------------------------------------------------------------------
-- 2. La segunda cerradura del anuncio
--
-- Mismo patrón que proteger_columnas_de_perfil: si quien escribe es una
-- persona con sesión iniciada, las columnas protegidas vuelven a su valor
-- anterior. Se comprueba `<> 'authenticated'` y no `= 'service_role'`
-- porque auth.role() devuelve NULL fuera de una petición de la API, y con
-- la comparación al revés el disparador no hacía nada desde el editor SQL.
--
-- Va dentro de sellar_venta en lugar de en un disparador aparte porque
-- los dos son BEFORE UPDATE sobre la misma tabla y PostgreSQL los
-- ejecutaría por orden alfabético: separados, el que protege borraría la
-- fecha que acaba de escribir el que sella.
----------------------------------------------------------------------

create or replace function sellar_venta()
returns trigger language plpgsql
set search_path = public, auth as $$
begin
  if coalesce(auth.role(), '') = 'authenticated' then
    new.id            := old.id;
    new.id_publico    := old.id_publico;
    new.slug          := old.slug;
    new.vendedor      := old.vendedor;
    new.publicado_por := old.publicado_por;
    new.tipo          := old.tipo;
    new.talla         := old.talla;
    new.talla_hasta   := old.talla_hasta;
    new.numero_piezas := old.numero_piezas;
    new.categoria     := old.categoria;
    new.provincia     := old.provincia;
    new.ciudad        := old.ciudad;
    new.publicado_el  := old.publicado_el;
    new.vendido_el    := old.vendido_el;
  end if;

  new.actualizado_el := now();

  if new.situacion = 'vendida' and old.situacion <> 'vendida' then
    new.vendido_el := now();
  elsif new.situacion <> 'vendida' and old.situacion = 'vendida' then
    -- Marcar vendido por error pasa, y pasa a menudo. Deshacerlo no puede
    -- dejar la fecha puesta: un anuncio vivo con fecha de venta estropea
    -- justo el número que sirve para decidir si esto sigue adelante.
    new.vendido_el := null;
  end if;

  return new;
end;
$$;

----------------------------------------------------------------------
-- 3. Que la próxima tabla nazca cerrada
--
-- Esto es lo que hacía falta para que fuera cierto lo que decía la 0002.
-- A partir de aquí, una tabla nueva en el esquema public no concede nada
-- a nadie hasta que su migración lo escriba.
----------------------------------------------------------------------

alter default privileges in schema public
  revoke all on tables from anon, authenticated;
alter default privileges in schema public
  revoke all on sequences from anon, authenticated;
alter default privileges in schema public
  revoke all on functions from anon, authenticated;

-- Que la API recargue su idea de los permisos sin esperar a que se entere
-- sola: hasta que lo haga seguiría sirviendo con los de antes.
notify pgrst, 'reload schema';

