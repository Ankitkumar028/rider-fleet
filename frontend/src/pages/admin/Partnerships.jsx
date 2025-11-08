import React, { useEffect, useState } from 'react'
import { apiClient } from '../../lib/api.js'

export default function Partnerships() {
  const api = apiClient(localStorage.getItem('token'))
  const [items, setItems] = useState([])
  const [form, setForm] = useState({ name: '', url: '', logoUrl: '', visible: true, order: 0 })
  const [error, setError] = useState('')

  const load = async () => {
    setError('')
    try {
      const ps = await api.get('/api/admin/partnerships')
      setItems(ps)
    } catch (e) {
      setError('Failed to load partnerships')
    }
  }

  useEffect(() => { load() }, [])

  const add = async (e) => {
    e.preventDefault()
    try {
      await api.post('/api/admin/partnerships', form)
      setForm({ name: '', url: '', logoUrl: '', visible: true, order: 0 })
      await load()
    } catch (e) {
      setError('Failed to create partnership')
    }
  }

  const remove = async (id) => {
    try {
      await api.delete(`/api/admin/partnerships/${id}`)
      await load()
    } catch (e) {
      setError('Failed to delete partnership')
    }
  }

  const toggleVisible = async (p) => {
    try {
      await api.put(`/api/admin/partnerships/${p._id}`, { visible: !p.visible })
      await load()
    } catch {
      setError('Failed to update visibility')
    }
  }

  const changeOrder = async (p, delta) => {
    try {
      const newOrder = (p.order || 0) + delta
      await api.put(`/api/admin/partnerships/${p._id}`, { order: newOrder })
      await load()
    } catch {
      setError('Failed to update order')
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white p-4 rounded shadow">
        <div className="font-semibold mb-3">Add Partnership</div>
        <form className="space-y-3" onSubmit={add}>
          <div>
            <label className="block text-sm mb-1">Name</label>
            <input className="w-full border rounded px-3 py-2" value={form.name} onChange={(e)=>setForm({...form, name: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm mb-1">Website URL</label>
            <input className="w-full border rounded px-3 py-2" value={form.url} onChange={(e)=>setForm({...form, url: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm mb-1">Logo URL</label>
            <input className="w-full border rounded px-3 py-2" value={form.logoUrl} onChange={(e)=>setForm({...form, logoUrl: e.target.value})} />
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.visible} onChange={(e)=>setForm({...form, visible: e.target.checked})} /> Visible</label>
            <div>
              <label className="block text-sm mb-1">Order</label>
              <input type="number" className="w-24 border rounded px-3 py-2" value={form.order} onChange={(e)=>setForm({...form, order: Number(e.target.value)})} />
            </div>
          </div>
          <button className="bg-indigo-600 text-white px-4 py-2 rounded">Add</button>
        </form>
      </div>

      <div className="bg-white p-4 rounded shadow">
        <div className="font-semibold mb-3">Current Partnerships</div>
        {error ? <div className="text-red-600 text-sm mb-2">{error}</div> : null}
        <div className="space-y-2">
          {items.map(p => (
            <div key={p._id} className="border rounded p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {p.logoUrl ? <img src={p.logoUrl} alt={p.name} className="w-8 h-8 object-contain" /> : <div className="w-8 h-8 bg-gray-200 rounded" />}
                <div>
                  <div className="font-medium">{p.name}</div>
                  <a href={p.url} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 hover:underline">{p.url || 'No URL'}</a>
                  <div className="text-xs text-gray-500">Visible: {p.visible ? 'Yes' : 'No'} • Order: {p.order ?? 0}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button className="text-sm px-2 py-1 border rounded" onClick={()=>changeOrder(p, -1)}>Up</button>
                <button className="text-sm px-2 py-1 border rounded" onClick={()=>changeOrder(p, +1)}>Down</button>
                <button className="text-sm px-2 py-1 border rounded" onClick={()=>toggleVisible(p)}>{p.visible ? 'Hide' : 'Show'}</button>
                <button className="text-red-600" onClick={()=>remove(p._id)}>Remove</button>
              </div>
            </div>
          ))}
          {items.length === 0 ? <div className="text-sm text-gray-500">No partnerships yet.</div> : null}
        </div>
      </div>
    </div>
  )
}
