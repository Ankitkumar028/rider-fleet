import React, { useEffect, useState } from 'react'
import { apiClient } from '../../lib/api.js'

export default function Profile() {
  const api = apiClient(localStorage.getItem('token'))
  const [profile, setProfile] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => {
    (async () => {
      try {
        const p = await api.get('/api/rider/me')
        setProfile(p)
      } catch (e) {
        setError('Failed to load profile')
      }
    })()
  }, [])
  if (error) return <div className="text-red-600 text-sm">{error}</div>
  if (!profile) return <div>Loading...</div>
  return (
    <div className="bg-white p-4 rounded shadow">
      <div className="font-semibold mb-4">My Profile</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
        <div>
          <div className="text-gray-500">Full Name</div>
          <div className="font-medium">{profile.fullName}</div>
        </div>
        <div>
          <div className="text-gray-500">Phone</div>
          <div className="font-medium">{profile.phone}</div>
        </div>
        <div>
          <div className="text-gray-500">Vehicle Number</div>
          <div className="font-medium">{profile.vehicleNumber}</div>
        </div>
        <div>
          <div className="text-gray-500">Status</div>
          <div className="font-medium">{profile.status}</div>
        </div>
        <div className="md:col-span-2">
          <div className="text-gray-500">Current Assignment</div>
          <div className="font-medium">{profile.currentAssignment?.name || 'Unassigned'}</div>
        </div>
      </div>
    </div>
  )
}
