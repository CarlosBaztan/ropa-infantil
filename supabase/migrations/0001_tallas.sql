-- Las tallas: lista cerrada, no texto libre.
--
-- Esta tabla es la copia en base de datos de src/lib/tallas.ts. Si las dos
-- listas se separan, el filtro por talla deja de cuadrar con las direcciones
-- públicas, así que hay una prueba que lo vigila.

create type grupo_talla as enum ('meses', 'anios');

create table tallas (
  codigo text primary key,
  grupo grupo_talla not null,
  etiqueta text not null,
  talla_eu text not null,
  edad_meses_min int not null,
  edad_meses_max int not null,
  orden int not null unique,
  constraint tramo_valido check (edad_meses_max >= edad_meses_min),
  constraint edad_no_negativa check (edad_meses_min >= 0)
);

alter table tallas enable row level security;

-- El proyecto está configurado para NO exponer las tablas nuevas de forma
-- automática: una tabla nace cerrada y se abre a mano, aquí, cuando sus
-- reglas ya están escritas. Hacen falta las dos cosas, el permiso de la
-- tabla y la política de fila: la política sola no da acceso.
grant select on table tallas to anon, authenticated;

-- Las tallas son datos de referencia: las lee cualquiera, incluso sin
-- sesión, porque el catálogo se ve sin cuenta. Nadie las escribe salvo con
-- la clave de servicio, que no pasa por el navegador.
create policy "las tallas las lee cualquiera"
  on tallas for select to anon, authenticated using (true);
