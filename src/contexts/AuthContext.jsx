import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  // undefined = 아직 모름 / null = 비로그인 / object = 로그인
  const [session, setSession] = useState(undefined)
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    // 현재 세션 1회 조회
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session ?? null)
    })

    // 이후 변경 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  // 세션 변경 시 프로필 로드
  useEffect(() => {
    if (!session?.user) { setProfile(null); return }
    supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single()
      .then(({ data }) => setProfile(data ?? null))
  }, [session?.user?.id])

  const user     = session?.user ?? null
  const authReady = session !== undefined   // getSession 완료 여부

  async function signUp(email, password, name) {
    const { data, error } = await supabase.auth.signUp({
      email, password, options: { data: { name } },
    })
    if (error) throw error
    return data
  }

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  async function updateProfile(updates) {
    const { data, error } = await supabase
      .from('users').update(updates).eq('id', user.id).select().single()
    if (error) throw error
    setProfile(data)
    return data
  }

  return (
    <AuthContext.Provider value={{ user, profile, authReady, signUp, signIn, signOut, updateProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
