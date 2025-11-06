import React from 'react'
import { Navigate } from 'react-router-dom'

export default function ProtectedRoute({ children, allow }) {
  const token = localStorage.getItem('token')
  const role = localStorage.getItem('role')
  if (!token) return <Navigate to="/login" replace />
  if (allow && role !== allow) return <Navigate to={role === 'admin' ? '/admin' : '/rider'} replace />
  return children
}
