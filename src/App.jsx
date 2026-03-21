import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Customers from './pages/Customers'
import Reminders from './pages/Reminders'
import Settings from './pages/Settings'
import Admin from './pages/Admin'
import { Flower2, RefreshCw, AlertCircle } from 'lucide-react'

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50">
      <div className="text-center">
        <Flower2 className="w-12 h-12 text-primary-500 animate-pulse mx-auto mb-4" />
        <p className="text-stone-500">Yükleniyor...</p>
      </div>
    </div>
  )
}

function ErrorScreen({ error, onRetry }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 p-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-xl font-semibold text-stone-800 mb-2">Bir Sorun Oluştu</h2>
        <p className="text-stone-500 mb-6">{error}</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={onRetry}
            className="btn btn-primary"
          >
            <RefreshCw className="w-5 h-5" />
            Tekrar Dene
          </button>
          <button
            onClick={() => window.location.href = '/login'}
            className="btn btn-secondary"
          >
            Giriş Sayfasına Git
          </button>
        </div>
      </div>
    </div>
  )
}

function ProtectedRoute({ children }) {
  const { user, loading, authError, retryAuth } = useAuth()

  if (loading) {
    return <LoadingScreen />
  }

  if (authError) {
    return <ErrorScreen error={authError} onRetry={retryAuth} />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}

function App() {
  const { user, loading, authError, retryAuth } = useAuth()

  if (loading) {
    return <LoadingScreen />
  }

  if (authError && !user) {
    return <ErrorScreen error={authError} onRetry={retryAuth} />
  }

  return (
    <Routes>
      <Route path="/login" element={
        user ? <Navigate to="/" replace /> : <Login />
      } />
      
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Dashboard />} />
        <Route path="customers" element={<Customers />} />
        <Route path="reminders" element={<Reminders />} />
        <Route path="settings" element={<Settings />} />
        <Route path="admin" element={<Admin />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
