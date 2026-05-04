import { useEffect, useRef, useState } from 'react'
import { format } from 'date-fns'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { useFamily } from '../../contexts/FamilyContext'
import { useCategories } from '../../hooks/useCategories'
import { useAccounts } from '../../hooks/useAccounts'

const TYPE_TABS = [
  { id: 'expense',    label: '지출', activeClass: 'border-b-2 border-red-500 text-red-500'       },
  { id: 'income',     label: '수입', activeClass: 'border-b-2 border-emerald-500 text-emerald-600' },
  { id: 'investment', label: '투자', activeClass: 'border-b-2 border-violet-500 text-violet-600'  },
  { id: 'transfer',   label: '이체', activeClass: 'border-b-2 border-amber-500 text-amber-600'    },
]

export default function TransactionForm({ open, onClose, transaction, defaultDate, onSuccess }) {
  const { user } = useAuth()
  const { activeFamily } = useFamily()
  const { categories } = useCategories()
  const { accounts } = useAccounts()

  const [type, setType] = useState(transaction?.type || 'expense')
  const [amount, setAmount] = useState(transaction ? String(transaction.amount) : '')
  const [date, setDate] = useState(
    transaction?.date || defaultDate || format(new Date(), 'yyyy-MM-dd')
  )
  const [categoryId, setCategoryId] = useState(transaction?.category_id || '')
  const [accountId, setAccountId] = useState(transaction?.account_id || '')
  const [toAccountId, setToAccountId] = useState(transaction?.to_account_id || '')
  const [memo, setMemo] = useState(transaction?.memo || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const amountRef = useRef(null)

  useEffect(() => {
    if (open) setTimeout(() => amountRef.current?.focus(), 100)
  }, [open])

  useEffect(() => {
    setCategoryId('')
  }, [type])

  const filteredCategories = categories.filter(c => c.type === type)

  async function handleSubmit(e) {
    e.preventDefault()
    const amt = Number(amount)
    if (!amt || amt <= 0) { setError('금액을 입력하세요'); return }
    if (type === 'transfer' && !toAccountId) { setError('입금 계좌를 선택하세요'); return }
    if (type === 'transfer' && accountId === toAccountId) { setError('출금/입금 계좌가 동일합니다'); return }

    setLoading(true)
    setError('')
    try {
      const payload = {
        type,
        amount: amt,
        date,
        category_id: categoryId || null,
        account_id: accountId || null,
        to_account_id: type === 'transfer' ? (toAccountId || null) : null,
        memo: memo.trim() || null,
        user_id: user.id,
        family_id: activeFamily.id,
      }

      let err
      if (transaction) {
        ({ error: err } = await supabase.from('transactions').update(payload).eq('id', transaction.id))
      } else {
        ({ error: err } = await supabase.from('transactions').insert(payload))
      }
      if (err) throw err

      onSuccess?.()
      onClose()
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      {/* 배경 오버레이 */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* 폼 패널 */}
      <div className="relative bg-white w-full max-w-lg rounded-t-3xl md:rounded-2xl max-h-[92vh] flex flex-col shadow-2xl">
        {/* 드래그 핸들 (모바일) */}
        <div className="md:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-slate-200 rounded-full" />
        </div>

        {/* 타입 탭 */}
        <div className="flex border-b border-slate-100">
          {TYPE_TABS.map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => setType(t.id)}
              className={`flex-1 py-3.5 text-sm font-semibold transition-colors ${
                type === t.id ? t.activeClass : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* 폼 본문 */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* 금액 */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">금액</label>
            <div className="relative">
              <input
                ref={amountRef}
                type="number"
                inputMode="decimal"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0"
                className="w-full text-3xl font-bold text-right bg-slate-50 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-blue-300 pr-12"
              />
              <span className="absolute right-5 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-300">원</span>
            </div>
          </div>

          {/* 날짜 */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">날짜</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full bg-slate-50 rounded-2xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm font-medium"
            />
          </div>

          {/* 카테고리 (이체 제외) */}
          {type !== 'transfer' && (
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">카테고리</label>
              <select
                value={categoryId}
                onChange={e => setCategoryId(e.target.value)}
                className="w-full bg-slate-50 rounded-2xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm font-medium appearance-none"
              >
                <option value="">카테고리 선택 (선택)</option>
                {filteredCategories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* 계좌 */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              {type === 'transfer' ? '출금 계좌' : '계좌'}
            </label>
            <select
              value={accountId}
              onChange={e => setAccountId(e.target.value)}
              className="w-full bg-slate-50 rounded-2xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm font-medium appearance-none"
            >
              <option value="">계좌 선택 (선택)</option>
              {accounts.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>

          {/* 입금 계좌 (이체만) */}
          {type === 'transfer' && (
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">입금 계좌</label>
              <select
                value={toAccountId}
                onChange={e => setToAccountId(e.target.value)}
                className="w-full bg-slate-50 rounded-2xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm font-medium appearance-none"
              >
                <option value="">계좌 선택</option>
                {accounts.filter(a => a.id !== accountId).map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* 메모 */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">메모</label>
            <input
              type="text"
              value={memo}
              onChange={e => setMemo(e.target.value)}
              placeholder="메모 입력 (선택)"
              className="w-full bg-slate-50 rounded-2xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm"
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm bg-red-50 rounded-xl px-4 py-2">{error}</p>
          )}

          {/* 저장 버튼 */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white rounded-2xl py-4 font-semibold text-base transition-colors disabled:opacity-50 mt-2"
          >
            {loading ? '저장 중...' : transaction ? '수정하기' : '저장하기'}
          </button>
        </form>
      </div>
    </div>
  )
}
