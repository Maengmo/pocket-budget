import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

export default function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await signIn(email, password)
      navigate('/', { replace: true })
    } catch (err) {
      if (err.message?.includes('email_not_confirmed') || err.code === 'email_not_confirmed') {
        setError('이메일 인증이 필요합니다. Supabase 대시보드에서 이메일 인증을 끄거나, 가입 이메일을 확인해주세요.')
      } else if (err.message?.includes('Invalid login credentials')) {
        setError('이메일 또는 비밀번호가 올바르지 않습니다.')
      } else {
        setError(err.message || '로그인에 실패했습니다.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* 로고 */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-500 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg shadow-blue-200">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} className="w-8 h-8">
              <rect x="2" y="7" width="20" height="14" rx="2" />
              <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
              <line x1="12" y1="12" x2="12" y2="16" />
              <line x1="10" y1="14" x2="14" y2="14" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Pocket Budget</h1>
          <p className="text-sm text-slate-400 mt-1">가족 가계부</p>
        </div>

        {/* 폼 */}
        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">이메일</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="email@example.com"
                required
                className="w-full bg-slate-50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">비밀번호</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-slate-50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>

            {error && (
              <p className="text-red-500 text-xs bg-red-50 rounded-xl px-3 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-xl py-3.5 font-semibold text-sm transition-colors disabled:opacity-50 mt-2"
            >
              {loading ? '로그인 중...' : '로그인'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-400 mt-5">
          계정이 없으신가요?{' '}
          <Link to="/register" className="text-blue-500 font-medium">
            회원가입
          </Link>
        </p>
      </div>
    </div>
  )
}
