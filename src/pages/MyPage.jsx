import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useFamily } from '../contexts/FamilyContext'
import { supabase } from '../lib/supabase'

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="px-5 py-3.5 border-b border-slate-100">
        <h3 className="font-semibold text-slate-700 text-sm">{title}</h3>
      </div>
      <div className="p-5 space-y-3">{children}</div>
    </div>
  )
}

function Field({ label, value, onSave, type = 'text', placeholder }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(value)
  const [loading, setLoading] = useState(false)

  async function handleSave() {
    setLoading(true)
    try {
      await onSave(val)
      setEditing(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <label className="block text-xs font-medium text-slate-400 mb-1.5">{label}</label>
      {editing ? (
        <div className="flex gap-2">
          <input
            type={type}
            value={val}
            onChange={e => setVal(e.target.value)}
            placeholder={placeholder}
            className="flex-1 bg-slate-50 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
          <button
            onClick={() => setEditing(false)}
            className="px-3 py-2.5 rounded-xl text-xs text-slate-500 bg-slate-100"
          >취소</button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-3 py-2.5 rounded-xl text-xs text-white bg-blue-500 disabled:opacity-50"
          >저장</button>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-700">{value || <span className="text-slate-300">미설정</span>}</span>
          <button
            onClick={() => { setVal(value); setEditing(true) }}
            className="text-xs text-blue-500 hover:text-blue-600"
          >수정</button>
        </div>
      )}
    </div>
  )
}

export default function MyPage() {
  const { user, profile, signOut, updateProfile } = useAuth()
  const { activeFamily, families, members, switchFamily, inviteMember, createFamily } = useFamily()
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteMsg, setInviteMsg] = useState('')
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' })
  const [pwLoading, setPwLoading] = useState(false)
  const [pwMsg, setPwMsg] = useState('')

  async function handleUpdateName(name) {
    await updateProfile({ name })
  }

  async function handleUpdateEmail(email) {
    const { error } = await supabase.auth.updateUser({ email })
    if (error) throw error
  }

  async function handleChangePw(e) {
    e.preventDefault()
    if (pwForm.next !== pwForm.confirm) { setPwMsg('비밀번호가 일치하지 않습니다.'); return }
    if (pwForm.next.length < 6) { setPwMsg('6자 이상 입력하세요.'); return }
    setPwLoading(true)
    setPwMsg('')
    try {
      const { error } = await supabase.auth.updateUser({ password: pwForm.next })
      if (error) throw error
      setPwMsg('비밀번호가 변경되었습니다.')
      setPwForm({ current: '', next: '', confirm: '' })
    } catch (err) {
      setPwMsg(err.message)
    } finally {
      setPwLoading(false)
    }
  }

  async function handleInvite(e) {
    e.preventDefault()
    if (!inviteEmail) return
    setInviteLoading(true)
    setInviteMsg('')
    try {
      await inviteMember(inviteEmail)
      setInviteMsg(`${inviteEmail}에게 초대를 보냈습니다.`)
      setInviteEmail('')
    } catch (err) {
      setInviteMsg(err.message)
    } finally {
      setInviteLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-3 md:px-6 pt-4 pb-6 space-y-4">
      <h2 className="text-xl font-bold text-slate-800 px-1">마이페이지</h2>

      {/* 프로필 */}
      <Section title="프로필">
        <Field
          label="이름"
          value={profile?.name || ''}
          placeholder="이름 입력"
          onSave={handleUpdateName}
        />
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">이메일</label>
          <span className="text-sm text-slate-700">{user?.email}</span>
        </div>
      </Section>

      {/* 비밀번호 변경 */}
      <Section title="비밀번호 변경">
        <form onSubmit={handleChangePw} className="space-y-3">
          <input
            type="password"
            value={pwForm.next}
            onChange={e => setPwForm(p => ({ ...p, next: e.target.value }))}
            placeholder="새 비밀번호 (6자 이상)"
            className="w-full bg-slate-50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
          <input
            type="password"
            value={pwForm.confirm}
            onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))}
            placeholder="새 비밀번호 확인"
            className="w-full bg-slate-50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
          {pwMsg && (
            <p className={`text-xs px-3 py-2 rounded-xl ${
              pwMsg.includes('변경') ? 'text-emerald-600 bg-emerald-50' : 'text-red-500 bg-red-50'
            }`}>{pwMsg}</p>
          )}
          <button
            type="submit"
            disabled={pwLoading}
            className="w-full bg-slate-700 hover:bg-slate-800 text-white rounded-xl py-3 text-sm font-medium disabled:opacity-50"
          >
            {pwLoading ? '변경 중...' : '비밀번호 변경'}
          </button>
        </form>
      </Section>

      {/* 패밀리 */}
      {activeFamily && (
        <Section title="패밀리">
          {/* 현재 패밀리 */}
          <div className="bg-blue-50 rounded-xl px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-sm font-semibold text-blue-700">{activeFamily.name}</span>
              <span className="text-xs text-blue-400 ml-auto">현재 활성</span>
            </div>
          </div>

          {/* 다른 패밀리 전환 */}
          {families.filter(f => f.id !== activeFamily.id).map(f => (
            <div key={f.id} className="flex items-center justify-between px-4 py-2.5 bg-slate-50 rounded-xl">
              <span className="text-sm text-slate-600">{f.name}</span>
              <button
                onClick={() => switchFamily(f.id)}
                className="text-xs text-blue-500 hover:text-blue-600 font-medium"
              >전환</button>
            </div>
          ))}

          {/* 멤버 목록 */}
          <div>
            <p className="text-xs font-medium text-slate-400 mb-2">멤버</p>
            <div className="space-y-2">
              {members.map(m => (
                <div key={m.id} className="flex items-center justify-between">
                  <span className="text-sm text-slate-700">{m.users?.name || '(이름 없음)'}</span>
                  <span className="text-xs text-slate-400 capitalize">{m.role}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 멤버 초대 */}
          {(activeFamily.role === 'owner' || activeFamily.role === 'admin') && (
            <div>
              <p className="text-xs font-medium text-slate-400 mb-2">멤버 초대</p>
              <form onSubmit={handleInvite} className="flex gap-2">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  placeholder="이메일 주소"
                  className="flex-1 bg-slate-50 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
                <button
                  type="submit"
                  disabled={inviteLoading}
                  className="px-4 py-2.5 bg-blue-500 text-white rounded-xl text-sm font-medium disabled:opacity-50 flex-shrink-0"
                >
                  {inviteLoading ? '...' : '초대'}
                </button>
              </form>
              {inviteMsg && (
                <p className={`text-xs mt-2 ${inviteMsg.includes('보냈') ? 'text-emerald-600' : 'text-red-500'}`}>
                  {inviteMsg}
                </p>
              )}
            </div>
          )}
        </Section>
      )}

      {/* 로그아웃 */}
      <button
        onClick={signOut}
        className="w-full py-4 rounded-2xl text-sm font-medium text-red-500 bg-red-50 hover:bg-red-100 transition-colors"
      >
        로그아웃
      </button>
    </div>
  )
}
