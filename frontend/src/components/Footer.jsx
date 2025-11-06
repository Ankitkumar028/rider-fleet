import React, { useEffect, useState } from 'react'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000'
import Logo from './Logo.jsx'

export default function Footer() {
  const [year] = useState(new Date().getFullYear())
  const [partners, setPartners] = useState([])

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/public/partnerships`)
        if (res.ok) setPartners(await res.json())
      } catch {}
    })()
  }, [])

  return (
    <footer className="mt-10 border-t bg-white">
      <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
        <div className="flex items-center gap-3">
          <Logo className="w-10 h-10" />
          <div>
            <div className="font-semibold text-gray-900">TechTalent Hub</div>
            <div className="text-gray-500">Delivering excellence with our rider fleet</div>
          </div>
        </div>
        <div>
          <div className="font-medium mb-2">Delivery Partners</div>
          {partners.length === 0 ? (
            <div className="text-gray-500">Partner details coming soon.</div>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              {partners.map(p => (
                <a key={p._id} href={p.url || '#'} target={p.url ? '_blank' : undefined} rel="noreferrer" className="inline-flex items-center gap-2 px-3 py-1 border rounded hover:bg-gray-50">
                  {p.logoUrl ? <img src={p.logoUrl} alt={p.name} className="w-6 h-6 object-contain" /> : null}
                  <span className="text-gray-700">{p.name}</span>
                </a>
              ))}
            </div>
          )}
        </div>
        <div>
          <div className="font-medium mb-2">Follow us</div>
          <div className="flex items-center gap-4 text-gray-600">
            <a className="hover:text-indigo-600" href="https://www.linkedin.com" target="_blank" rel="noreferrer">LinkedIn</a>
            <a className="hover:text-indigo-600" href="https://twitter.com" target="_blank" rel="noreferrer">Twitter/X</a>
            <a className="hover:text-indigo-600" href="https://www.instagram.com" target="_blank" rel="noreferrer">Instagram</a>
          </div>
          <div className="text-gray-500 mt-4">© {year} TechTalent Hub. All rights reserved.</div>
        </div>
      </div>
    </footer>
  )
}
