import React, { useEffect, useState } from 'react'
import { apiClient } from '../../lib/api.js'

export default function RiderProgress() {
  const api = apiClient(localStorage.getItem('token'))
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => {
    (async () => {
      try {
        const d = await api.get('/api/rider/progress')
        setData(d)
      } catch (e) {
        setError('Failed to load progress')
      }
    })()
  }, [])
  if (error) return <div className="text-red-600 text-sm">{error}</div>
  if (!data) return <div>Loading...</div>
  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded shadow">
        <div className="font-semibold mb-2">Last 30 Days</div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-gray-500 text-sm">Total Deliveries</div>
            <div className="text-2xl font-semibold">{data.summary.totalDeliveries}</div>
          </div>
          <div>
            <div className="text-gray-500 text-sm">Total Earnings</div>
            <div className="text-2xl font-semibold">₹{data.summary.totalEarnings}</div>
          </div>
        </div>
      </div>
      <div className="bg-white p-4 rounded shadow">
        <div className="font-semibold mb-3">All Progress</div>
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left bg-gray-100">
                <th className="p-2">Date</th>
                <th className="p-2">Deliveries</th>
                <th className="p-2">Hours</th>
                <th className="p-2">Earnings</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map(item => (
                <tr key={item._id} className="border-t">
                  <td className="p-2">{new Date(item.date).toLocaleDateString()}</td>
                  <td className="p-2">{item.deliveriesCompleted}</td>
                  <td className="p-2">{item.hoursWorked}</td>
                  <td className="p-2">₹{item.earnings}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
