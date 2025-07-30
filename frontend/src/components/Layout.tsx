import { ReactNode, useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  FolderOpen,
  Calendar,
  DollarSign,
  FileText,
  Users,
  ClipboardCheck,
  Compass,
  BarChart3,
  Menu,
  X,
  LogOut,
  ChevronDown,
  UserCog
} from 'lucide-react'
import ProjectSelector from './ProjectSelector'
import { authApi } from '../services/authApi'

interface LayoutProps {
  children: ReactNode
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    // Load current user info on component mount
    const loadUser = async () => {
      try {
        const user = await authApi.getCurrentUser()
        setCurrentUser(user)
      } catch (error) {
        console.error('Failed to load user:', error)
        // If token is invalid, redirect to login
        navigate('/login')
      }
    }
    
    loadUser()
  }, [navigate])

  useEffect(() => {
    // Close user menu when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuOpen && !(event.target as Element).closest('.user-menu')) {
        setUserMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [userMenuOpen])

  const handleLogout = async () => {
    try {
      await authApi.logout()
      localStorage.removeItem('auth_token')
      navigate('/login')
    } catch (error) {
      console.error('Logout error:', error)
      // Force logout even if API call fails
      localStorage.removeItem('auth_token')
      navigate('/login')
    }
  }

  let navigation = []
  if (currentUser?.role === 'design_credential') {
    navigation = [
      { name: 'Design', href: '/design', icon: Compass },
      { name: 'Inspections', href: '/inspections', icon: ClipboardCheck },
      { name: 'Documents', href: '/documents', icon: FileText },
    ]
  } else {
    navigation = [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Projects', href: '/projects', icon: FolderOpen },
      { name: 'Schedule', href: '/schedule', icon: Calendar },
      { name: 'Financials', href: '/financials', icon: DollarSign },
      { name: 'Documents', href: '/documents', icon: FileText },
      { name: 'Field', href: '/field', icon: Users },
      { name: 'Inspections', href: '/inspections', icon: ClipboardCheck },
      { name: 'Design', href: '/design', icon: Compass },
      { name: 'Reports', href: '/reports', icon: BarChart3 },
      ...(currentUser?.role === 'admin' || currentUser?.role === 'company_admin' 
        ? [{ name: 'User Management', href: '/users', icon: UserCog }] 
        : []),
    ]
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 transform bg-white shadow-xl transition-transform duration-300 ease-in-out md:relative md:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 construction-gradient rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <span className="text-xl font-bold text-gray-900">SprinkSync</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Project Selector */}
        <div className="px-4 py-4 border-b border-gray-200">
          <ProjectSelector />
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`
                  nav-link group
                  ${isActive ? 'active' : ''}
                `}
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <div className="text-xs text-gray-500">
            SprinkSync v1.0
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 bg-white shadow-sm border-b border-gray-200 flex items-center justify-between px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900">
              {navigation.find(item => item.href === location.pathname)?.name || 'Dashboard'}
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative user-menu">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900 focus:outline-none"
              >
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-construction-gradient rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {currentUser?.first_name?.[0]}{currentUser?.last_name?.[0]}
                    </span>
                  </div>
                  <div className="hidden md:block text-left">
                    <div className="font-medium">
                      {currentUser?.first_name} {currentUser?.last_name}
                    </div>
                    <div className="text-xs text-gray-500 capitalize">
                      {currentUser?.role?.replace('_', ' ')}
                    </div>
                  </div>
                  <ChevronDown className="w-4 h-4" />
                </div>
              </button>

              {/* User Dropdown Menu */}
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  <div className="p-3 border-b border-gray-100">
                    <div className="font-medium text-gray-900">
                      {currentUser?.first_name} {currentUser?.last_name}
                    </div>
                    <div className="text-sm text-gray-500">{currentUser?.email}</div>
                    <div className="text-xs text-gray-400 capitalize">
                      {currentUser?.company_name} • {currentUser?.role?.replace('_', ' ')}
                    </div>
                  </div>
                  
                  {(currentUser?.role === 'admin' || currentUser?.role === 'company_admin') && (
                    <Link
                      to="/users"
                      className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <UserCog className="w-4 h-4" />
                      <span>User Management</span>
                    </Link>
                  )}
                  
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

export default Layout
