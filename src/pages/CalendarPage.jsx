import { useState } from 'react'
import { format, isSameDay } from 'date-fns'
import { ko } from 'date-fns/locale'
import Calendar from '../components/calendar/Calendar'
import TransactionItem from '../components/transactions/TransactionItem'
import TransactionForm from '../components/transactions/TransactionForm'
import { useTransactions } from '../hooks/useTransactions'
import { useAccounts } from '../hooks/useAccounts'
import { formatFull } from '../lib/constants'

export default function CalendarPage() {
  const today = new Date()
  const [currentMonth, setCurrentMonth] = useState(today)
  const [selectedDate, setSelectedDate] = useState(today)
  const [editTx, setEditTx] = useState(null)
  const [showForm, setShowForm] = useState(false)

  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth() + 1
  const { transactions, loading, error, reload, deleteTransaction } = useTransactions(year, month)
  const { accounts } = useAccounts()

  const dayTransactions = transactions.filter(tx =>
    isSameDay(new Date(tx.date + 'T00:00:00'), selectedDate)
  )

  const dayIncome  = dayTransactions.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
  const dayExpense = dayTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)

  async function handleDelete(id) {
    if (!confirm('이 거래를 삭제하시겠습니까?')) return
    await deleteTransaction(id)
  }

  return (
    <div className="max-w-2xl mx-auto px-3 md:px-6 pt-4 pb-6">
      {/* 로딩 */}
      {loading && (
        <div className="flex justify-center py-2 mb-2">
          <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* 에러 */}
      {error && (
        <div className="mb-3 px-4 py-2 bg-red-50 text-red-500 text-xs rounded-xl">{error}</div>
      )}

      {/* 캘린더 */}
      <Calendar
        transactions={transactions}
        currentMonth={currentMonth}
        onMonthChange={setCurrentMonth}
        selectedDate={selectedDate}
        onDayClick={setSelectedDate}
      />

      {/* 선택된 날짜 거래 목록 */}
      <div className="mt-4 bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
          <div>
            <h3 className="font-semibold text-slate-800 text-sm">
              {format(selectedDate, 'M월 d일 (EEE)', { locale: ko })}
            </h3>
            {(dayIncome > 0 || dayExpense > 0) && (
              <div className="flex gap-3 mt-0.5 text-xs">
                {dayIncome  > 0 && <span className="text-emerald-600">+{formatFull(dayIncome)}</span>}
                {dayExpense > 0 && <span className="text-red-500">-{formatFull(dayExpense)}</span>}
              </div>
            )}
          </div>
          <button
            onClick={() => { setEditTx(null); setShowForm(true) }}
            className="flex items-center gap-1.5 text-blue-500 text-sm font-medium hover:text-blue-600"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            추가
          </button>
        </div>

        {dayTransactions.length === 0 ? (
          <div className="py-10 text-center text-slate-300 text-sm">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-10 h-10 mx-auto mb-2 opacity-40">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            거래 내역이 없습니다
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {dayTransactions.map(tx => (
              <TransactionItem
                key={tx.id}
                tx={tx}
                accounts={accounts}
                onClick={t => { setEditTx(t); setShowForm(true) }}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <TransactionForm
          open={showForm}
          onClose={() => { setShowForm(false); setEditTx(null) }}
          transaction={editTx}
          defaultDate={format(selectedDate, 'yyyy-MM-dd')}
          onSuccess={() => { reload(); setShowForm(false); setEditTx(null) }}
        />
      )}
    </div>
  )
}
