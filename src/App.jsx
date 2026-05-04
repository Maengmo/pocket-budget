import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import { useFamily } from './contexts/FamilyContext'
import AppLayout from './components/layout/AppLayout'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import FamilySetupPage from './pages/setup/FamilySetupPage'
import DashboardPage from './pages/DashboardPage'
import CalendarPage from './pages/CalendarPage'
import ListPage from './pages/ListPage'
import StatsPage from './pages/StatsPage'
import AccountsPage from './pages/AccountsPage'
import MyPage from './pages/MyPage'

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

function ProtectedRoute({ children }) {
  const { user, authReady } = useAuth()
  if (!authReady) return <Spinner />
  if (!user) return <Navigate to="/login" replace />
  return children
}

function FamilyRoute({ children }) {
  const { activeFamily, familyReady } = useFamily()
  const { authReady } = useAuth()
  if (!authReady || !familyReady) return <Spinner />
  if (!activeFamily) return <Navigate to="/setup" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/setup"
        element={<ProtectedRoute><FamilySetupPage /></ProtectedRoute>}
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <FamilyRoute>
              <AppLayout />
            </FamilyRoute>
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/calendar" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="list" element={<ListPage />} />
        <Route path="stats" element={<StatsPage />} />
        <Route path="accounts" element={<AccountsPage />} />
        <Route path="my" element={<MyPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
