-- 05 · Campus: conocimiento ajeno, con autor y atribución.

create table cathedras (
  id                  uuid primary key default gen_random_uuid(),
  workspace_id        uuid not null references workspaces(id) on delete cascade,
  author              text not null,
  role                text,
  platforms           text[],
  learn_content       text,
  learn_communication text,
  tags                text[],
  profile             jsonb,   -- ideas_clave, tesis, frameworks, patrones, vocabulario
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create trigger cathedras_touch before update on cathedras
  for each row execute function touch_updated_at();

create table cathedra_sources (
  id             uuid primary key default gen_random_uuid(),
  cathedra_id    uuid not null references cathedras(id) on delete cascade,
  ingest_job_id  uuid references ingest_jobs(id) on delete set null,
  kind           text not null,  -- youtube | articulo | pdf | podcast | libro | texto
  ref            text,
  extracted_text text,
  profile        jsonb,
  created_at     timestamptz not null default now()
);

create table knowledge_maps (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references workspaces(id) on delete cascade,
  scope         uuid[],
  consensus     jsonb,
  controversies jsonb,
  unique_areas  jsonb,
  field_gaps    jsonb,
  curriculum    jsonb,
  created_at    timestamptz not null default now()
);

create table syntheses (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  scope        uuid[],
  voice_mix    numeric not null default 0.5,  -- 0 = autores puros, 1 = voz propia
  focus        text,
  body         text,
  traceability jsonb,   -- afirmación -> cátedra de origen
  created_at   timestamptz not null default now()
);

alter table cathedras        enable row level security;
alter table cathedra_sources enable row level security;
alter table knowledge_maps   enable row level security;
alter table syntheses        enable row level security;

create policy cathedras_member on cathedras for all to authenticated using (is_member(workspace_id)) with check (is_member(workspace_id));
create policy maps_member      on knowledge_maps for all to authenticated using (is_member(workspace_id)) with check (is_member(workspace_id));
create policy synth_member     on syntheses for all to authenticated using (is_member(workspace_id)) with check (is_member(workspace_id));
create policy cathsrc_member   on cathedra_sources for all to authenticated
  using (exists (select 1 from cathedras c where c.id = cathedra_id and is_member(c.workspace_id)))
  with check (exists (select 1 from cathedras c where c.id = cathedra_id and is_member(c.workspace_id)));

alter table citations add constraint citations_cathedra_fk
  foreign key (cathedra_id) references cathedras(id) on delete set null;
alter table citations add constraint citations_source_fk
  foreign key (source_id) references cathedra_sources(id) on delete set null;
