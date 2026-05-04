import { TX_TYPES, formatFull } from '../../lib/constants'

export default function TransactionItem({ tx, accounts = [], onClick, onDelete }) {
  const typeConfig = TX_TYPES[tx.type] || TX_TYPES.expense
  const isIncome = tx.type === 'income'
  const isTransfer = tx.type === 'transfer'

  // to_account_id → accounts 목록에서 이름 조회
  const toAccountName = isTransfer
    ? (tx.to_account?.name ?? accounts.find(a => a.id === tx.to_account_id)?.name ?? '')
    : null

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 active:bg-slate-100 transition-colors cursor-pointer"
      onClick={() => onClick?.(tx)}
    >
      <div className={`w-2 h-10 rounded-full flex-shrink-0 ${typeConfig.dot}`} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className={`text-xs font-medium px-1.5 py-0.5 rounded-md ${typeConfig.badge}`}>
            {typeConfig.label}
          </span>
          {tx.categories?.name && (
            <span className="text-xs text-slate-400">{tx.categories.name}</span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          {tx.accounts?.name && (
            <span className="text-xs text-slate-500 truncate">
              {isTransfer && toAccountName
                ? `${tx.accounts.name} → ${toAccountName}`
                : tx.accounts.name}
            </span>
          )}
          {tx.memo && (
            <span className="text-xs text-slate-400 truncate">{tx.memo}</span>
          )}
        </div>
      </div>

      <div className="text-right flex-shrink-0">
        <div className={`font-semibold text-sm ${
          isIncome ? 'text-emerald-600'
          : isTransfer ? 'text-amber-600'
          : typeConfig.color
        }`}>
          {isIncome ? '+' : isTransfer ? '' : '-'}{formatFull(tx.amount)}
        </div>
        <div className="text-[11px] text-slate-400 mt-0.5">{tx.author?.name ?? ''}</div>
      </div>

      {onDelete && (
        <button
          onClick={e => { e.stopPropagation(); onDelete(tx.id) }}
          className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-400 transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
          </svg>
        </button>
      )}
    </div>
  )
}
