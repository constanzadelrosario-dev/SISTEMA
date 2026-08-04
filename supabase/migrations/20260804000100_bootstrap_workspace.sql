-- E2 · Primer workspace.
-- Al entrar por primera vez, el usuario autenticado no tiene membresía y
-- `requireAuth` falla con "Sin workspace asignado". Esta función crea el
-- primer workspace y su membresía `owner`, y su perfil. Es idempotente: si ya
-- tiene, devuelve el que tiene y no crea nada.
--
-- `security definer` es necesario: un usuario recién creado no tiene membresía,
-- así que las políticas RLS bloquearían el insert inicial. La función corre con
-- privilegios del dueño para el arranque, pero solo actúa sobre `auth.uid()`.

create or replace function bootstrap_workspace(ws_name text default 'Mi espacio')
returns uuid
language plpgsql
security definer
set search_path = public as $$
declare ws uuid;
begin
  select workspace_id into ws
  from memberships
  where user_id = auth.uid()
  limit 1;
  if ws is not null then
    return ws;
  end if;

  insert into workspaces (name) values (ws_name) returning id into ws;
  insert into memberships (workspace_id, user_id, role)
    values (ws, auth.uid(), 'owner');
  insert into profiles (id, email)
    values (
      auth.uid(),
      coalesce((select email from auth.users where id = auth.uid()), '')
    )
    on conflict (id) do nothing;

  return ws;
end $$;

-- Solo un usuario autenticado puede arrancar su propio espacio.
revoke all on function bootstrap_workspace(text) from public;
grant execute on function bootstrap_workspace(text) to authenticated;
