import React, { useEffect, useState } from 'react'
import { apiClient } from '../../lib/api.js'

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')
  const api = apiClient(localStorage.getItem('token'))

  useEffect(() => {
    (async () => {
      try {
        const s = await api.get('/api/admin/stats')
        setStats(s)
      } catch (e) {
        setError('Failed to load stats')
      }
    })()
  }, [])

  if (error) return <div className="text-red-600 text-sm">{error}</div>
  if (!stats) return <div>Loading...</div>

  const maxCount = Math.max(1, ...stats.perCompany.map(x=>x.count))

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded shadow">
          <div className="text-gray-500 text-sm">Total Riders</div>
          <div className="text-2xl font-semibold">{stats.totalRiders}</div>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <div className="text-gray-500 text-sm">Active Riders</div>
          <div className="text-2xl font-semibold text-green-600">{stats.activeRiders}</div>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <div className="text-gray-500 text-sm">Inactive Riders</div>
          <div className="text-2xl font-semibold text-yellow-600">{stats.inactiveRiders}</div>
        </div>
      </div>

      <div className="bg-white p-4 rounded shadow">
        <div className="font-semibold mb-4">Riders per Company</div>
        <div className="space-y-3">
          {stats.perCompany.length === 0 ? <div className="text-sm text-gray-500">No data</div> : null}
          {stats.perCompany.map((row) => (
            <div key={row.company}>
              <div className="flex justify-between text-sm mb-1">
                <span>{row.company}</span>
                <span>{row.count}</span>
              </div>
              <div className="w-full bg-gray-200 h-3 rounded">
                <div className="bg-indigo-600 h-3 rounded" style={{ width: `${(row.count/maxCount)*100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
