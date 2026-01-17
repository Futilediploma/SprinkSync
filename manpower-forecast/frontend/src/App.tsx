import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import ProjectsList from './pages/ProjectsList'
import ScheduleEditor from './pages/ScheduleEditor'
import ProjectForecast from './pages/ProjectForecast'
import CompanyForecast from './pages/CompanyForecast'
import CompanyGantt from './pages/CompanyGantt'
import Login from './pages/Login'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

function App() {
  const location = useLocation()
  const { user, logout, isLoading } = useAuth()

  // Show login page without nav
  if (location.pathname === '/login') {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
      </Routes>
    )
  }

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-primary-600">
                  Manpower Forecast
                </h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  to="/"
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${location.pathname === '/'
                    ? 'border-primary-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                >
                  Projects
                </Link>
                <Link
                  to="/forecasts"
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${location.pathname === '/forecasts'
                    ? 'border-primary-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                >
                  Company Forecast
                </Link>
                <Link
                  to="/gantt"
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${location.pathname === '/gantt'
                    ? 'border-primary-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                >
                  Gantt Chart
                </Link>
              </div>
            </div>
            {/* User info and logout */}
            {user && (
              <div className="flex items-center">
                <span className="text-sm text-gray-600 mr-4">{user.email}</span>
                <button
                  onClick={logout}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><ProjectsList /></ProtectedRoute>} />
          <Route path="/projects/:id/schedule" element={<ProtectedRoute><ScheduleEditor /></ProtectedRoute>} />
          <Route path="/projects/:id/forecast" element={<ProtectedRoute><ProjectForecast /></ProtectedRoute>} />
          <Route path="/forecasts" element={<ProtectedRoute><CompanyForecast /></ProtectedRoute>} />
          <Route path="/gantt" element={<ProtectedRoute><CompanyGantt /></ProtectedRoute>} />
        </Routes>
      </main>
    </div>
  )
}

export default App
