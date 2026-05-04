import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useFamily } from '../contexts/FamilyContext'

export function useCategories() {
  const { activeFamily } = useFamily()
  const [categories, setCategories] = useState([])

  const load = useCallback(async () => {
    if (!activeFamily) return
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('family_id', activeFamily.id)
        .order('type')
        .order('name')
      if (error) throw error
      setCategories(data || [])
    } catch (e) {
      console.error('useCategories:', e.message)
    }
  }, [activeFamily])

  useEffect(() => { load() }, [load])

  async function addCategory(data) {
    const { error } = await supabase
      .from('categories')
      .insert({ ...data, family_id: activeFamily.id })
    if (error) throw error
    await load()
  }

  async function deleteCategory(id) {
    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (error) throw error
    setCategories(prev => prev.filter(c => c.id !== id))
  }

  return { categories, addCategory, deleteCategory, reload: load }
}
