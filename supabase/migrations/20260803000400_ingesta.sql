-- 04 · Ingesta: fuentes, cola de trabajos, segmentos y candidatos.

create type ingest_status as enum ('pending','claimed','processing','done','failed');

create table sources (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  kind         text not null,   -- local_folder | drive | youtube | url | rss | upload
  ref          text not null,
  created_at   timestamptz not null default now()
);

create table ingest_jobs (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  source_id    uuid references sources(id) on delete cascade,
  file_path    text not null,
  file_hash    text not null,          -- sha256: clave de idempotencia
  media_kind   text not null,          -- image | video | audio | doc | url
  bytes        bigint,
  purpose      text not null default 'cerebro',
    -- cerebro | campus | artefacto | estilo
  target_id    uuid,                   -- artefacto, cátedra o referencia destino
  status       ingest_status not null default 'pending',
  progress     int not null default 0,
  attempts     int not null default 0,
  max_attempts int not null default 3,
  claimed_by   text,
  claimed_at   timestamptz,
  error        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (workspace_id, file_hash, purpose)
);
create index ingest_jobs_queue_idx on ingest_jobs (status, created_at);
create trigger ingest_jobs_touch before update on ingest_jobs
  for each row execute function touch_updated_at();

create table ingest_segments (
  id         uuid primary key default gen_random_uuid(),
  job_id     uuid not null references ingest_jobs(id) on delete cascade,
  idx        int not null,
  t_start    numeric,
  t_end      numeric,
  text       text not null,
  method     text not null,   -- ocr_local | ocr_llm | asr_whisper | reader | parse
  confidence numeric,
  created_at timestamptz not null default now(),
  unique (job_id, idx)
);

create table ingest_candidates (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  job_id       uuid not null references ingest_jobs(id) on delete cascade,
  segment_id   uuid references ingest_segments(id) on delete set null,
  kind         text not null,   -- fact | voice | citation | gap
  payload      jsonb not null,
  rationale    text,
  confidence   numeric,
  reviewed     boolean not null default false,
  accepted     boolean,
  created_at   timestamptz not null default now()
);
create index ingest_candidates_bandeja_idx
  on ingest_candidates (workspace_id, reviewed, created_at desc);

alter table sources           enable row level security;
alter table ingest_jobs       enable row level security;
alter table ingest_segments   enable row level security;
alter table ingest_candidates enable row level security;

create policy sources_member    on sources    for all to authenticated using (is_member(workspace_id)) with check (is_member(workspace_id));
create policy jobs_member       on ingest_jobs for all to authenticated using (is_member(workspace_id)) with check (is_member(workspace_id));
create policy candidates_member on ingest_candidates for all to authenticated using (is_member(workspace_id)) with check (is_member(workspace_id));
create policy segments_member   on ingest_segments for all to authenticated
  using (exists (select 1 from ingest_jobs j where j.id = job_id and is_member(j.workspace_id)))
  with check (exists (select 1 from ingest_jobs j where j.id = job_id and is_member(j.workspace_id)));

-- Reclamo sin colisiones. Permite varios workers en paralelo sin cambiar nada.
create or replace function claim_ingest_job(worker_id text)
returns setof ingest_jobs
language plpgsql security definer set search_path = public as $$
begin
  return query
  update ingest_jobs j
     set status = 'claimed', claimed_by = worker_id,
         claimed_at = now(), attempts = j.attempts + 1
   where j.id = (
     select id from ingest_jobs
      where status = 'pending' and attempts < max_attempts
      order by created_at
      for update skip locked
      limit 1
   )
  returning j.*;
end $$;

-- Trabajos varados: el worker local se apaga con el equipo.
create or replace function requeue_stale_jobs(max_minutes int default 45)
returns int language plpgsql security definer set search_path = public as $$
declare n int;
begin
  update ingest_jobs
     set status = 'pending', claimed_by = null, claimed_at = null
   where status in ('claimed','processing')
     and claimed_at < now() - make_interval(mins => max_minutes);
  get diagnostics n = row_count;
  return n;
end $$;
