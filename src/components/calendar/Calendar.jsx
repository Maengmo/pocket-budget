import { useMemo, useState } from 'react'
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isToday, isSameDay,
  format, addMonths, subMonths,
} from 'date-fns'
import { ko } from 'date-fns/locale'
import { formatKRW } from '../../lib/constants'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

export default function Calendar({ transactions, onDayClick, selectedDate, currentMonth, onMonthChange }) {
  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 0 })
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 0 })
    return eachDayOfInterval({ start, end })
  }, [currentMonth])

  const txByDate = useMemo(() => {
    const map = {}
    ;(transactions || []).forEach(tx => {
      const key = tx.date
      if (!map[key]) map[key] = []
      map[key].push(tx)
    })
    return map
  }, [transactions])

  function getDayData(date) {
    const key = format(date, 'yyyy-MM-dd')
    const txs = txByDate[key] || []
    const income = txs
      .filter(t => t.type === 'income')
      .reduce((s, t) => s + Number(t.amount), 0)
    const expense = txs
      .filter(t => t.type === 'expense')
      .reduce((s, t) => s + Number(t.amount), 0)
    return { income, expense, count: txs.length }
  }

  const monthIncome = useMemo(() =>
    (transactions || []).filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0),
    [transactions]
  )
  const monthExpense = useMemo(() =>
    (transactions || []).filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0),
    [transactions]
  )

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      {/* 월 네비게이션 */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <button
          onClick={() => onMonthChange(subMonths(currentMonth, 1))}
          className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100 active:bg-slate-200 transition-colors text-slate-500"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <div className="text-center">
          <h2 className="text-base font-bold text-slate-800">
            {format(currentMonth, 'yyyy년 M월', { locale: ko })}
          </h2>
          <div className="flex gap-3 mt-0.5 justify-center text-xs">
            <span className="text-emerald-600 font-medium">+{formatKRW(monthIncome)}</span>
            <span className="text-red-500 font-medium">-{formatKRW(monthExpense)}</span>
          </div>
        </div>

        <button
          onClick={() => onMonthChange(addMonths(currentMonth, 1))}
          className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100 active:bg-slate-200 transition-colors text-slate-500"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 bg-slate-50">
        {WEEKDAYS.map((d, i) => (
          <div
            key={d}
            className={`text-center text-xs py-2 font-semibold ${
              i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-slate-400'
            }`}
          >
            {d}
          </div>
        ))}
      </div>

      {/* 날짜 그리드 */}
      <div className="grid grid-cols-7 border-t border-slate-100">
        {days.map(day => {
          const { income, expense } = getDayData(day)
          const inCurrentMonth = isSameMonth(day, currentMonth)
          const todayDay = isToday(day)
          const isSelected = selectedDate && isSameDay(day, selectedDate)
          const dow = day.getDay()
          const hasData = inCurrentMonth && (income > 0 || expense > 0)

          return (
            <button
              key={day.toISOString()}
              onClick={() => onDayClick(day)}
              className={`
                relative min-h-[64px] md:min-h-[80px] p-1 border-b border-r border-slate-100
                text-left transition-colors
                ${isSelected ? 'bg-blue-50' : 'hover:bg-slate-50 active:bg-slate-100'}
                ${!inCurrentMonth ? 'opacity-25 pointer-events-none' : ''}
              `}
            >
              {/* 날짜 숫자 */}
              <span
                className={`
                  inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-medium
                  ${todayDay ? 'bg-blue-500 text-white' : ''}
                  ${!todayDay && dow === 0 ? 'text-red-500' : ''}
                  ${!todayDay && dow === 6 ? 'text-blue-500' : ''}
                  ${!todayDay && dow !== 0 && dow !== 6 ? 'text-slate-700' : ''}
                `}
              >
                {format(day, 'd')}
              </span>

              {/* 수입/지출 금액 */}
              {hasData && (
                <div className="mt-0.5 space-y-0.5">
                  {income > 0 && (
                    <div className="text-[10px] md:text-xs leading-tight text-emerald-600 font-medium truncate px-0.5">
                      +{formatKRW(income)}
                    </div>
                  )}
                  {expense > 0 && (
                    <div className="text-[10px] md:text-xs leading-tight text-red-500 font-medium truncate px-0.5">
                      -{formatKRW(expense)}
                    </div>
                  )}
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
