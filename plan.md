# Family Finance Web (Supabase + GitHub Pages)

## 프로젝트 개요

가족 단위로 수입, 지출, 투자까지 통합 관리할 수 있는 웹 기반 가계부 서비스.

- 멀티 패밀리 지원 (한 유저가 여러 패밀리에 속할 수 있음)
- 캘린더 기반 가계부
- 통계 및 자산 관리
- Supabase 기반 인증 및 보안

---

## 아키텍처

**Frontend**
- React (Vite)
- GitHub Pages 배포

**Backend**
- Supabase (Auth + PostgreSQL + RLS)

---

## 핵심 설계 원칙

1. 모든 데이터는 `family_id` 기준으로 격리
2. 유저는 여러 패밀리에 속할 수 있음
3. `active_family_id` 기준으로 데이터 조회
4. 금융 데이터는 `transactions` 하나로 통합 관리
5. `accounts.balance`는 `transactions`에서 실시간 계산 (stored value 사용 안 함 — 데이터 불일치 방지)

---

## ERD 구조

```
users
├─ family_members (user_id FK)
│   └─ families (family_id FK)
│       ├─ transactions
│       ├─ categories
│       └─ accounts
└─ invitations (invited_user_id FK, nullable)
```

관계 요약:
- users ↔ family_members ↔ families (다대다)
- families → transactions, categories, accounts (일대다)

---

## DDL (최종)

### users

```sql
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  active_family_id uuid references public.families(id) on delete set null,
  created_at timestamp default now()
);
```

> `active_family_id`는 circular dependency이므로 families 테이블 생성 후 FK 추가:
> ```sql
> alter table public.users
>   add constraint users_active_family_id_fkey
>   foreign key (active_family_id) references public.families(id) on delete set null;
> ```

---

### families

```sql
create table public.families (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid references public.users(id) on delete set null,
  created_at timestamp default now()
);
```

---

### family_members

```sql
create table public.family_members (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references public.families(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  role text check (role in ('owner', 'admin', 'member')) default 'member',
  status text check (status in ('pending', 'accepted', 'rejected', 'left')) default 'pending',
  joined_at timestamp default now(),
  unique (family_id, user_id)
);
```

---

### invitations

```sql
create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references public.families(id) on delete cascade,
  invited_email text not null,               -- 미가입자도 초대 가능
  invited_user_id uuid references public.users(id) on delete cascade, -- 가입 후 매핑
  invited_by uuid references public.users(id) on delete set null,
  status text check (status in ('pending', 'accepted', 'rejected')) default 'pending',
  created_at timestamp default now()
);
```

---

### categories

```sql
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references public.families(id) on delete cascade,
  type text check (type in ('income', 'expense', 'investment')) not null,
  name text not null
);
```

> 패밀리 생성 시 기본 카테고리를 함께 INSERT (아래 기능 설계 참고).

---

### accounts (자산 계좌)

```sql
create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references public.families(id) on delete cascade,
  name text not null,
  type text check (type in ('cash', 'bank', 'investment')) not null,
  created_at timestamp default now()
);
```

> `balance` 컬럼 없음 — 잔액은 transactions에서 계산:
> ```sql
> select
>   account_id,
>   sum(case when type = 'income' then amount
>            when type = 'transfer' and to_account_id = :id then amount
>            else -amount end) as balance
> from transactions
> where account_id = :id or to_account_id = :id
> group by account_id;
> ```

---

### transactions (핵심)

```sql
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references public.families(id) on delete cascade,
  user_id uuid references public.users(id) on delete set null,
  type text check (type in ('income', 'expense', 'investment', 'transfer')) not null,
  amount numeric not null check (amount > 0),
  category_id uuid references public.categories(id) on delete set null,
  account_id uuid references public.accounts(id) on delete set null,
  to_account_id uuid references public.accounts(id) on delete set null, -- transfer 전용
  memo text,
  date date not null,
  created_at timestamp default now()
);
```

> `transfer` 타입일 때 `to_account_id` 필수는 앱 레이어에서 검증 (SQL check 제약은 cross-column이라 trigger로 처리 가능):
> ```sql
> create or replace function check_transfer_account()
> returns trigger as $$
> begin
>   if new.type = 'transfer' and new.to_account_id is null then
>     raise exception 'transfer 타입은 to_account_id 필수';
>   end if;
>   return new;
> end;
> $$ language plpgsql;
>
> create trigger enforce_transfer_account
>   before insert or update on transactions
>   for each row execute function check_transfer_account();
> ```

---

## Supabase Trigger: 회원가입 시 users 자동 생성

```sql
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, name)
  values (new.id, new.raw_user_meta_data->>'name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

---

## RLS 정책

### 활성화

```sql
alter table public.users enable row level security;
alter table public.families enable row level security;
alter table public.family_members enable row level security;
alter table public.invitations enable row level security;
alter table public.categories enable row level security;
alter table public.accounts enable row level security;
alter table public.transactions enable row level security;
```

---

### users — 본인만 조회/수정

```sql
create policy "users: self access"
on public.users for all
using (id = auth.uid());
```

---

### families — 멤버만 조회, owner만 수정/삭제

```sql
create policy "families: member read"
on public.families for select
using (
  id in (
    select family_id from public.family_members
    where user_id = auth.uid() and status = 'accepted'
  )
);

create policy "families: owner write"
on public.families for update using (owner_id = auth.uid());

create policy "families: owner delete"
on public.families for delete using (owner_id = auth.uid());
```

---

### family_members — 같은 패밀리 멤버 조회, 본인만 수정

```sql
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
```

---

### invitations — 수신자 및 같은 패밀리 admin 이상 조회

```sql
create policy "invitations: target read"
on public.invitations for select
using (
  invited_user_id = auth.uid()
  or family_id in (
    select family_id from public.family_members
    where user_id = auth.uid() and status = 'accepted' and role in ('owner', 'admin')
  )
);
```

---

### transactions / categories / accounts — 패밀리 멤버 접근

```sql
-- 아래 패턴을 transactions, categories, accounts 각각에 적용
create policy "family member access"
on public.transactions for all
using (
  family_id in (
    select family_id from public.family_members
    where user_id = auth.uid() and status = 'accepted'
  )
);
```

---

## 기능 설계

### 인증

- Supabase Auth (이메일/비밀번호)
- 회원가입 → `on_auth_user_created` trigger로 users 자동 생성
- 로그인 후 `active_family_id` 없으면 패밀리 생성/참여 화면으로 리다이렉트

---

### 패밀리

#### 생성 플로우 (트랜잭션으로 처리)
1. `families` INSERT
2. `family_members` INSERT (role = 'owner', status = 'accepted')
3. `users.active_family_id` UPDATE
4. 기본 카테고리 INSERT (income: 급여/용돈, expense: 식비/교통/생활, investment: 주식/부동산)

#### 초대
- `invitations` INSERT (invited_email 기준)
- 초대받은 이메일로 가입 시 `invited_user_id` 매핑
- 수락 → `family_members` INSERT (status = 'accepted')

#### 수락/거절
- `invitations.status` UPDATE
- 수락 시 `family_members` 생성

#### 탈퇴
- `family_members.status = 'left'`
- 해당 패밀리가 `active_family_id`였다면 다른 패밀리로 전환

---

### 가계부

| type       | 설명              | to_account_id |
|------------|-------------------|---------------|
| income     | 수입              | 불필요         |
| expense    | 지출              | 불필요         |
| investment | 투자              | 불필요         |
| transfer   | 계좌 이동          | 필수           |

---

### 통계

- 월별 수입/지출/투자 합계
- 카테고리별 소비 비율
- 사용자별 지출
- 계좌별 잔액 현황

---

### UI 화면 구성

| 화면           | 내용                                      |
|----------------|------------------------------------------|
| 대시보드       | 이번 달 요약, 계좌 잔액 목록              |
| 캘린더         | 날짜별 거래 표시                          |
| 거래 리스트    | 필터(수입/지출/투자), 검색                |
| 거래 입력/수정 | 타입, 금액, 카테고리, 계좌, 날짜, 메모    |
| 통계           | 월별 차트, 카테고리 파이차트              |
| 계좌 관리      | 계좌 목록, 잔액(계산값), 추가/삭제        |
| 마이페이지     | 이름/이메일/비밀번호 변경, 패밀리 관리    |

---

## Supabase 코드 스니펫

### 비밀번호 변경

```js
await supabase.auth.updateUser({ password: 'new-password' })
```

### 이메일 변경

```js
await supabase.auth.updateUser({ email: 'new@email.com' })
```

### 패밀리 생성 (RPC 권장)

```sql
-- Supabase function으로 트랜잭션 처리
create or replace function create_family(family_name text)
returns uuid as $$
declare
  new_family_id uuid;
begin
  insert into families (name, owner_id) values (family_name, auth.uid())
    returning id into new_family_id;

  insert into family_members (family_id, user_id, role, status)
    values (new_family_id, auth.uid(), 'owner', 'accepted');

  update users set active_family_id = new_family_id where id = auth.uid();

  -- 기본 카테고리
  insert into categories (family_id, type, name) values
    (new_family_id, 'income',     '급여'),
    (new_family_id, 'income',     '용돈'),
    (new_family_id, 'expense',    '식비'),
    (new_family_id, 'expense',    '교통'),
    (new_family_id, 'expense',    '생활'),
    (new_family_id, 'investment', '주식'),
    (new_family_id, 'investment', '부동산');

  return new_family_id;
end;
$$ language plpgsql security definer;
```

---

## 개발 순서

1. Supabase 프로젝트 생성
2. DDL 실행 (순서: families → users FK 추가 → family_members → invitations → categories → accounts → transactions)
3. Trigger 등록 (handle_new_user, enforce_transfer_account)
4. RLS 설정
5. `create_family` RPC 등록
6. React 프로젝트 세팅 (Vite + React Router + Supabase JS)
7. 인증 (회원가입/로그인/로그아웃)
8. 패밀리 생성/초대/수락
9. 거래 CRUD
10. 캘린더/리스트 UI
11. 계좌 관리
12. 통계 화면
13. 마이페이지
14. 배포 (GitHub Pages)

---

## 배포

- `vite build` → `dist/` 생성
- GitHub Pages 배포 (`gh-pages` 브랜치 또는 Actions)
- **주의**: `.env`의 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`는 빌드 시 번들에 포함됨
  - `anon key`는 RLS로 보호되므로 공개 노출 허용
  - `service_role key`는 절대 프론트엔드에 넣지 말 것

---

## 확장 기능 (v2)

- 투자 수익률 계산
- 소비 패턴 분석 및 예산 알림
- 영수증 이미지 업로드 (Supabase Storage)
- 사용자별 권한 관리 (admin/member 분리)
- 반복 거래 설정

---

## 핵심 요약

- `transactions` 하나로 모든 금융 데이터 처리
- `family_members` 중심 구조 — `status = 'accepted'`인 멤버만 데이터 접근
- `active_family_id`로 현재 패밀리 컨텍스트 관리
- `accounts.balance`는 저장 안 하고 transactions에서 계산
- RLS로 패밀리 간 데이터 완전 격리

---

END
