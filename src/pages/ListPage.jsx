import { useState, useMemo } from 'react'
import { format, subMonths, addMonths } from 'date-fns'
import { ko } from 'date-fns/locale'
import { useTransactions } from '../hooks/useTransactions'
import { useAccounts } from '../hooks/useAccounts'
import TransactionItem from '../components/transactions/TransactionItem'
import TransactionForm from '../components/transactions/TransactionForm'
import { formatFull } from '../lib/constants'

const FILTERS = [
  { id: 'all',        label: '전체' },
  { id: 'expense',    label: '지출' },
  { id: 'income',     label: '수입' },
  { id: 'investment', label: '투자' },
  { id: 'transfer',   label: '이체' },
]

export default function ListPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [filter, setFilter] = useState('all')
  const [editTx, setEditTx] = useState(null)
  const [showForm, setShowForm] = useState(false)

  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth() + 1
  const { transactions, loading, error, reload, deleteTransaction } = useTransactions(year, month)
  const { accounts } = useAccounts()

  const filtered = useMemo(() =>
    filter === 'all' ? transactions : transactions.filter(t => t.type === filter),
    [transactions, filter]
  )

  const totals = useMemo(() => ({
    income:     transactions.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0),
    expense:    transactions.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0),
    investment: transactions.filter(t => t.type === 'investment').reduce((s, t) => s + Number(t.amount), 0),
  }), [transactions])

  async function handleDelete(id) {
    if (!confirm('이 거래를 삭제하시겠습니까?')) return
    await deleteTransaction(id)
  }

  const grouped = useMemo(() => {
    const map = {}
    filtered.forEach(tx => {
      if (!map[tx.date]) map[tx.date] = []
      map[tx.date].push(tx)
    })
    return Object.entries(map).sort(([a], [b]) => b.localeCompare(a))
  }, [filtered])

  return (
    <div className="max-w-2xl mx-auto px-3 md:px-6 pt-4 pb-6 space-y-3">
      {/* 월 선택 */}
      <div className="flex items-center justify-between bg-white rounded-2xl shadow-sm px-5 py-3">
        <button onClick={() => setCurrentMonth(m => subMonths(m, 1))} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        <h2 className="font-bold text-slate-800">{format(currentMonth, 'yyyy년 M월', { locale: ko })}</h2>
        <button onClick={() => setCurrentMonth(m => addMonths(m, 1))} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><polyline points="9 18 15 12 9 6" /></svg>
        </button>
      </div>

      {/* 에러 */}
      {error && <div className="px-4 py-2 bg-red-50 text-red-500 text-xs rounded-xl">{error}</div>}

      {/* 요약 */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-emerald-50 rounded-xl p-3 text-center">
          <p className="text-xs text-slate-500">수입</p>
          <p className="font-bold text-emerald-600 text-sm mt-0.5">{formatFull(totals.income)}</p>
        </div>
        <div className="bg-red-50 rounded-xl p-3 text-center">
          <p className="text-xs text-slate-500">지출</p>
          <p className="font-bold text-red-500 text-sm mt-0.5">{formatFull(totals.expense)}</p>
        </div>
        <div className="bg-violet-50 rounded-xl p-3 text-center">
          <p className="text-xs text-slate-500">투자</p>
          <p className="font-bold text-violet-600 text-sm mt-0.5">{formatFull(totals.investment)}</p>
        </div>
      </div>

      {/* 필터 */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {FILTERS.map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              filter === f.id ? 'bg-blue-500 text-white shadow-sm' : 'bg-white text-slate-500 hover:bg-slate-100'
            }`}
          >{f.label}</button>
        ))}
      </div>

      {/* 거래 목록 */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : grouped.length === 0 ? (
        <div className="bg-white rounded-2xl py-16 text-center text-slate-300 text-sm shadow-sm">거래 내역이 없습니다</div>
      ) : (
        <div className="space-y-3">
          {grouped.map(([date, txs]) => {
            const di = txs.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
            const de = txs.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
            return (
              <div key={date} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-2.5 bg-slate-50">
                  <span className="text-xs font-semibold text-slate-600">
                    {format(new Date(date + 'T00:00:00'), 'M월 d일 (EEE)', { locale: ko })}
                  </span>
                  <div className="flex gap-2 text-xs">
                    {di > 0 && <span className="text-emerald-600">+{formatFull(di)}</span>}
                    {de > 0 && <span className="text-red-500">-{formatFull(de)}</span>}
                  </div>
                </div>
                <div className="divide-y divide-slate-50">
                  {txs.map(tx => (
                    <TransactionItem key={tx.id} tx={tx} accounts={accounts}
                      onClick={t => { setEditTx(t); setShowForm(true) }}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showForm && (
        <TransactionForm
          open={showForm}
          onClose={() => { setShowForm(false); setEditTx(null) }}
          transaction={editTx}
          onSuccess={() => { reload(); setShowForm(false); setEditTx(null) }}
        />
      )}
    </div>
  )
}
