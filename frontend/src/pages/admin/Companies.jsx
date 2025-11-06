import React, { useEffect, useState } from 'react'
import { apiClient } from '../../lib/api.js'

export default function Companies() {
  const api = apiClient(localStorage.getItem('token'))
  const [companies, setCompanies] = useState([])
  const [form, setForm] = useState({ name: '', logoUrl: '' })
  const [editing, setEditing] = useState(null)
  const [error, setError] = useState('')

  const load = async () => {
    setError('')
    try {
      const cs = await api.get('/api/admin/companies')
      setCompanies(cs)
    } catch (e) {
      setError('Failed to load companies')
    }
  }

  useEffect(() => { load() }, [])

  const submitAdd = async (e) => {
    e.preventDefault()
    try {
      await api.post('/api/admin/companies', form)
      setForm({ name: '', logoUrl: '' })
      await load()
    } catch (e) {
      setError('Failed to create company')
    }
  }

  const submitEdit = async (e) => {
    e.preventDefault()
    try {
      await api.put(`/api/admin/companies/${editing._id}`, { name: editing.name, logoUrl: editing.logoUrl })
      setEditing(null)
      await load()
    } catch (e) {
      setError('Failed to update company')
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white p-4 rounded shadow">
        <div className="font-semibold mb-3">Add Company</div>
        <form className="space-y-3" onSubmit={submitAdd}>
          <div>
            <label className="block text-sm mb-1">Name</label>
            <input className="w-full border rounded px-3 py-2" value={form.name} onChange={(e)=>setForm({...form, name: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm mb-1">Logo URL</label>
            <input className="w-full border rounded px-3 py-2" value={form.logoUrl} onChange={(e)=>setForm({...form, logoUrl: e.target.value})} />
          </div>
          <button className="bg-indigo-600 text-white px-4 py-2 rounded">Create</button>
        </form>
      </div>

      <div className="bg-white p-4 rounded shadow">
        <div className="font-semibold mb-3">Companies</div>
        {error ? <div className="text-red-600 text-sm mb-2">{error}</div> : null}
        <div className="space-y-2">
          {companies.map(c => (
            <div key={c._id} className="border rounded p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {c.logoUrl ? <img alt={c.name} src={c.logoUrl} className="w-8 h-8 object-contain" /> : <div className="w-8 h-8 bg-gray-200 rounded" />}
                <div>
                  <div className="font-medium">{c.name}</div>
                  <div className="text-xs text-gray-500">{c.logoUrl || 'No logo'}</div>
                </div>
              </div>
              <button className="text-indigo-600" onClick={()=>setEditing({ ...c })}>Edit</button>
            </div>
          ))}
        </div>
      </div>

      {editing ? (
        <div className="lg:col-span-2 bg-white p-4 rounded shadow">
          <div className="font-semibold mb-3">Edit Company</div>
          <form className="grid grid-cols-1 md:grid-cols-3 gap-3" onSubmit={submitEdit}>
            <div>
              <label className="block text-sm mb-1">Name</label>
              <input className="w-full border rounded px-3 py-2" value={editing.name} onChange={(e)=>setEditing({...editing, name: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm mb-1">Logo URL</label>
              <input className="w-full border rounded px-3 py-2" value={editing.logoUrl || ''} onChange={(e)=>setEditing({...editing, logoUrl: e.target.value})} />
            </div>
            <div className="md:col-span-3 flex gap-2">
              <button className="bg-indigo-600 text-white px-4 py-2 rounded">Save</button>
              <button type="button" className="px-4 py-2 rounded border" onClick={()=>setEditing(null)}>Cancel</button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  )
}
