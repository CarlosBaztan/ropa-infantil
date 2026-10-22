-- Las provincias, como lista cerrada y no como texto libre.
--
-- Igual que las tallas: si fuera texto libre, "Bizkaia", "Vizcaya" y
-- "bizkaia" serían tres sitios distintos y el filtro por zona no
-- funcionaría nunca. El código es el oficial del INE.
--
-- Tiene copia en src/lib/provincias.ts, y una prueba comprueba que las dos
-- listas no se separen.

create table provincias (
  codigo text primary key,
  nombre text not null unique,
  slug text not null unique
);

alter table provincias enable row level security;

grant select on table provincias to anon, authenticated;

create policy "las provincias las lee cualquiera"
  on provincias for select to anon, authenticated using (true);

insert into provincias (codigo, nombre, slug) values
  ('01','Álava','alava'), ('02','Albacete','albacete'),
  ('03','Alicante','alicante'), ('04','Almería','almeria'),
  ('05','Ávila','avila'), ('06','Badajoz','badajoz'),
  ('07','Illes Balears','illes-balears'), ('08','Barcelona','barcelona'),
  ('09','Burgos','burgos'), ('10','Cáceres','caceres'),
  ('11','Cádiz','cadiz'), ('12','Castellón','castellon'),
  ('13','Ciudad Real','ciudad-real'), ('14','Córdoba','cordoba'),
  ('15','A Coruña','a-coruna'), ('16','Cuenca','cuenca'),
  ('17','Girona','girona'), ('18','Granada','granada'),
  ('19','Guadalajara','guadalajara'), ('20','Gipuzkoa','gipuzkoa'),
  ('21','Huelva','huelva'), ('22','Huesca','huesca'),
  ('23','Jaén','jaen'), ('24','León','leon'),
  ('25','Lleida','lleida'), ('26','La Rioja','la-rioja'),
  ('27','Lugo','lugo'), ('28','Madrid','madrid'),
  ('29','Málaga','malaga'), ('30','Murcia','murcia'),
  ('31','Navarra','navarra'), ('32','Ourense','ourense'),
  ('33','Asturias','asturias'), ('34','Palencia','palencia'),
  ('35','Las Palmas','las-palmas'), ('36','Pontevedra','pontevedra'),
  ('37','Salamanca','salamanca'),
  ('38','Santa Cruz de Tenerife','santa-cruz-de-tenerife'),
  ('39','Cantabria','cantabria'), ('40','Segovia','segovia'),
  ('41','Sevilla','sevilla'), ('42','Soria','soria'),
  ('43','Tarragona','tarragona'), ('44','Teruel','teruel'),
  ('45','Toledo','toledo'), ('46','Valencia','valencia'),
  ('47','Valladolid','valladolid'), ('48','Bizkaia','bizkaia'),
  ('49','Zamora','zamora'), ('50','Zaragoza','zaragoza'),
  ('51','Ceuta','ceuta'), ('52','Melilla','melilla')
on conflict (codigo) do update set
  nombre = excluded.nombre,
  slug   = excluded.slug;

-- El perfil apunta a la lista en vez de guardar un texto cualquiera.
alter table perfiles
  add constraint perfiles_provincia_existe
  foreign key (provincia) references provincias(codigo);
