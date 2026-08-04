-- 10 · Agenda editorial con aprendizaje, temas de deck y fuentes de deck.

create table schedule_policies (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  version      int not null,
  cadence      jsonb not null,   -- techo: viene de marca.cadencia_max
  mix          jsonb not null,   -- proporción por pilar (3-1-1 por defecto)
  time_slots   jsonb not null,
  weights      jsonb not null default '{}'::jsonb,
  explore_rate numeric not null default 0.2,
  active       boolean not null default false,
  created_at   timestamptz not null default now()
);

create table schedule_slots (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  policy_id    uuid references schedule_policies(id),
  scheduled_at timestamptz not null,
  format       text not null,
  pillar       text not null,
  objective    text not null,
  artifact_id  uuid references artifacts(id) on delete set null,
  is_explore   boolean not null default false,
  status       text not null default 'vacio'  -- vacio|asignado|publicado|saltado
);
create index slots_cal_idx on schedule_slots (workspace_id, scheduled_at);

create table slot_outcomes (
  slot_id          uuid primary key references schedule_slots(id) on delete cascade,
  metrics          jsonb not null,
  objective_metric numeric,   -- la métrica que corresponde al objetivo del slot
  measured_at      timestamptz not null default now()
);

create table policy_proposals (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  factor       text not null,   -- dia_hora | formato | gancho | pilar
  hypothesis   text not null,
  evidence     jsonb not null,  -- n por celda, medias, dispersión
  status       text not null default 'pendiente',
  created_at   timestamptz not null default now()
);

create table metrics (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  project_id   uuid references projects(id) on delete cascade,
  artifact_id  uuid references artifacts(id) on delete cascade,
  name         text not null,
  value        numeric,
  unit         text,
  measured_on  date not null default current_date
);

create table targets (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  project_id   uuid references projects(id) on delete cascade,
  name         text not null,
  kind         text,
  contact      text,
  stage        text,
  fit_score    int,
  notes        text,
  data         jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
alter table commitments add constraint commitments_target_fk
  foreign key (target_id) references targets(id) on delete cascade;

-- Temas de deck y biblioteca de referencias estéticas.
create table style_references (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references workspaces(id) on delete cascade,
  name          text not null,
  file_kind     text not null,   -- pptx | pdf | imagen
  ingest_job_id uuid references ingest_jobs(id) on delete set null,
  fidelity      text not null,   -- medido | inferido
  notes         text,
  created_at    timestamptz not null default now()
);

create table deck_themes (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  name         text not null,
  tokens       jsonb not null,
  origin       text not null,   -- extraido | manual | variacion | contraste
  parent_id    uuid references deck_themes(id) on delete set null,
  reference_id uuid references style_references(id) on delete set null,
  is_favorite  boolean not null default false,
  created_at   timestamptz not null default now()
);

create table theme_choices (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references workspaces(id) on delete cascade,
  artifact_id   uuid references artifacts(id) on delete set null,
  artifact_kind text,
  shown         uuid[] not null,
  chosen        uuid references deck_themes(id) on delete set null,
  created_at    timestamptz not null default now()
);

create table deck_sources (
  id            uuid primary key default gen_random_uuid(),
  artifact_id   uuid not null references artifacts(id) on delete cascade,
  kind          text not null,   -- pegado | archivo | cerebro
  mode          text not null,   -- fuente | esqueleto
  ingest_job_id uuid references ingest_jobs(id) on delete set null,
  raw_text      text,
  ref           text,
  created_at    timestamptz not null default now()
);

alter table schedule_policies enable row level security;
alter table schedule_slots    enable row level security;
alter table policy_proposals  enable row level security;
alter table metrics           enable row level security;
alter table targets           enable row level security;
alter table style_references  enable row level security;
alter table deck_themes       enable row level security;
alter table theme_choices     enable row level security;
create policy sp_member  on schedule_policies for all to authenticated using (is_member(workspace_id)) with check (is_member(workspace_id));
create policy ss_member  on schedule_slots for all to authenticated using (is_member(workspace_id)) with check (is_member(workspace_id));
create policy pp_member  on policy_proposals for all to authenticated using (is_member(workspace_id)) with check (is_member(workspace_id));
create policy me_member  on metrics for all to authenticated using (is_member(workspace_id)) with check (is_member(workspace_id));
create policy ta_member  on targets for all to authenticated using (is_member(workspace_id)) with check (is_member(workspace_id));
create policy sr_member  on style_references for all to authenticated using (is_member(workspace_id)) with check (is_member(workspace_id));
create policy dt_member  on deck_themes for all to authenticated using (is_member(workspace_id)) with check (is_member(workspace_id));
create policy tc_member  on theme_choices for all to authenticated using (is_member(workspace_id)) with check (is_member(workspace_id));
