# Pocket Budget

가족 단위로 수입, 지출, 투자를 통합 관리하는 웹 가계부 서비스.

## 주요 기능

- 캘린더 기반 거래 입력 및 조회
- 수입 / 지출 / 투자 / 이체 거래 관리
- 월별 통계 및 카테고리별 차트
- 계좌별 잔액 현황 (transactions 기반 실시간 계산)
- 멀티 패밀리 지원 (한 계정으로 여러 가족 그룹 관리)
- 모바일 반응형 UI

## 기술 스택

| 구분 | 기술 |
|------|------|
| Frontend | React 18 + Vite |
| Routing | React Router v6 (HashRouter) |
| Styling | Tailwind CSS |
| Backend | Supabase (Auth + PostgreSQL + RLS) |
| Charts | Recharts |
| Date | date-fns v3 |
| 배포 | GitHub Pages (GitHub Actions) |

## 로컬 실행

```bash
# 패키지 설치
npm install

# 개발 서버 실행 (http://localhost:5173)
npm run dev
```

### 환경 변수 설정

프로젝트 루트에 `.env` 파일 생성:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## 배포 (GitHub Pages)

`main` 브랜치에 push하면 GitHub Actions가 자동으로 빌드 후 `gh-pages` 브랜치에 배포합니다.

**사전 설정 필요** — GitHub 레포 Settings → Secrets and variables → Actions에 아래 두 값을 등록:

| Secret 이름 | 값 |
|-------------|-----|
| `VITE_SUPABASE_URL` | Supabase 프로젝트 URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key |

## 프로젝트 구조

```
src/
├── contexts/
│   ├── AuthContext.jsx       # 인증 상태 (session 기반)
│   └── FamilyContext.jsx     # 활성 패밀리 상태
├── hooks/
│   ├── useTransactions.js    # 거래 CRUD
│   ├── useAccounts.js        # 계좌 및 잔액 계산
│   └── useCategories.js      # 카테고리
├── pages/
│   ├── CalendarPage.jsx      # 캘린더 (핵심 화면)
│   ├── DashboardPage.jsx     # 대시보드
│   ├── ListPage.jsx          # 거래 목록
│   ├── StatsPage.jsx         # 통계
│   ├── AccountsPage.jsx      # 계좌 관리
│   ├── MyPage.jsx            # 마이페이지
│   ├── auth/                 # 로그인 / 회원가입
│   └── setup/                # 패밀리 초기 설정
├── components/
│   ├── calendar/             # 캘린더 컴포넌트
│   ├── transactions/         # 거래 입력 폼, 거래 아이템
│   └── layout/               # 앱 레이아웃, 네비게이션
└── lib/
    ├── supabase.js           # Supabase 클라이언트
    └── constants.js          # 공통 상수 및 포맷 함수
```

## DB 설계 요약

```
users
├── family_members (user_id FK)
│   └── families (family_id FK)
│       ├── transactions
│       ├── categories
│       └── accounts
└── invitations
```

- 모든 데이터는 `family_id` 기준으로 RLS 격리
- `accounts.balance` 컬럼 없음 — `transactions`에서 실시간 계산
- `users.active_family_id`로 현재 활성 패밀리 관리

## Supabase 초기 설정

`ddl.sql` 파일을 Supabase SQL Editor에서 순서대로 실행하면 테이블, RLS 정책, 트리거, RPC 함수가 모두 생성됩니다.
