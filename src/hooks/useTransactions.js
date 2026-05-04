import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useFamily } from '../contexts/FamilyContext'

export function useTransactions(year, month) {
  const { user } = useAuth()
  const { activeFamily } = useFamily()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    if (!activeFamily) return
    setLoading(true)
    setError(null)
    try {
      const y = String(year)
      const m = String(month).padStart(2, '0')

      // accounts FK가 두 개라 to_account_id는 별도 쿼리로 처리
      const { data, error: err } = await supabase
        .from('transactions')
        .select(`
          id, type, amount, date, memo, created_at,
          account_id, to_account_id, category_id, user_id,
          categories(id, name, type),
          accounts!account_id(id, name),
          author:users(id, name)
        `)
        .eq('family_id', activeFamily.id)
        .gte('date', `${y}-${m}-01`)
        .lte('date', `${y}-${m}-31`)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })

      if (err) throw err
      setTransactions(data || [])
    } catch (e) {
      console.error('useTransactions:', e.message)
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [activeFamily, year, month])

  useEffect(() => { load() }, [load])

  async function addTransaction(tx) {
    const { error } = await supabase
      .from('transactions')
      .insert({ ...tx, family_id: activeFamily.id, user_id: user.id })
    if (error) throw error
    await load()
  }

  async function updateTransaction(id, tx) {
    const { error } = await supabase.from('transactions').update(tx).eq('id', id)
    if (error) throw error
    await load()
  }

  async function deleteTransaction(id) {
    const { error } = await supabase.from('transactions').delete().eq('id', id)
    if (error) throw error
    await load()
  }

  return { transactions, loading, error, addTransaction, updateTransaction, deleteTransaction, reload: load }
}
