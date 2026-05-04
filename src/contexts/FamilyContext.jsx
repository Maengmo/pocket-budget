import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

const FamilyContext = createContext(null)

export function FamilyProvider({ children }) {
  const { user, authReady } = useAuth()
  const [activeFamily, setActiveFamily] = useState(null)
  const [families, setFamilies] = useState([])
  const [members, setMembers] = useState([])
  const [familyReady, setFamilyReady] = useState(false)

  useEffect(() => {
    if (!authReady) return  // auth 상태 확정 전엔 아무것도 하지 않음

    if (!user) {
      // 로그아웃 상태 — 즉시 클리어하고 준비 완료
      setActiveFamily(null)
      setFamilies([])
      setMembers([])
      setFamilyReady(true)
      return
    }

    // 로그인 상태 — 패밀리 로드
    setFamilyReady(false)
    loadFamilies()
  }, [authReady, user?.id])  // eslint-disable-line react-hooks/exhaustive-deps

  async function loadFamilies() {
    try {
      const { data: memberships, error: memberErr } = await supabase
        .from('family_members')
        .select('family_id, role')
        .eq('user_id', user.id)
        .eq('status', 'accepted')

      if (memberErr) throw memberErr

      if (!memberships || memberships.length === 0) {
        setFamilies([])
        setActiveFamily(null)
        return
      }

      const familyIds = memberships.map(m => m.family_id)
      const { data: familiesData, error: familyErr } = await supabase
        .from('families')
        .select('*')
        .in('id', familyIds)

      if (familyErr) throw familyErr

      const familyList = (familiesData || []).map(f => ({
        ...f,
        role: memberships.find(m => m.family_id === f.id)?.role,
      }))
      setFamilies(familyList)

      const { data: profileData } = await supabase
        .from('users')
        .select('active_family_id')
        .eq('id', user.id)
        .single()

      const activeFamilyId = profileData?.active_family_id
      const target = familyList.find(f => f.id === activeFamilyId) ?? familyList[0]

      if (target) {
        setActiveFamily(target)
        if (target.id !== activeFamilyId) {
          await supabase
            .from('users')
            .update({ active_family_id: target.id })
            .eq('id', user.id)
        }
        await loadMembers(target.id)
      }
    } catch (err) {
      console.error('loadFamilies:', err.message)
    } finally {
      setFamilyReady(true)
    }
  }

  async function loadMembers(familyId) {
    const { data } = await supabase
      .from('family_members')
      .select('id, role, users(id, name)')
      .eq('family_id', familyId)
      .eq('status', 'accepted')
    setMembers(data || [])
  }

  async function switchFamily(familyId) {
    const family = families.find(f => f.id === familyId)
    if (!family) return
    setActiveFamily(family)
    await supabase.from('users').update({ active_family_id: familyId }).eq('id', user.id)
    await loadMembers(familyId)
  }

  async function createFamily(name) {
    const { data, error } = await supabase.rpc('create_family', { family_name: name })
    if (error) throw error
    await loadFamilies()
    return data
  }

  async function inviteMember(email) {
    const { error } = await supabase.from('invitations').insert({
      family_id: activeFamily.id,
      invited_email: email,
      invited_by: user.id,
    })
    if (error) throw error
  }

  return (
    <FamilyContext.Provider value={{
      activeFamily, families, members, familyReady,
      createFamily, switchFamily, inviteMember, loadFamilies,
    }}>
      {children}
    </FamilyContext.Provider>
  )
}

export const useFamily = () => useContext(FamilyContext)
