import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFamily } from '../../contexts/FamilyContext'
import { useAuth } from '../../contexts/AuthContext'

export default function FamilySetupPage() {
  const { signOut } = useAuth()
  const { createFamily, loadFamilies } = useFamily()
  const navigate = useNavigate()
  const [tab, setTab] = useState('create')
  const [familyName, setFamilyName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleCreate(e) {
    e.preventDefault()
    if (loading) return                          // 이중 제출 방지
    if (!familyName.trim()) { setError('패밀리 이름을 입력하세요'); return }
    setLoading(true)
    setError('')
    try {
      await createFamily(familyName.trim())
      navigate('/calendar', { replace: true })   // loadFamilies 완료 후 이동
    } catch (err) {
      setError(err.message || '패밀리 생성에 실패했습니다.')
      setLoading(false)                          // 에러일 때만 로딩 해제 (성공 시엔 페이지 전환)
    }
  }

  async function handleRefresh() {
    setLoading(true)
    try {
      await loadFamilies()
      navigate('/', { replace: true })
    } catch {
      setError('패밀리 목록을 불러올 수 없습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-500 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg shadow-blue-200">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} className="w-8 h-8">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87" />
              <path d="M16 3.13a4 4 0 010 7.75" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">패밀리 설정</h1>
          <p className="text-sm text-slate-400 mt-1">새 패밀리를 만들거나 초대를 확인하세요</p>
        </div>

        {/* 탭 */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="flex border-b border-slate-100">
            <button
              onClick={() => setTab('create')}
              className={`flex-1 py-3.5 text-sm font-semibold transition-colors ${
                tab === 'create' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-slate-400'
              }`}
            >
              새로 만들기
            </button>
            <button
              onClick={() => setTab('join')}
              className={`flex-1 py-3.5 text-sm font-semibold transition-colors ${
                tab === 'join' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-slate-400'
              }`}
            >
              초대 받기
            </button>
          </div>

          <div className="p-6">
            {tab === 'create' ? (
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">패밀리 이름</label>
                  <input
                    type="text"
                    value={familyName}
                    onChange={e => setFamilyName(e.target.value)}
                    placeholder="예: 홍길동 가족"
                    className="w-full bg-slate-50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                </div>
                {error && <p className="text-red-500 text-xs bg-red-50 rounded-xl px-3 py-2">{error}</p>}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-xl py-3.5 font-semibold text-sm transition-colors disabled:opacity-50"
                >
                  {loading ? '생성 중...' : '패밀리 만들기'}
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-slate-500 leading-relaxed">
                  초대받은 이메일로 가입하면 자동으로 패밀리에 연결됩니다.
                  아래 버튼을 눌러 패밀리 목록을 새로고침하세요.
                </p>
                {error && <p className="text-red-500 text-xs bg-red-50 rounded-xl px-3 py-2">{error}</p>}
                {success && <p className="text-emerald-600 text-xs bg-emerald-50 rounded-xl px-3 py-2">{success}</p>}
                <button
                  onClick={handleRefresh}
                  disabled={loading}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl py-3.5 font-semibold text-sm transition-colors disabled:opacity-50"
                >
                  {loading ? '확인 중...' : '패밀리 목록 새로고침'}
                </button>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={signOut}
          className="mt-4 w-full text-slate-400 text-sm py-2 hover:text-slate-600 transition-colors"
        >
          로그아웃
        </button>
      </div>
    </div>
  )
}
