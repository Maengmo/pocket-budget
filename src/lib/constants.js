export const TX_TYPES = {
  expense: {
    label: '지출',
    color: 'text-red-500',
    bg: 'bg-red-50',
    border: 'border-red-200',
    dot: 'bg-red-500',
    activeBorder: 'border-b-2 border-red-500',
    badge: 'bg-red-100 text-red-600',
  },
  income: {
    label: '수입',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
    activeBorder: 'border-b-2 border-emerald-500',
    badge: 'bg-emerald-100 text-emerald-700',
  },
  investment: {
    label: '투자',
    color: 'text-violet-600',
    bg: 'bg-violet-50',
    border: 'border-violet-200',
    dot: 'bg-violet-500',
    activeBorder: 'border-b-2 border-violet-500',
    badge: 'bg-violet-100 text-violet-700',
  },
  transfer: {
    label: '이체',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
    activeBorder: 'border-b-2 border-amber-500',
    badge: 'bg-amber-100 text-amber-700',
  },
}

export const ACCOUNT_TYPES = {
  cash:       { label: '현금' },
  bank:       { label: '은행' },
  investment: { label: '투자' },
}

export function formatKRW(amount) {
  const n = Math.abs(Number(amount))
  if (n === 0) return '0'
  if (n >= 100000000) {
    const v = n / 100000000
    return (v % 1 === 0 ? v : v.toFixed(1)) + '억'
  }
  if (n >= 10000) {
    const v = n / 10000
    return (v % 1 === 0 ? v : v.toFixed(1)) + '만'
  }
  return n.toLocaleString('ko-KR')
}

export function formatFull(amount) {
  return Number(amount).toLocaleString('ko-KR') + '원'
}
