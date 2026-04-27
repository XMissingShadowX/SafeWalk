'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function AdminPage() {
  const [incidents, setIncidents] = useState([])
  const [isAdmin, setIsAdmin] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    // Verificar si el usuario es admin
    supabase.rpc('is_admin', { uid: (await supabase.auth.getUser()).data.user?.id })
      .then(({ data }) => setIsAdmin(data))

    // Cargar todos los incidentes (incluyendo inactivos para moderar)
    supabase.from('incidents').select('*, profiles(full_name)')
      .order('reported_at', { ascending: false })
      .then(({ data }) => setIncidents(data ?? []))
  }, [])

  const deactivate = async (id: string) => {
    await supabase.from('incidents').update({ is_active: false }).eq('id', id)
    setIncidents(prev => prev.filter(i => i.id !== id))
  }

  const verify = async (id: string) => {
    await supabase.from('incidents').update({ is_verified: true }).eq('id', id)
  }

  if (!isAdmin) return <p className="p-8 text-center">Acceso restringido</p>

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold mb-4">Panel de Moderación</h1>
      {incidents.map(inc => (
        <div key={inc.id} className="border rounded-lg p-4 mb-3 flex justify-between items-start">
          <div>
            <p className="font-medium">{inc.title}</p>
            <p className="text-sm text-muted-foreground">{inc.incident_type} · {inc.severity}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(inc.reported_at).toLocaleString()} · {inc.profiles?.full_name ?? 'Anónimo'}
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => verify(inc.id)} className="text-xs px-2 py-1 bg-green-600 text-white rounded">✓ Verificar</button>
            <button onClick={() => deactivate(inc.id)} className="text-xs px-2 py-1 bg-red-600 text-white rounded">✕ Eliminar</button>
          </div>
        </div>
      ))}
    </div>
  )
}