-- Las fotos de los anuncios.
--
-- Las imágenes viven en el almacén de Supabase; esta tabla es el índice
-- que dice qué foto pertenece a qué anuncio y en qué orden se muestran.
--
-- El ancho y el alto son obligatorios: sin ellos el navegador no sabe
-- cuánto hueco reservar y la página «salta» mientras cargan las imágenes,
-- lo que molesta al visitante y penaliza en buscadores.

create table fotos (
  id uuid primary key default gen_random_uuid(),
  anuncio uuid not null references anuncios(id) on delete cascade,
  ruta text not null unique,
  orden int not null,
  ancho int not null,
  alto int not null,
  texto_alternativo text,
  subida_el timestamptz not null default now(),

  unique (anuncio, orden),
  constraint maximo_cinco check (orden between 1 and 5),
  constraint dimensiones_validas check (ancho > 0 and alto > 0),
  -- El archivo tiene que vivir en la carpeta de su anuncio, para que el
  -- almacén no se llene de archivos sueltos sin dueño.
  constraint ruta_en_su_carpeta check (ruta like anuncio::text || '/%')
);

alter table fotos enable row level security;

grant select on table fotos to anon, authenticated;
grant insert, delete on table fotos to authenticated;

-- El catálogo es público, así que sus fotos también.
create policy "las fotos las ve cualquiera"
  on fotos for select to anon, authenticated using (true);

create policy "cada quien sube fotos a sus anuncios"
  on fotos for insert to authenticated with check (
    exists (
      select 1 from anuncios a
       where a.id = anuncio and a.vendedor = auth.uid()
    )
  );

create policy "cada quien borra las fotos de sus anuncios"
  on fotos for delete to authenticated using (
    exists (
      select 1 from anuncios a
       where a.id = anuncio and a.vendedor = auth.uid()
    )
  );

create index fotos_de_cada_anuncio on fotos (anuncio, orden);

----------------------------------------------------------------------
-- El almacén
--
-- Público para leer, porque el catálogo tiene que verse sin cuenta. Dos
-- megas por archivo: las fotos se reducen en el navegador antes de
-- subirlas, así que una que pase de ahí es señal de que algo no ha
-- funcionado.
----------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('anuncios', 'anuncios', true, 2097152,
        array['image/webp', 'image/jpeg'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Solo se puede subir a la carpeta de un anuncio propio. El nombre del
-- archivo empieza por el identificador del anuncio, y esa carpeta tiene
-- que pertenecer a quien sube.
create policy "subir fotos a la carpeta de un anuncio propio"
  on storage.objects for insert to authenticated with check (
    bucket_id = 'anuncios'
    and exists (
      select 1 from anuncios a
       where a.vendedor = auth.uid()
         and (storage.foldername(name))[1] = a.id::text
    )
  );

create policy "borrar las fotos de un anuncio propio"
  on storage.objects for delete to authenticated using (
    bucket_id = 'anuncios'
    and exists (
      select 1 from anuncios a
       where a.vendedor = auth.uid()
         and (storage.foldername(name))[1] = a.id::text
    )
  );
