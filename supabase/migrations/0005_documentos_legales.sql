-- Los textos legales y quién aceptó cada versión.
--
-- Hace falta poder demostrar qué condiciones concretas aceptó una persona
-- y cuándo. Por eso los documentos llevan versión y las aceptaciones son
-- un hecho con fecha: se escriben una vez y no se reescriben nunca.

create table documentos_legales (
  slug text not null,
  version text not null,
  titulo text not null,
  publicado_el timestamptz not null default now(),
  primary key (slug, version)
);

create table aceptaciones (
  id bigserial primary key,
  usuario uuid not null references perfiles(id) on delete cascade,
  documento_slug text not null,
  documento_version text not null,
  fecha timestamptz not null default now(),
  foreign key (documento_slug, documento_version)
    references documentos_legales(slug, version),
  unique (usuario, documento_slug, documento_version)
);

alter table documentos_legales enable row level security;
alter table aceptaciones enable row level security;

grant select on table documentos_legales to anon, authenticated;
grant select, insert on table aceptaciones to authenticated;
grant usage, select on sequence aceptaciones_id_seq to authenticated;

create policy "los documentos legales los lee cualquiera"
  on documentos_legales for select to anon, authenticated using (true);

-- Cada quien ve solo las suyas: la lista de lo que alguien ha aceptado no
-- es asunto de nadie más.
create policy "cada quien ve sus aceptaciones"
  on aceptaciones for select to authenticated using (auth.uid() = usuario);

create policy "cada quien registra sus aceptaciones"
  on aceptaciones for insert to authenticated with check (auth.uid() = usuario);

-- No hay politica de update ni de delete, a proposito: una aceptación es
-- un hecho fechado. Si se pudiera editar, no serviría como prueba.

insert into documentos_legales (slug, version, titulo) values
  ('aviso-legal',  '2026-10-22', 'Aviso legal'),
  ('condiciones',  '2026-10-22', 'Condiciones de uso'),
  ('privacidad',   '2026-10-22', 'Política de privacidad'),
  ('cookies',      '2026-10-22', 'Política de cookies')
on conflict (slug, version) do update set titulo = excluded.titulo;
