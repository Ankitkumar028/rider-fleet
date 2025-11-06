import React, { useEffect, useState } from 'react'
import { apiClient } from '../../lib/api.js'

export default function Riders() {
  const api = apiClient(localStorage.getItem('token'))
  const [riders, setRiders] = useState([])
  const [companies, setCompanies] = useState([])
  const [error, setError] = useState('')
  const [form, setForm] = useState({ username: '', defaultPassword: 'rider123', fullName: '', phone: '', vehicleNumber: '', status: 'Inactive', currentAssignment: '' })
  const [editing, setEditing] = useState(null)

  const load = async () => {
    setError('')
    try {
      const [rs, cs] = await Promise.all([
        api.get('/api/admin/riders'),
        api.get('/api/admin/companies'),
      ])
      setRiders(rs)
      setCompanies(cs)
    } catch (e) {
      setError('Failed to load riders or companies')
    }
  }

  useEffect(() => { load() }, [])

  const exportCsv = async () => {
    try {
      const blob = await api.getBlob('/api/admin/riders/export')
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'riders.csv'
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (e) {
      setError('Failed to export CSV')
    }
  }

  const submitAdd = async (e) => {
    e.preventDefault()
    try {
      const payload = { ...form, currentAssignment: form.currentAssignment || null }
      await api.post('/api/admin/riders', payload)
      setForm({ username: '', defaultPassword: 'rider123', fullName: '', phone: '', vehicleNumber: '', status: 'Inactive', currentAssignment: '' })
      await load()
    } catch (e) {
      setError('Failed to create rider')
    }
  }

  const submitEdit = async (e) => {
    e.preventDefault()
    try {
      const payload = { fullName: editing.fullName, phone: editing.phone, vehicleNumber: editing.vehicleNumber, status: editing.status, currentAssignment: editing.currentAssignment?._id || editing.currentAssignment || null }
      await api.put(`/api/admin/riders/${editing._id}`, payload)
      setEditing(null)
      await load()
    } catch (e) {
      setError('Failed to update rider')
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white p-4 rounded shadow">
        <div className="font-semibold mb-3">Add New Rider</div>
        <form className="space-y-3" onSubmit={submitAdd}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm mb-1">Username</label>
              <input className="w-full border rounded px-3 py-2" value={form.username} onChange={(e)=>setForm({...form, username: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm mb-1">Default Password</label>
              <input className="w-full border rounded px-3 py-2" value={form.defaultPassword} onChange={(e)=>setForm({...form, defaultPassword: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm mb-1">Full Name</label>
              <input className="w-full border rounded px-3 py-2" value={form.fullName} onChange={(e)=>setForm({...form, fullName: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm mb-1">Phone</label>
              <input className="w-full border rounded px-3 py-2" value={form.phone} onChange={(e)=>setForm({...form, phone: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm mb-1">Vehicle Number</label>
              <input className="w-full border rounded px-3 py-2" value={form.vehicleNumber} onChange={(e)=>setForm({...form, vehicleNumber: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm mb-1">Status</label>
              <select className="w-full border rounded px-3 py-2" value={form.status} onChange={(e)=>setForm({...form, status: e.target.value})}>
                <option>Inactive</option>
                <option>Active</option>
                <option>On Leave</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm mb-1">Current Assignment</label>
              <select className="w-full border rounded px-3 py-2" value={form.currentAssignment} onChange={(e)=>setForm({...form, currentAssignment: e.target.value})}>
                <option value="">Unassigned</option>
                {companies.map(c=> (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
          <button className="bg-indigo-600 text-white px-4 py-2 rounded">Create Rider</button>
        </form>
      </div>

      <div className="bg-white p-4 rounded shadow">
        <div className="flex items-center justify-between mb-3">
          <div className="font-semibold">Riders</div>
          <button onClick={exportCsv} className="px-3 py-2 text-sm bg-emerald-600 text-white rounded hover:bg-emerald-700">Export CSV</button>
        </div>
        {error ? <div className="text-red-600 text-sm mb-2">{error}</div> : null}
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left bg-gray-100">
                <th className="p-2">Name</th>
                <th className="p-2">Phone</th>
                <th className="p-2">Status</th>
                <th className="p-2">Company</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {riders.map(r => (
                <tr key={r._id} className="border-t">
                  <td className="p-2">{r.fullName}</td>
                  <td className="p-2">{r.phone}</td>
                  <td className="p-2">{r.status}</td>
                  <td className="p-2">{r.currentAssignment?.name || 'Unassigned'}</td>
                  <td className="p-2">
                    <button className="text-indigo-600" onClick={()=> setEditing({ ...r })}>Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editing ? (
        <div className="lg:col-span-2 bg-white p-4 rounded shadow">
          <div className="font-semibold mb-3">Edit Rider</div>
          <form className="grid grid-cols-1 md:grid-cols-3 gap-3" onSubmit={submitEdit}>
            <div>
              <label className="block text-sm mb-1">Full Name</label>
              <input className="w-full border rounded px-3 py-2" value={editing.fullName} onChange={(e)=>setEditing({...editing, fullName: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm mb-1">Phone</label>
              <input className="w-full border rounded px-3 py-2" value={editing.phone} onChange={(e)=>setEditing({...editing, phone: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm mb-1">Vehicle Number</label>
              <input className="w-full border rounded px-3 py-2" value={editing.vehicleNumber} onChange={(e)=>setEditing({...editing, vehicleNumber: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm mb-1">Status</label>
              <select className="w-full border rounded px-3 py-2" value={editing.status} onChange={(e)=>setEditing({...editing, status: e.target.value})}>
                <option>Inactive</option>
                <option>Active</option>
                <option>On Leave</option>
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1">Current Assignment</label>
              <select className="w-full border rounded px-3 py-2" value={editing.currentAssignment?._id || editing.currentAssignment || ''} onChange={(e)=>setEditing({...editing, currentAssignment: e.target.value})}>
                <option value="">Unassigned</option>
                {companies.map(c=> (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
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
