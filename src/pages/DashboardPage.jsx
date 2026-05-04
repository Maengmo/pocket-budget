import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { useTransactions } from '../hooks/useTransactions'
import { useAccounts } from '../hooks/useAccounts'
import { useFamily } from '../contexts/FamilyContext'
import TransactionItem from '../components/transactions/TransactionItem'
import { ACCOUNT_TYPES, formatFull, formatKRW } from '../lib/constants'

export default function DashboardPage() {
  const today = new Date()
  const { transactions } = useTransactions(today.getFullYear(), today.getMonth() + 1)
  const { accounts, balances } = useAccounts()
  const { activeFamily } = useFamily()

  const { income, expense, investment } = useMemo(() => ({
    income:     transactions.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0),
    expense:    transactions.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0),
    investment: transactions.filter(t => t.type === 'investment').reduce((s, t) => s + Number(t.amount), 0),
  }), [transactions])

  const totalBalance = Object.values(balances).reduce((s, v) => s + v, 0)

  return (
    <div className="max-w-2xl mx-auto px-3 md:px-6 pt-4 pb-6 space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-xl font-bold text-slate-800">{format(today, 'M월', { locale: ko })} 요약</h2>
          {activeFamily && <p className="text-xs text-slate-400 mt-0.5">{activeFamily.name}</p>}
        </div>
        <p className="text-xs text-slate-400">{format(today, 'yyyy년 M월 d일', { locale: ko })}</p>
      </div>

      {/* 총 자산 */}
      <div className="bg-blue-500 rounded-2xl p-5 shadow-lg shadow-blue-200">
        <p className="text-blue-100 text-xs font-medium mb-1">총 자산</p>
        <p className="text-white text-3xl font-bold">{formatFull(totalBalance)}</p>
      </div>

      {/* 월별 요약 */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: '수입', amount: income, colorClass: 'text-emerald-600', bgClass: 'bg-emerald-50' },
          { label: '지출', amount: expense, colorClass: 'text-red-500',    bgClass: 'bg-red-50'     },
          { label: '투자', amount: investment, colorClass: 'text-violet-600', bgClass: 'bg-violet-50' },
        ].map(({ label, amount, colorClass, bgClass }) => (
          <div key={label} className={`${bgClass} rounded-2xl p-4`}>
            <p className="text-xs font-medium text-slate-500 mb-1">{label}</p>
            <p className={`text-lg font-bold ${colorClass} leading-tight`}>{formatKRW(amount)}</p>
          </div>
        ))}
      </div>

      {/* 계좌 잔액 */}
      {accounts.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
            <h3 className="font-semibold text-slate-700 text-sm">계좌</h3>
            <Link to="/accounts" className="text-xs text-blue-500">전체보기</Link>
          </div>
          <div className="divide-y divide-slate-50">
            {accounts.map(acc => (
              <div key={acc.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-700">{acc.name}</p>
                  <p className="text-xs text-slate-400">{ACCOUNT_TYPES[acc.type]?.label}</p>
                </div>
                <p className={`font-semibold text-sm ${(balances[acc.id] || 0) >= 0 ? 'text-slate-700' : 'text-red-500'}`}>
                  {formatFull(balances[acc.id] || 0)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 최근 거래 */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
          <h3 className="font-semibold text-slate-700 text-sm">최근 거래</h3>
          <Link to="/list" className="text-xs text-blue-500">전체보기</Link>
        </div>
        {transactions.length === 0 ? (
          <div className="py-8 text-center text-slate-300 text-sm">이번 달 거래가 없습니다</div>
        ) : (
          <div className="divide-y divide-slate-50">
            {transactions.slice(0, 5).map(tx => (
              <TransactionItem key={tx.id} tx={tx} accounts={accounts} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
