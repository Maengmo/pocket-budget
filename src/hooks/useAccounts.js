import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useFamily } from '../contexts/FamilyContext'

export function useAccounts() {
  const { activeFamily } = useFamily()
  const [accounts, setAccounts] = useState([])
  const [balances, setBalances] = useState({})
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    if (!activeFamily) return
    setLoading(true)
    try {
      const [{ data: accs, error: e1 }, { data: txs, error: e2 }] = await Promise.all([
        supabase.from('accounts').select('*').eq('family_id', activeFamily.id).order('created_at'),
        supabase.from('transactions')
          .select('type, amount, account_id, to_account_id')
          .eq('family_id', activeFamily.id),
      ])
      if (e1) throw e1
      if (e2) throw e2

      const balMap = {}
      ;(accs || []).forEach(a => { balMap[a.id] = 0 })
      ;(txs || []).forEach(tx => {
        const amt = Number(tx.amount)
        if (tx.type === 'income' || tx.type === 'investment') {
          if (tx.account_id && balMap[tx.account_id] !== undefined) balMap[tx.account_id] += amt
        } else if (tx.type === 'expense') {
          if (tx.account_id && balMap[tx.account_id] !== undefined) balMap[tx.account_id] -= amt
        } else if (tx.type === 'transfer') {
          if (tx.account_id && balMap[tx.account_id] !== undefined) balMap[tx.account_id] -= amt
          if (tx.to_account_id && balMap[tx.to_account_id] !== undefined) balMap[tx.to_account_id] += amt
        }
      })

      setAccounts(accs || [])
      setBalances(balMap)
    } catch (e) {
      console.error('useAccounts:', e.message)
    } finally {
      setLoading(false)
    }
  }, [activeFamily])

  useEffect(() => { load() }, [load])

  async function addAccount(data) {
    const { error } = await supabase
      .from('accounts')
      .insert({ ...data, family_id: activeFamily.id })
    if (error) throw error
    await load()
  }

  async function deleteAccount(id) {
    const { error } = await supabase.from('accounts').delete().eq('id', id)
    if (error) throw error
    await load()
  }

  return { accounts, balances, loading, addAccount, deleteAccount, reload: load }
}
