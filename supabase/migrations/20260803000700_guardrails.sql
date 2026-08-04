-- 07 · Perfiles de guardrails y aplicación en base de datos.
-- Severidad por chequeo: bloqueante | advertencia | off.

create table guardrail_profiles (
  id           text primary key,
  workspace_id uuid references workspaces(id) on delete cascade,
  name         text not null,
  checks       jsonb not null,
  created_at   timestamptz not null default now()
);

alter table workspaces
  add column default_guardrail_profile text not null default 'clinico';

alter table artifacts
  add column guardrail_profile text references guardrail_profiles(id);

insert into guardrail_profiles (id, name, checks) values
 ('clinico',  'Clínico', '{"validacion":"bloqueante","verbatim":"bloqueante","coherencia":"advertencia","limites":"advertencia","persuasion":"advertencia","crisis":"bloqueante","compliance":"off"}'),
 ('marketing','Marketing','{"validacion":"bloqueante","verbatim":"bloqueante","coherencia":"advertencia","limites":"advertencia","persuasion":"advertencia","crisis":"bloqueante","compliance":"off"}'),
 ('borrador', 'Borrador', '{"validacion":"advertencia","verbatim":"advertencia","coherencia":"advertencia","limites":"advertencia","persuasion":"advertencia","crisis":"advertencia","compliance":"off"}'),
 ('arranque', 'Arranque', '{"validacion":"advertencia","verbatim":"off","coherencia":"off","limites":"advertencia","persuasion":"off","crisis":"bloqueante","compliance":"off"}'),
 ('libre',    'Libre',   '{"validacion":"off","verbatim":"off","coherencia":"off","limites":"off","persuasion":"off","crisis":"off","compliance":"off"}');

-- Overrides firmados: alternativa con rastro al interruptor silencioso.
create table guardrail_overrides (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references workspaces(id) on delete cascade,
  artifact_id   uuid not null references artifacts(id) on delete cascade,
  version       int not null,
  check_id      text not null,
  justification text not null check (length(btrim(justification)) >= 20),
  signed_by     uuid references auth.users(id) on delete set null,
  signed_at     timestamptz not null default now(),
  expires_at    timestamptz not null default (now() + interval '30 days')
);

-- Última línea: no se puede aprobar con un bloqueante en rojo sin override vigente.
create or replace function enforce_guardrails()
returns trigger language plpgsql as $$
declare pendientes int;
begin
  if new.status in ('aprobado','publicado')
     and (old.status is distinct from new.status) then
    select count(*) into pendientes
      from artifact_versions v,
           lateral jsonb_array_elements(coalesce(v.checks,'[]'::jsonb)) c
     where v.artifact_id = new.id
       and v.version = new.current_version
       and (c->>'passed')::boolean = false
       and c->>'severity' = 'bloqueante'
       and not exists (
         select 1 from guardrail_overrides o
          where o.artifact_id = new.id
            and o.version = new.current_version
            and o.check_id = c->>'id'
            and o.expires_at > now()
       );
    if pendientes > 0 then
      raise exception 'No se puede aprobar: % chequeo(s) bloqueante(s) sin resolver ni justificar', pendientes;
    end if;
  end if;
  return new;
end $$;

create trigger artifacts_guardrails before update on artifacts
  for each row execute function enforce_guardrails();

alter table guardrail_profiles  enable row level security;
alter table guardrail_overrides enable row level security;
create policy gp_read on guardrail_profiles for select to authenticated using (true);
create policy go_member on guardrail_overrides for all to authenticated using (is_member(workspace_id)) with check (is_member(workspace_id));
