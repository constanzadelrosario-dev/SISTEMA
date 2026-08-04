-- 03 · Cerebro: hechos, voz, vacíos, compromisos, citas de terceros.

create type fact_status as enum ('verde', 'amarillo', 'rojo');
-- verde: confirmado y citable · amarillo: pendiente · rojo: crítico, bloquea

create table facts (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  scope        text not null default 'global',
    -- global | marca | audiencia | limites | <slug de proyecto>
  key          text not null,
  value        text,
  status       fact_status not null default 'amarillo',
  source       text,
  evidence_url text,
  confidence   numeric,
  origin       text not null default 'manual',
    -- manual | ingesta | agente | brief_manual | deck_source | herramienta_marca
  created_by   uuid references auth.users(id) on delete set null,
  validated_by uuid references auth.users(id) on delete set null,
  validated_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (workspace_id, scope, key)
);
create index facts_ws_status_idx on facts (workspace_id, status);
create trigger facts_touch before update on facts
  for each row execute function touch_updated_at();

create table voice (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  speaker      text not null default 'principal',
  text         text not null,
  immutable    boolean not null default true,
  source       text,
  origin       text not null default 'manual',
  validated_at timestamptz,
  created_at   timestamptz not null default now()
);
create index voice_ws_speaker_idx on voice (workspace_id, speaker);

-- Citas de terceros. Separadas de voice a propósito: el chequeo de verbatim
-- valida contra voice las citas atribuidas a la persona, y contra citations
-- las atribuidas a otros.
create table citations (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  cathedra_id  uuid,
  source_id    uuid,
  text         text not null,
  attribution  text not null,
  url          text,
  created_at   timestamptz not null default now(),
  constraint citations_max_15_palabras
    check (array_length(regexp_split_to_array(btrim(text), '\s+'), 1) <= 15)
);

create table gaps (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  field        text not null,
  priority     int not null default 2,
  owner        text,
  due_date     date,
  resolved     boolean not null default false,
  raised_by    text,
  tool_id      text,   -- herramienta de marca que lo resuelve, si aplica
  created_at   timestamptz not null default now()
);
create index gaps_ws_open_idx on gaps (workspace_id, resolved);

create table commitments (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  target_id    uuid,
  promise      text not null,
  due_date     date,
  fulfilled    boolean not null default false,
  created_at   timestamptz not null default now()
);

alter table facts       enable row level security;
alter table voice       enable row level security;
alter table citations   enable row level security;
alter table gaps        enable row level security;
alter table commitments enable row level security;

create policy facts_member       on facts       for all to authenticated using (is_member(workspace_id)) with check (is_member(workspace_id));
create policy voice_member       on voice       for all to authenticated using (is_member(workspace_id)) with check (is_member(workspace_id));
create policy citations_member   on citations   for all to authenticated using (is_member(workspace_id)) with check (is_member(workspace_id));
create policy gaps_member        on gaps        for all to authenticated using (is_member(workspace_id)) with check (is_member(workspace_id));
create policy commitments_member on commitments for all to authenticated using (is_member(workspace_id)) with check (is_member(workspace_id));

-- El cuarto bucle: un hecho en amarillo que bloquea piezas sube en la cola.
create view v_facts_demandados as
select f.id, f.workspace_id, f.scope, f.key, f.status,
       count(g.id) as vacios_asociados
from facts f
left join gaps g
  on g.workspace_id = f.workspace_id
 and g.field = f.key
 and g.resolved = false
where f.status <> 'verde'
group by f.id;
