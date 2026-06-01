import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import LandingPage from '@/pages/LandingPage'
import AuthPage from '@/pages/AuthPage'
import DashboardPage from '@/pages/DashboardPage'
import NewProjectPage from '@/pages/NewProjectPage'
import WorkspacePage from '@/pages/WorkspacePage'

import { useEffect } from 'react'

function PrivateRoute({ children }) {
  const { user, loading } = useAuthStore()

  // Wait for auth initialization to finish to avoid redirect loops
  if (loading) return null

  return user ? children : <Navigate to="/auth" replace />
}

export default function App() {
  const { initialize } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  return (
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
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

