import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import LandingPage from '@/pages/LandingPage'
import AuthPage from '@/pages/AuthPage'
import DashboardPage from '@/pages/DashboardPage'
import NewProjectPage from '@/pages/NewProjectPage'
import WorkspacePage from '@/pages/WorkspacePage'
import AdminPage from '@/pages/AdminPage'
import DebugPage from '@/pages/DebugPage'

import { useEffect } from 'react'

function PrivateRoute({ children }) {
  const { user, loading } = useAuthStore()
  if (loading) return null
  return user ? children : <Navigate to="/auth" replace />
}

function AdminRoute({ children }) {
  const { user, isAdmin, loading } = useAuthStore()
  if (loading) return null
  if (!user) return <Navigate to="/auth" replace />
  if (!isAdmin) return <Navigate to="/dashboard" replace />
  return children
}

/** Redirects any admin who lands on a non-/admin page straight to /admin */
function AdminRedirect() {
  const { user, isAdmin, loading } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    if (loading || !user || !isAdmin) return
    if (location.pathname.startsWith('/admin')) return
    console.log('[AdminRedirect] → /admin')
    navigate('/admin', { replace: true })
  }, [loading, user, isAdmin, location.pathname, navigate])

  return null
}

export default function App() {
  const { initialize } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  return (
    <>
      <AdminRedirect />

      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <DashboardPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/projects/new"
          element={
            <PrivateRoute>
              <NewProjectPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/workspace/:projectId"
          element={
            <PrivateRoute>
              <WorkspacePage />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminPage />
            </AdminRoute>
          }
        />
        <Route path="/admin-debug" element={<PrivateRoute><DebugPage /></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
