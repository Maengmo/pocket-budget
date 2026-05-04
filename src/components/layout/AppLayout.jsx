import { useState } from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import BottomNav from './BottomNav'
import TransactionForm from '../transactions/TransactionForm'
import { useFamily } from '../../contexts/FamilyContext'

function SideNavLink({ to, icon: Icon, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm font-medium ${
          isActive
            ? 'bg-blue-50 text-blue-600'
            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
        }`
      }
    >
      <Icon />
      {label}
    </NavLink>
  )
}

function HomeIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
}
function CalIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
}
function ListIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>
}
function ChartIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /><line x1="2" y1="20" x2="22" y2="20" /></svg>
}
function WalletIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 6h18M3 14h18M3 18h18" /><rect x="1" y="4" width="22" height="16" rx="2" /></svg>
}
function PersonIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
}

const SIDE_NAV = [
  { to: '/dashboard', icon: HomeIcon, label: '대시보드' },
  { to: '/calendar', icon: CalIcon, label: '캘린더' },
  { to: '/list', icon: ListIcon, label: '거래 내역' },
  { to: '/stats', icon: ChartIcon, label: '통계' },
  { to: '/accounts', icon: WalletIcon, label: '계좌 관리' },
  { to: '/my', icon: PersonIcon, label: '마이페이지' },
]

export default function AppLayout() {
  const [showForm, setShowForm] = useState(false)
  const { activeFamily } = useFamily()

  return (
    <div className="min-h-screen flex">
      {/* 데스크탑 사이드바 */}
      <aside className="hidden md:flex flex-col w-56 bg-white border-r border-slate-200 fixed top-0 left-0 h-full z-30">
        <div className="p-5 border-b border-slate-100">
          <h1 className="text-lg font-bold text-blue-600">Pocket Budget</h1>
          {activeFamily && (
            <p className="text-xs text-slate-400 mt-0.5 truncate">{activeFamily.name}</p>
          )}
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {SIDE_NAV.map(item => (
            <SideNavLink key={item.to} {...item} />
          ))}
        </nav>
        <div className="p-3">
          <button
            onClick={() => setShowForm(true)}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-xl py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            거래 추가
          </button>
        </div>
      </aside>

      {/* 메인 콘텐츠 */}
      <main className="flex-1 md:ml-56 pb-20 md:pb-0 min-h-screen">
        <Outlet />
      </main>

      {/* 모바일 하단 네비게이션 */}
      <BottomNav onAddClick={() => setShowForm(true)} />

      {/* 거래 추가 모달 */}
      {showForm && (
        <TransactionForm
          open={showForm}
          onClose={() => setShowForm(false)}
          onSuccess={() => setShowForm(false)}
        />
      )}
    </div>
  )
}
