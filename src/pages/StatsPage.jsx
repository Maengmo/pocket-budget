import { useMemo, useState } from 'react'
import { format, subMonths } from 'date-fns'
import { ko } from 'date-fns/locale'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell,
} from 'recharts'
import { useTransactions } from '../hooks/useTransactions'
import { formatKRW } from '../lib/constants'
import { supabase } from '../lib/supabase'
import { useFamily } from '../contexts/FamilyContext'

const PIE_COLORS = [
  '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444',
  '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6B7280',
]

function MonthlyChart({ months }) {
  const data = months.map(m => ({
    name: format(m.date, 'M월'),
    수입: m.income,
    지출: m.expense,
  }))

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
        <YAxis
          tick={{ fontSize: 10, fill: '#94A3B8' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={v => formatKRW(v)}
          width={40}
        />
        <Tooltip
          formatter={(value) => formatKRW(value) + '원'}
          contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 12 }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="수입" fill="#10B981" radius={[4, 4, 0, 0]} />
        <Bar dataKey="지출" fill="#EF4444" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

function CategoryPie({ data }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  return (
    <div className="flex flex-col md:flex-row items-center gap-4">
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => formatKRW(value) + '원'}
            contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 12 }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="w-full space-y-2">
        {data.map((d, i) => (
          <div key={d.name} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
            <span className="text-xs text-slate-600 flex-1 truncate">{d.name}</span>
            <span className="text-xs font-medium text-slate-700">{Math.round((d.value / total) * 100)}%</span>
            <span className="text-xs text-slate-400">{formatKRW(d.value)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function StatsPage() {
  const today = new Date()
  const [selectedMonth, setSelectedMonth] = useState(today)

  const year = selectedMonth.getFullYear()
  const month = selectedMonth.getMonth() + 1
  const { transactions } = useTransactions(year, month)
  const { activeFamily } = useFamily()

  // 카테고리별 지출
  const categoryData = useMemo(() => {
    const map = {}
    transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const name = t.categories?.name || '미분류'
        map[name] = (map[name] || 0) + Number(t.amount)
      })
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [transactions])

  // 최근 6개월 데이터 (간단히 현재 달 포함)
  const monthlyData = useMemo(() => {
    return [{
      date: selectedMonth,
      income:  transactions.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0),
      expense: transactions.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0),
    }]
  }, [transactions, selectedMonth])

  const netBalance = monthlyData[0].income - monthlyData[0].expense

  return (
    <div className="max-w-2xl mx-auto px-3 md:px-6 pt-4 pb-6 space-y-4">
      {/* 월 선택 */}
      <div className="flex items-center justify-between bg-white rounded-2xl shadow-sm px-5 py-3">
        <button
          onClick={() => setSelectedMonth(m => subMonths(m, 1))}
          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h2 className="font-bold text-slate-800">
          {format(selectedMonth, 'yyyy년 M월', { locale: ko })}
        </h2>
        <button
          onClick={() => setSelectedMonth(m => {
            const next = new Date(m)
            next.setMonth(next.getMonth() + 1)
            return next
          })}
          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      {/* 순수익 */}
      <div className={`rounded-2xl p-5 shadow-sm ${netBalance >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
        <p className="text-xs font-medium text-slate-500 mb-1">수입 - 지출</p>
        <p className={`text-2xl font-bold ${netBalance >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
          {netBalance >= 0 ? '+' : ''}{formatKRW(netBalance)}원
        </p>
        <div className="flex gap-4 mt-2 text-xs text-slate-400">
          <span>수입 {formatKRW(monthlyData[0].income)}</span>
          <span>지출 {formatKRW(monthlyData[0].expense)}</span>
        </div>
      </div>

      {/* 월별 수입/지출 바차트 */}
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <h3 className="font-semibold text-slate-700 text-sm mb-4">수입 / 지출</h3>
        <MonthlyChart months={monthlyData} />
      </div>

      {/* 카테고리별 지출 파이차트 */}
      {categoryData.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h3 className="font-semibold text-slate-700 text-sm mb-4">카테고리별 지출</h3>
          <CategoryPie data={categoryData} />
        </div>
      )}

      {categoryData.length === 0 && (
        <div className="bg-white rounded-2xl shadow-sm py-12 text-center text-slate-300 text-sm">
          이번 달 지출 내역이 없습니다
        </div>
      )}
    </div>
  )
}
