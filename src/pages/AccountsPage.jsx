import { useState } from 'react'
import { useAccounts } from '../hooks/useAccounts'
import { ACCOUNT_TYPES, formatFull } from '../lib/constants'

const ACCOUNT_TYPE_OPTIONS = [
  { value: 'cash',       label: '현금' },
  { value: 'bank',       label: '은행' },
  { value: 'investment', label: '투자' },
]

export default function AccountsPage() {
  const { accounts, balances, loading, addAccount, deleteAccount } = useAccounts()
  const [showAdd, setShowAdd] = useState(false)
  const [name, setName] = useState('')
  const [type, setType] = useState('bank')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const totalBalance = Object.values(balances).reduce((s, v) => s + v, 0)

  async function handleAdd(e) {
    e.preventDefault()
    if (!name.trim()) { setError('계좌 이름을 입력하세요'); return }
    setSaving(true)
    setError('')
    try {
      await addAccount({ name: name.trim(), type })
      setName('')
      setType('bank')
      setShowAdd(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id, accName) {
    if (!confirm(`"${accName}" 계좌를 삭제하시겠습니까?\n연결된 거래는 계좌 정보가 해제됩니다.`)) return
    await deleteAccount(id)
  }

  return (
    <div className="max-w-2xl mx-auto px-3 md:px-6 pt-4 pb-6 space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xl font-bold text-slate-800">계좌 관리</h2>
        <button
          onClick={() => setShowAdd(v => !v)}
          className="flex items-center gap-1.5 text-sm font-medium text-blue-500 hover:text-blue-600"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          계좌 추가
        </button>
      </div>

      {/* 총 잔액 */}
      <div className="bg-blue-500 rounded-2xl p-5 shadow-lg shadow-blue-200">
        <p className="text-blue-100 text-xs font-medium mb-1">총 자산</p>
        <p className="text-white text-2xl font-bold">{formatFull(totalBalance)}</p>
      </div>

      {/* 계좌 추가 폼 */}
      {showAdd && (
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h3 className="font-semibold text-slate-700 text-sm mb-4">새 계좌 추가</h3>
          <form onSubmit={handleAdd} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">계좌 이름</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="예: 신한은행, 현금, 증권계좌"
                className="w-full bg-slate-50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">계좌 종류</label>
              <div className="flex gap-2">
                {ACCOUNT_TYPE_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setType(opt.value)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      type === opt.value
                        ? 'bg-blue-500 text-white'
                        : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            {error && <p className="text-red-500 text-xs">{error}</p>}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="flex-1 py-3 rounded-xl text-sm font-medium text-slate-500 bg-slate-50 hover:bg-slate-100"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-3 rounded-xl text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 disabled:opacity-50"
              >
                {saving ? '추가 중...' : '추가'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 계좌 목록 */}
      {loading ? (
        <div className="py-8 flex justify-center">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : accounts.length === 0 ? (
        <div className="bg-white rounded-2xl py-16 text-center text-slate-300 text-sm shadow-sm">
          계좌가 없습니다
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-50">
            {accounts.map(acc => {
              const bal = balances[acc.id] || 0
              return (
                <div key={acc.id} className="flex items-center px-5 py-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-700">{acc.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{ACCOUNT_TYPES[acc.type]?.label}</p>
                  </div>
                  <div className="text-right mr-3">
                    <p className={`font-bold text-sm ${bal >= 0 ? 'text-slate-800' : 'text-red-500'}`}>
                      {formatFull(bal)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(acc.id, acc.name)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-400 transition-colors"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14H6L5 6" />
                      <path d="M10 11v6M14 11v6" />
                      <path d="M9 6V4h6v2" />
                    </svg>
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
