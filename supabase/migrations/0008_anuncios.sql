-- Los anuncios: una sola tabla para la prenda suelta y para el lote.
--
-- Comparten fotos, situación, búsqueda y —en los planes siguientes—
-- conversaciones y favoritos. Separarlos obligaría a duplicar todo eso.
-- Lo que los distingue son tres columnas y una restricción.

----------------------------------------------------------------------
-- Las categorías, como lista cerrada
--
-- Igual que las tallas y las provincias: el código va en las direcciones
-- públicas del catálogo, y si fuera texto libre "pijama", "Pijamas" y
-- "pijamitas" serían tres sitios distintos. Copia en
-- src/lib/anuncios/modelo.ts, con prueba de paridad.
----------------------------------------------------------------------

create table categorias (
  codigo text primary key,
  etiqueta text not null unique,
  orden int not null unique
);

alter table categorias enable row level security;
grant select on table categorias to anon, authenticated;

create policy "las categorias las lee cualquiera"
  on categorias for select to anon, authenticated using (true);

insert into categorias (codigo, etiqueta, orden) values
  ('bodies',        'Bodies',                      10),
  ('camisetas',     'Camisetas',                   20),
  ('pantalones',    'Pantalones',                  30),
  ('vestidos',      'Vestidos',                    40),
  ('faldas',        'Faldas',                      50),
  ('jerseis',       'Jerséis',                     60),
  ('sudaderas',     'Sudaderas',                   70),
  ('abrigos',       'Abrigos y chaquetas',         80),
  ('pijamas',       'Pijamas',                     90),
  ('conjuntos',     'Conjuntos',                  100),
  ('ropa-interior', 'Ropa interior',              110),
  ('calcetines',    'Calcetines y medias',        120),
  ('gorros',        'Gorros y accesorios',        130),
  ('banadores',     'Bañadores',                  140),
  ('calzado',       'Calzado',                    150),
  ('canastilla',    'Canastilla de recién nacido',160),
  ('otros',         'Otros',                      170)
on conflict (codigo) do update set
  etiqueta = excluded.etiqueta,
  orden    = excluded.orden;

----------------------------------------------------------------------
-- Los anuncios
----------------------------------------------------------------------

create type tipo_anuncio as enum ('prenda', 'lote');
create type situacion_anuncio as enum
  ('activa', 'reservada', 'vendida', 'retirada');
create type estado_conservacion as enum
  ('nuevo-con-etiqueta', 'como-nuevo', 'buen-estado', 'con-senales-de-uso');
create type temporada_prenda as enum
  ('verano', 'invierno', 'entretiempo', 'todo-el-ano');
create type genero_prenda as enum ('nina', 'nino', 'unisex');
create type ajuste_de_talla as enum ('pequena', 'normal', 'grande');

create table anuncios (
  id uuid primary key default gen_random_uuid(),
  -- Seis caracteres, no secuencial: va en la dirección pública y permite
  -- reescribir el texto del enlace sin romperlo.
  id_publico text not null unique
    default lower(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6)),
  slug text not null,

  vendedor uuid not null references perfiles(id) on delete cascade,
  -- Quién lo publicó materialmente, que puede no ser quien vende: es la
  -- siembra asistida del plan 5.
  publicado_por uuid references perfiles(id),

  tipo tipo_anuncio not null,
  titulo text not null,
  descripcion text,
  defectos text,

  talla text not null references tallas(codigo),
  -- Solo los lotes: hasta qué talla llega.
  talla_hasta text references tallas(codigo),
  numero_piezas int,
  desglose text,

  categoria text not null references categorias(codigo),
  genero genero_prenda,
  marca text,
  color text,
  estado estado_conservacion not null,
  ajuste ajuste_de_talla not null default 'normal',
  temporada temporada_prenda,

  precio_centimos int not null,
  acepta_entrega_mano boolean not null default true,
  acepta_envio boolean not null default false,
  -- Un barrio o un punto público. Nunca una dirección.
  zona_encuentro text,

  provincia text references provincias(codigo),
  ciudad text,

  situacion situacion_anuncio not null default 'activa',
  publicado_el timestamptz not null default now(),
  vendido_el timestamptz,
  actualizado_el timestamptz not null default now(),

  constraint precio_positivo check (precio_centimos > 0),
  -- Ropa infantil de segunda mano: por encima de mil euros, algo va mal.
  constraint precio_razonable check (precio_centimos <= 100000),
  constraint lote_con_piezas check (
    (tipo = 'prenda' and numero_piezas is null and talla_hasta is null)
    or (tipo = 'lote' and numero_piezas >= 2)
  ),
  -- Todo anuncio tiene que poder entregarse de alguna manera.
  constraint alguna_entrega check (acepta_entrega_mano or acepta_envio),
  constraint titulo_con_contenido check (
    length(btrim(titulo)) between 3 and 120
  ),
  constraint zona_encuentro_breve check (
    zona_encuentro is null or length(zona_encuentro) <= 120
  )
);

-- El rango de tallas no puede ir hacia atrás. Se compara por el orden de
-- la tabla de tallas y no por el texto: "12-18-meses" es mayor que
-- "3-6-meses" aunque alfabéticamente no lo parezca.
create or replace function rango_de_tallas_valido()
returns trigger language plpgsql
set search_path = public as $$
declare
  desde int;
  hasta int;
begin
  if new.talla_hasta is null then
    return new;
  end if;
  select orden into desde from tallas where codigo = new.talla;
  select orden into hasta from tallas where codigo = new.talla_hasta;
  if hasta is null or desde is null or hasta <= desde then
    raise exception 'El rango de tallas va hacia atrás'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger anuncios_rango_valido
  before insert or update on anuncios
  for each row execute function rango_de_tallas_valido();

-- Marcar vendido deja la fecha, que es el dato con el que se medirá si el
-- proyecto funciona.
create or replace function sellar_venta()
returns trigger language plpgsql as $$
begin
  new.actualizado_el := now();
  if new.situacion = 'vendida' and old.situacion <> 'vendida' then
    new.vendido_el := now();
  end if;
  return new;
end;
$$;

create trigger anuncios_al_actualizar
  before update on anuncios
  for each row execute function sellar_venta();

alter table anuncios enable row level security;

grant select on table anuncios to anon, authenticated;
grant insert on table anuncios to authenticated;
-- Acotado por columnas: ni el vendedor, ni las fechas, ni el identificador
-- público se tocan desde el navegador.
grant update (titulo, descripcion, defectos, precio_centimos, situacion,
              acepta_entrega_mano, acepta_envio, zona_encuentro, desglose,
              marca, color, genero, temporada, ajuste, estado)
  on table anuncios to authenticated;
grant delete on table anuncios to authenticated;

-- Los anuncios vivos los ve cualquiera, sin cuenta: el catálogo tiene que
-- ser visible para Google. Un anuncio vendido sigue siéndolo, porque su
-- página captura las búsquedas concretas. Los retirados, solo su dueña.
create policy "los anuncios vivos los ve cualquiera"
  on anuncios for select to anon, authenticated
  using (situacion <> 'retirada' or vendedor = auth.uid());

-- Publicar exige correo verificado, no estar bloqueado y haber declarado
-- una edad adulta. Lo decide puede_publicar(), no la pantalla.
create policy "publica quien puede publicar"
  on anuncios for insert to authenticated
  with check (vendedor = auth.uid() and puede_publicar());

create policy "cada quien edita sus anuncios"
  on anuncios for update to authenticated
  using (vendedor = auth.uid()) with check (vendedor = auth.uid());

create policy "cada quien borra sus anuncios"
  on anuncios for delete to authenticated using (vendedor = auth.uid());

create index anuncios_por_talla on anuncios (talla, situacion);
create index anuncios_por_provincia on anuncios (provincia, situacion);
create index anuncios_recientes on anuncios (publicado_el desc);
create index anuncios_de_cada_quien on anuncios (vendedor, situacion);
