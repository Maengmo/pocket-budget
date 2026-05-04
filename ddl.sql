-- ============================================================
-- Family Finance Web — Supabase DDL
-- ============================================================


-- ============================================================
-- 1. TABLES
-- ============================================================

-- users (active_family_id FK는 families 생성 후 ALTER로 추가)
create table if not exists public.users (
  id               uuid        primary key references auth.users(id) on delete cascade,
  name             text,
  active_family_id uuid,                        -- FK는 아래 ALTER에서 추가
  created_at       timestamptz default now()
);

-- families
create table if not exists public.families (
  id         uuid        primary key default gen_random_uuid(),
  name       text        not null,
  owner_id   uuid        references public.users(id) on delete set null,
  created_at timestamptz default now()
);

-- users.active_family_id → families (circular dependency라 ALTER로 추가)
alter table public.users
  add constraint users_active_family_id_fkey
  foreign key (active_family_id)
  references public.families(id)
  on delete set null;

-- family_members
create table if not exists public.family_members (
  id        uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  user_id   uuid not null references public.users(id)    on delete cascade,
  role      text not null default 'member'
              check (role   in ('owner', 'admin', 'member')),
  status    text not null default 'pending'
              check (status in ('pending', 'accepted', 'rejected', 'left')),
  joined_at timestamptz default now(),
  unique (family_id, user_id)
);

-- invitations
create table if not exists public.invitations (
  id              uuid primary key default gen_random_uuid(),
  family_id       uuid not null references public.families(id) on delete cascade,
  invited_email   text not null,
  invited_user_id uuid references public.users(id) on delete cascade,
  invited_by      uuid references public.users(id) on delete set null,
  status          text not null default 'pending'
                    check (status in ('pending', 'accepted', 'rejected')),
  created_at      timestamptz default now()
);

-- categories
create table if not exists public.categories (
  id        uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  type      text not null check (type in ('income', 'expense', 'investment')),
  name      text not null
);

-- accounts (잔액은 transactions에서 계산 — balance 컬럼 없음)
create table if not exists public.accounts (
  id         uuid        primary key default gen_random_uuid(),
  family_id  uuid        not null references public.families(id) on delete cascade,
  name       text        not null,
  type       text        not null check (type in ('cash', 'bank', 'investment')),
  created_at timestamptz default now()
);

-- transactions
create table if not exists public.transactions (
  id            uuid    primary key default gen_random_uuid(),
  family_id     uuid    not null references public.families(id)   on delete cascade,
  user_id       uuid    references public.users(id)               on delete set null,
  type          text    not null check (type in ('income', 'expense', 'investment', 'transfer')),
  amount        numeric not null check (amount > 0),
  category_id   uuid    references public.categories(id)          on delete set null,
  account_id    uuid    references public.accounts(id)            on delete set null,
  to_account_id uuid    references public.accounts(id)            on delete set null,
  memo          text,
  date          date    not null,
  created_at    timestamptz default now()
);


-- ============================================================
-- 2. TRIGGERS
-- ============================================================

-- 2-1. 회원가입 시 public.users 자동 생성
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', new.email)
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2-2. transfer 타입은 to_account_id 필수 / 동일 계좌 이동 방지
create or replace function public.check_transfer_account()
returns trigger
language plpgsql
as $$
begin
  if new.type = 'transfer' and new.to_account_id is null then
    raise exception 'transfer 타입은 to_account_id가 필수입니다.';
  end if;
  if new.type = 'transfer' and new.account_id = new.to_account_id then
    raise exception '출금 계좌와 입금 계좌가 동일합니다.';
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_transfer_account on public.transactions;
create trigger enforce_transfer_account
  before insert or update on public.transactions
  for each row execute function public.check_transfer_account();


-- ============================================================
-- 3. RLS 활성화
-- ============================================================

alter table public.users          enable row level security;
alter table public.families       enable row level security;
alter table public.family_members enable row level security;
alter table public.invitations    enable row level security;
alter table public.categories     enable row level security;
alter table public.accounts       enable row level security;
alter table public.transactions   enable row level security;


-- ============================================================
-- 4. RLS 정책
-- ============================================================

-- [users] 본인만 조회/수정
create policy "users: self read"
  on public.users for select
  using (id = auth.uid());

create policy "users: self update"
  on public.users for update
  using (id = auth.uid());

-- [families] 멤버 조회 / owner 수정·삭제
create policy "families: member read"
  on public.families for select
  using (
    id in (
      select family_id from public.family_members
      where user_id = auth.uid() and status = 'accepted'
    )
  );

create policy "families: owner update"
  on public.families for update
  using (owner_id = auth.uid());

create policy "families: owner delete"
  on public.families for delete
  using (owner_id = auth.uid());

-- [family_members] 같은 패밀리 멤버 조회 / 본인 행 수정
create policy "family_members: family read"
  on public.family_members for select
  using (
    family_id in (
      select family_id from public.family_members
      where user_id = auth.uid() and status = 'accepted'
    )
  );

create policy "family_members: self update"
  on public.family_members for update
  using (user_id = auth.uid());

-- [invitations] 수신자 또는 같은 패밀리 admin 이상 조회
create policy "invitations: target or admin read"
  on public.invitations for select
  using (
    invited_user_id = auth.uid()
    or family_id in (
      select family_id from public.family_members
      where user_id = auth.uid()
        and status = 'accepted'
        and role in ('owner', 'admin')
    )
  );

create policy "invitations: admin insert"
  on public.invitations for insert
  with check (
    family_id in (
      select family_id from public.family_members
      where user_id = auth.uid()
        and status = 'accepted'
        and role in ('owner', 'admin')
    )
  );

create policy "invitations: target update"
  on public.invitations for update
  using (invited_user_id = auth.uid());

-- [categories] 패밀리 멤버 전체 접근
create policy "categories: family access"
  on public.categories for all
  using (
    family_id in (
      select family_id from public.family_members
      where user_id = auth.uid() and status = 'accepted'
    )
  );

-- [accounts] 패밀리 멤버 전체 접근
create policy "accounts: family access"
  on public.accounts for all
  using (
    family_id in (
      select family_id from public.family_members
      where user_id = auth.uid() and status = 'accepted'
    )
  );

-- [transactions] 패밀리 멤버 전체 접근
create policy "transactions: family access"
  on public.transactions for all
  using (
    family_id in (
      select family_id from public.family_members
      where user_id = auth.uid() and status = 'accepted'
    )
  );


-- ============================================================
-- 5. FUNCTIONS (RPC)
-- ============================================================

-- 패밀리 생성 + 기본 카테고리 + active_family 설정을 하나의 트랜잭션으로
create or replace function public.create_family(family_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_family_id uuid;
begin
  insert into public.families (name, owner_id)
  values (family_name, auth.uid())
  returning id into new_family_id;

  insert into public.family_members (family_id, user_id, role, status)
  values (new_family_id, auth.uid(), 'owner', 'accepted');

  update public.users
  set active_family_id = new_family_id
  where id = auth.uid();

  insert into public.categories (family_id, type, name) values
    (new_family_id, 'income',     '급여'),
    (new_family_id, 'income',     '용돈'),
    (new_family_id, 'income',     '기타수입'),
    (new_family_id, 'expense',    '식비'),
    (new_family_id, 'expense',    '교통'),
    (new_family_id, 'expense',    '생활'),
    (new_family_id, 'expense',    '의료'),
    (new_family_id, 'expense',    '문화/여가'),
    (new_family_id, 'expense',    '기타지출'),
    (new_family_id, 'investment', '주식'),
    (new_family_id, 'investment', '부동산'),
    (new_family_id, 'investment', '기타투자');

  return new_family_id;
end;
$$;


-- ============================================================
-- 6. VIEWS
-- ============================================================

-- 계좌별 잔액 계산 뷰
create or replace view public.account_balances as
select
  a.id        as account_id,
  a.family_id,
  a.name,
  a.type,
  coalesce(
    sum(
      case
        when t.type in ('income', 'investment') and t.account_id    = a.id then  t.amount
        when t.type = 'transfer'                and t.to_account_id = a.id then  t.amount
        when t.type = 'expense'                 and t.account_id    = a.id then -t.amount
        when t.type = 'transfer'                and t.account_id    = a.id then -t.amount
        else 0
      end
    ),
    0
  ) as balance
from public.accounts a
left join public.transactions t
  on t.account_id = a.id or t.to_account_id = a.id
group by a.id, a.family_id, a.name, a.type;
