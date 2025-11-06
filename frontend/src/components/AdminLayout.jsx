import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth.jsx'
import Footer from './Footer.jsx'
import Logo from './Logo.jsx'

export default function AdminLayout({ children }) {
  const navigate = useNavigate()
  const { logout } = useAuth()
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-indigo-600 to-sky-500 text-white sticky top-0 z-10 shadow">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo className="w-9 h-9" />
            <div className="font-semibold">TechTalent Hub • Admin</div>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <Link to="/admin" className="opacity-90 hover:opacity-100">Dashboard</Link>
            <Link to="/admin/riders" className="opacity-90 hover:opacity-100">Riders</Link>
            <Link to="/admin/companies" className="opacity-90 hover:opacity-100">Companies</Link>
            <Link to="/admin/partnerships" className="opacity-90 hover:opacity-100">Partnerships</Link>
            <Link to="/admin/progress" className="opacity-90 hover:opacity-100">Add Progress</Link>
            <button className="bg-white/15 hover:bg-white/25 px-3 py-1 rounded" onClick={()=>{ logout(); navigate('/login') }}>Logout</button>
          </div>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 py-6">{children}</div>
      <Footer />
    </div>
  )
}
