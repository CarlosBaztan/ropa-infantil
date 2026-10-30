-- Las conversaciones y los mensajes
--
-- Hoy se puede publicar y se puede encontrar, pero no se puede preguntar
-- «¿sigue disponible?». Sin eso no se cierra una sola venta, y vender es
-- el número con el que se decide si este proyecto sigue adelante.
--
-- Una conversación va SIEMPRE atada a un anuncio concreto. No hay
-- mensajería suelta entre personas: eso convertiría la plataforma en un
-- chat, con todo lo que trae —acoso, publicidad, contactos fuera de
-- contexto— y sin ninguna de las ventajas. Atada al anuncio, la cabecera
-- recuerda de qué se está hablando y el vendedor puede marcar vendido
-- desde ahí mismo.

----------------------------------------------------------------------
-- Las conversaciones
--
-- Una por anuncio y por persona que pregunta. Quien vende no abre
-- conversación sobre lo suyo: responde a las que le abren.
----------------------------------------------------------------------

create table conversaciones (
  id uuid primary key default gen_random_uuid(),
  anuncio uuid not null references anuncios(id) on delete cascade,
  -- Se guardan los dos, aunque el vendedor se pueda deducir del anuncio:
  -- las reglas de permisos se consultan en cada fila que se lee, y un
  -- salto a otra tabla por fila es caro y se nota en la bandeja.
  comprador uuid not null references perfiles(id) on delete cascade,
  vendedor uuid not null references perfiles(id) on delete cascade,

  abierta_el timestamptz not null default now(),
  -- Para ordenar la bandeja sin tener que mirar todos los mensajes.
  ultimo_mensaje_el timestamptz not null default now(),

  -- Quien compra no habla consigo mismo.
  constraint partes_distintas check (comprador <> vendedor),
  -- Una sola conversación por anuncio y persona: si no, cada pregunta
  -- abriría un hilo nuevo y la bandeja sería ilegible.
  unique (anuncio, comprador)
);

create index conversaciones_de_cada_quien
  on conversaciones (comprador, ultimo_mensaje_el desc);
create index conversaciones_de_cada_vendedor
  on conversaciones (vendedor, ultimo_mensaje_el desc);
create index conversaciones_por_anuncio on conversaciones (anuncio);

----------------------------------------------------------------------
-- Los mensajes
--
-- Solo texto. Ni fotos ni archivos: la foto que importa está en el
-- anuncio, y aceptar archivos abre la puerta a enviar cosas que no
-- queremos alojar.
----------------------------------------------------------------------

create table mensajes (
  id uuid primary key default gen_random_uuid(),
  conversacion uuid not null references conversaciones(id) on delete cascade,
  autor uuid not null references perfiles(id) on delete cascade,
  texto text not null,
  enviado_el timestamptz not null default now(),
  leido_el timestamptz,

  constraint texto_con_contenido check (
    length(btrim(texto)) between 1 and 2000
  )
);

create index mensajes_de_cada_conversacion
  on mensajes (conversacion, enviado_el);

----------------------------------------------------------------------
-- Quién es parte de una conversación
--
-- Se usa en varias políticas. security definer para que pueda mirar la
-- tabla sin que sus propias reglas se metan en medio y den vueltas.
----------------------------------------------------------------------

create or replace function es_parte_de(conversacion_id uuid)
returns boolean language sql stable security definer
set search_path = public, auth as $$
  select exists (
    select 1 from conversaciones c
     where c.id = conversacion_id
       and (c.comprador = auth.uid() or c.vendedor = auth.uid())
  );
$$;

grant execute on function es_parte_de(uuid) to authenticated;

----------------------------------------------------------------------
-- La fecha del último mensaje la pone la base, no quien escribe
----------------------------------------------------------------------

create or replace function sellar_mensaje()
returns trigger language plpgsql
set search_path = public, auth as $$
begin
  if coalesce(auth.role(), '') = 'authenticated' then
    -- Ni la fecha ni el autor los elige quien escribe: una conversación
    -- en la que se puede poner la hora que a uno le convenga no sirve
    -- para resolver una discusión después.
    new.enviado_el := now();
    new.autor := coalesce(auth.uid(), new.autor);
  end if;
  return new;
end;
$$;

create trigger mensajes_al_enviar
  before insert on mensajes
  for each row execute function sellar_mensaje();

create or replace function mover_la_conversacion_arriba()
returns trigger language plpgsql
set search_path = public as $$
begin
  update conversaciones
     set ultimo_mensaje_el = new.enviado_el
   where id = new.conversacion;
  return new;
end;
$$;

create trigger mensajes_mueven_la_conversacion
  after insert on mensajes
  for each row execute function mover_la_conversacion_arriba();

----------------------------------------------------------------------
-- Los permisos
--
-- Igual que en la 0010: primero se quita todo, y después se concede
-- exactamente lo que hace falta. Los permisos por omisión de Supabase
-- conceden TODO sobre cada tabla nueva, y un grant solo añade.
----------------------------------------------------------------------

alter table conversaciones enable row level security;
alter table mensajes enable row level security;

revoke all on table conversaciones from anon, authenticated;
revoke all on table mensajes from anon, authenticated;

-- Las conversaciones no las ve nadie sin sesión: ni el que pregunta ni
-- el que vende quieren eso indexado.
grant select, insert on table conversaciones to authenticated;
grant select, insert on table mensajes to authenticated;
-- Marcar leído es lo único que se puede cambiar de un mensaje. El texto
-- no: un mensaje que se puede reescribir después no vale como prueba de
-- lo que se acordó.
grant update (leido_el) on table mensajes to authenticated;

create policy "cada quien ve sus conversaciones"
  on conversaciones for select to authenticated
  using (comprador = auth.uid() or vendedor = auth.uid());

-- Abrir conversación: solo quien pregunta, sobre un anuncio que puede
-- ver, que no es suyo, y declarando como vendedor a quien de verdad lo
-- es. Lo último importa: sin la comprobación, cualquiera podría abrir
-- una conversación poniendo de vendedor a una persona cualquiera.
create policy "quien pregunta abre la conversacion"
  on conversaciones for insert to authenticated
  with check (
    comprador = auth.uid()
    and exists (
      select 1 from anuncios a
       where a.id = anuncio
         and a.vendedor = conversaciones.vendedor
         and a.vendedor <> auth.uid()
         and a.situacion <> 'retirada'
    )
    and not exists (
      select 1 from perfiles p where p.id = auth.uid() and p.bloqueado
    )
  );

create policy "cada quien lee los mensajes de sus conversaciones"
  on mensajes for select to authenticated
  using (es_parte_de(conversacion));

create policy "cada quien escribe en sus conversaciones"
  on mensajes for insert to authenticated
  with check (
    autor = auth.uid()
    and es_parte_de(conversacion)
    and not exists (
      select 1 from perfiles p where p.id = auth.uid() and p.bloqueado
    )
  );

-- Marcar leído: solo lo que te han escrito a ti, no lo tuyo.
create policy "cada quien marca leido lo que le han escrito"
  on mensajes for update to authenticated
  using (es_parte_de(conversacion) and autor <> auth.uid())
  with check (es_parte_de(conversacion) and autor <> auth.uid());

-- No hay política de borrado, a propósito. Una conversación desaparece
-- cuando desaparece su anuncio o su cuenta, en cascada, que es lo que
-- exige el derecho de supresión sin dejar a la otra parte sin su mitad
-- de lo hablado mientras la cuenta existe.
