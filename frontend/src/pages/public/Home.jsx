import React, { useEffect, useState } from 'react'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000'

export default function Home() {
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
    <div>
      <section className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white">
        <div className="max-w-6xl mx-auto px-4 py-16 grid md:grid-cols-2 items-center gap-8">
          <div>
            <h1 className="text-3xl md:text-5xl font-bold leading-tight">Trusted rider vendor for Blinkit, Delhivery, BigBasket and more</h1>
            <p className="mt-4 text-white/90">We recruit, manage, and track high-performance riders so enterprises can scale last-mile delivery with confidence.</p>
            <div className="mt-6 flex gap-3">
              <a href="#contact" className="bg-white text-indigo-700 font-medium px-5 py-2 rounded shadow hover:bg-white/90">Talk to us</a>
              <a href="/login" className="bg-transparent border border-white/70 text-white px-5 py-2 rounded hover:bg-white/10">Admin / Rider login</a>
            </div>
          </div>
          <div className="bg-white/10 rounded-lg p-6">
            <ul className="space-y-2 text-white/90 list-disc list-inside">
              <li>End-to-end rider lifecycle management</li>
              <li>Real-time performance tracking</li>
              <li>Compliance and onboarding at scale</li>
              <li>Flexible staffing for seasonal demand</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="text-xl font-semibold mb-4">Our delivery partners</h2>
        {partners.length === 0 ? (
          <div className="text-gray-500">Partner details coming soon.</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {partners.map(p => (
              <a key={p._id} href={p.url || '#'} target={p.url ? '_blank' : undefined} rel="noreferrer" className="flex items-center justify-center border rounded p-4 hover:shadow">
                {p.logoUrl ? (
                  <img src={p.logoUrl} alt={p.name} className="max-h-10 object-contain" />
                ) : (
                  <span className="text-gray-700 font-medium">{p.name}</span>
                )}
              </a>
            ))}
          </div>
        )}
      </section>

      <section id="contact" className="bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <h2 className="text-xl font-semibold mb-2">Work with us</h2>
          <p className="text-gray-600 mb-4">Email: vendor@techtalent-hub.example • Phone: +91-90000-00000</p>
          <p className="text-gray-500 text-sm">We’ll customize staffing and operations for your zones and SLAs.</p>
        </div>
      </section>
    </div>
  )
}
