import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth.jsx'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { login } = useAuth()

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      if (!res.ok) throw new Error((await res.json()).message || 'Login failed')
      const data = await res.json()
      login(data.token, data.role)
      navigate(data.role === 'admin' ? '/admin' : '/rider', { replace: true })
    } catch (e) {
      setError(typeof e.message === 'string' ? e.message : 'Login error')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm bg-white p-6 rounded-lg shadow">
        <h1 className="text-2xl font-semibold mb-4 text-center">Rider Fleet Login</h1>
        {error ? <div className="mb-3 text-red-600 text-sm">{error}</div> : null}
        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="block text-sm mb-1">Username</label>
            <input className="w-full border rounded px-3 py-2 focus:outline-none focus:ring" value={username} onChange={(e)=>setUsername(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm mb-1">Password</label>
            <input type="password" className="w-full border rounded px-3 py-2 focus:outline-none focus:ring" value={password} onChange={(e)=>setPassword(e.target.value)} />
          </div>
          <button className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700">Login</button>
        </form>
      </div>
    </div>
  )
}
