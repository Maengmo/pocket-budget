import { NavLink } from 'react-router-dom'

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}

function ListIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  )
}

function PersonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

const NAV_ITEMS = [
  { to: '/dashboard', icon: HomeIcon, label: '홈' },
  { to: '/calendar', icon: CalendarIcon, label: '캘린더' },
  { to: '/list', icon: ListIcon, label: '내역' },
  { to: '/my', icon: PersonIcon, label: '마이' },
]

export default function BottomNav({ onAddClick }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 safe-bottom md:hidden">
      <div className="flex items-center">
        {NAV_ITEMS.slice(0, 2).map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center py-2 gap-0.5 transition-colors ${
                isActive ? 'text-blue-500' : 'text-slate-400'
              }`
            }
          >
            <Icon />
            <span className="text-[10px] font-medium">{label}</span>
          </NavLink>
        ))}

        {/* FAB */}
        <div className="flex-1 flex justify-center">
          <button
            onClick={onAddClick}
            className="w-14 h-14 -mt-5 bg-blue-500 rounded-full shadow-lg flex items-center justify-center text-white hover:bg-blue-600 active:scale-95 transition-transform"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-7 h-7">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div>

        {NAV_ITEMS.slice(2).map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center py-2 gap-0.5 transition-colors ${
                isActive ? 'text-blue-500' : 'text-slate-400'
              }`
            }
          >
            <Icon />
            <span className="text-[10px] font-medium">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
