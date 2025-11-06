import React, { useEffect, useState } from 'react'
import { apiClient } from '../../lib/api.js'

export default function ProgressForm() {
  const api = apiClient(localStorage.getItem('token'))
  const [riders, setRiders] = useState([])
  const [form, setForm] = useState({ riderId: '', date: '', deliveriesCompleted: 0, hoursWorked: 0, earnings: 0 })
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    (async () => {
      try {
        const rs = await api.get('/api/admin/riders')
        setRiders(rs)
      } catch (e) {
        setError('Failed to load riders')
      }
    })()
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    setMsg('')
    setError('')
    try {
      const payload = { ...form, deliveriesCompleted: Number(form.deliveriesCompleted||0), hoursWorked: Number(form.hoursWorked||0), earnings: Number(form.earnings||0) }
      await api.post('/api/admin/progress', payload)
      setMsg('Progress added')
      setForm({ riderId: '', date: '', deliveriesCompleted: 0, hoursWorked: 0, earnings: 0 })
    } catch (e) {
      setError('Failed to add progress')
    }
  }

  return (
    <div className="bg-white p-4 rounded shadow max-w-2xl">
      <div className="font-semibold mb-3">Add Rider Progress</div>
      {msg ? <div className="text-green-600 text-sm mb-2">{msg}</div> : null}
      {error ? <div className="text-red-600 text-sm mb-2">{error}</div> : null}
      <form className="grid grid-cols-1 md:grid-cols-2 gap-3" onSubmit={submit}>
        <div className="md:col-span-2">
          <label className="block text-sm mb-1">Rider</label>
          <select className="w-full border rounded px-3 py-2" value={form.riderId} onChange={(e)=>setForm({...form, riderId: e.target.value})}>
            <option value="">Select Rider</option>
            {riders.map(r => <option key={r._id} value={r._id}>{r.fullName} • {r.phone}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1">Date</label>
          <input type="date" className="w-full border rounded px-3 py-2" value={form.date} onChange={(e)=>setForm({...form, date: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm mb-1">Deliveries Completed</label>
          <input type="number" className="w-full border rounded px-3 py-2" value={form.deliveriesCompleted} onChange={(e)=>setForm({...form, deliveriesCompleted: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm mb-1">Hours Worked</label>
          <input type="number" className="w-full border rounded px-3 py-2" value={form.hoursWorked} onChange={(e)=>setForm({...form, hoursWorked: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm mb-1">Earnings</label>
          <input type="number" className="w-full border rounded px-3 py-2" value={form.earnings} onChange={(e)=>setForm({...form, earnings: e.target.value})} />
        </div>
        <div className="md:col-span-2">
          <button className="bg-indigo-600 text-white px-4 py-2 rounded">Add Progress</button>
        </div>
      </form>
    </div>
  )
}
