import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './lib/auth.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import AdminLayout from './components/AdminLayout.jsx'
import RiderLayout from './components/RiderLayout.jsx'
import Login from './pages/Login.jsx'
import AdminDashboard from './pages/admin/Dashboard.jsx'
import Riders from './pages/admin/Riders.jsx'
import Companies from './pages/admin/Companies.jsx'
import ProgressForm from './pages/admin/ProgressForm.jsx'
import Partnerships from './pages/admin/Partnerships.jsx'
import Profile from './pages/rider/Profile.jsx'
import RiderProgress from './pages/rider/Progress.jsx'

function RootRouter() {
  const role = localStorage.getItem('role')
  if (!role) return <Navigate to="/login" replace />
  return <Navigate to={role === 'admin' ? '/admin' : '/rider'} replace />
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<RootRouter />} />

        <Route
          path="/admin"
          element={
            <ProtectedRoute allow="admin">
              <AdminLayout>
                <AdminDashboard />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/riders"
          element={
            <ProtectedRoute allow="admin">
              <AdminLayout>
                <Riders />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/companies"
          element={
            <ProtectedRoute allow="admin">
              <AdminLayout>
                <Companies />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/partnerships"
          element={
            <ProtectedRoute allow="admin">
              <AdminLayout>
                <Partnerships />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/progress"
          element={
            <ProtectedRoute allow="admin">
              <AdminLayout>
                <ProgressForm />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/rider"
          element={
            <ProtectedRoute allow="rider">
              <RiderLayout>
                <Profile />
              </RiderLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/rider/progress"
          element={
            <ProtectedRoute allow="rider">
              <RiderLayout>
                <RiderProgress />
              </RiderLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </AuthProvider>
  )
}
