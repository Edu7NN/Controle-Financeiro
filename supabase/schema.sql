-- Controle financeiro: tabelas, regras de acesso (RLS) e histórico de versões.
-- Cole tudo no SQL Editor do Supabase e clique em Run.

create table if not exists public.financeiro (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.financeiro_historico (
  id bigint generated always as identity primary key,
  user_id uuid not null,
  data jsonb not null,
  saved_at timestamptz not null default now()
);

alter table public.financeiro enable row level security;
alter table public.financeiro_historico enable row level security;

drop policy if exists "ler o proprio" on public.financeiro;
drop policy if exists "criar o proprio" on public.financeiro;
drop policy if exists "alterar o proprio" on public.financeiro;
drop policy if exists "ler historico proprio" on public.financeiro_historico;
create policy "ler o proprio" on public.financeiro for select using (auth.uid() = user_id);
create policy "criar o proprio" on public.financeiro for insert with check (auth.uid() = user_id);
create policy "alterar o proprio" on public.financeiro for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "ler historico proprio" on public.financeiro_historico for select using (auth.uid() = user_id);

-- Antes de cada alteração guarda a versão anterior (no máximo 1 por hora, últimas 200) e atualiza updated_at.
create or replace function public.financeiro_before_update() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.financeiro_historico
                 where user_id = old.user_id and saved_at > now() - interval '1 hour') then
    insert into public.financeiro_historico (user_id, data) values (old.user_id, old.data);
    delete from public.financeiro_historico
     where user_id = old.user_id
       and id not in (select id from public.financeiro_historico where user_id = old.user_id order by id desc limit 200);
  end if;
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists financeiro_before_update on public.financeiro;
create trigger financeiro_before_update before update on public.financeiro
  for each row execute function public.financeiro_before_update();
