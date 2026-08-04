---
name: db-migration
description: Usar al crear o modificar tablas, políticas RLS, funciones o índices del sistema. Disparadores: migración, tabla, RLS, esquema, supabase, índice.
---

# Migraciones

## Convención

`supabase/migrations/AAAAMMDDHHMMSS_tema.sql`. Una migración por tema. **Nunca**
se edita una migración ya aplicada: se escribe otra.

## Toda tabla nueva

1. `workspace_id uuid not null references workspaces(id) on delete cascade`
2. `alter table X enable row level security;`
3. Política con `is_member(workspace_id)` en `using` **y** en `with check`
4. Índice por las columnas de la consulta caliente
5. Trigger `touch_updated_at` si tiene `updated_at`

Prohibido `for all using (true)`. Ese fue el hallazgo bloqueante del sistema
anterior.

## Tablas hijas sin workspace_id

Política por existencia sobre el padre:

```sql
create policy hija_member on hija for all to authenticated
  using (exists (select 1 from padre p where p.id = padre_id and is_member(p.workspace_id)))
  with check (exists (select 1 from padre p where p.id = padre_id and is_member(p.workspace_id)));
```

## Antes de dar por terminada

- ¿Hay índice para cada consulta que hará la UI?
- ¿Las funciones son `security definer` con `set search_path = public`?
- ¿La restricción de negocio está en la base y no solo en la app?
