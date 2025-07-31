import { Routes, Route, createBrowserRouter, RouterProvider } from 'react-router-dom'
import { ProjectProvider } from './contexts/ProjectContext'
import { AuthProvider } from './contexts/AuthContext'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import CompanyRegistrationPage from './pages/CompanyRegistrationPage'
import AcceptInvitationPage from './pages/AcceptInvitationPage'
import UserManagementPage from './pages/UserManagementPage'
import Dashboard from './pages/Dashboard'
import Projects from './pages/Projects'
import ProjectDetail from './pages/ProjectDetail'
import Schedule from './pages/Schedule'
import Financials from './pages/Financials'
import Documents from './pages/Documents'
import Field from './pages/Field'
import Inspections from './pages/Inspections'
import Design from './pages/Design'
import Reports from './pages/Reports'
import Simplelanding from './pages/Simplelanding'

// Create router with future flags to eliminate warnings
const router = createBrowserRouter([
  // Public routes
  { path: "/", element: <Simplelanding /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/signup", element: <SignupPage /> },
  { path: "/register-company", element: <CompanyRegistrationPage /> },
  { path: "/accept-invitation/:token", element: <AcceptInvitationPage /> },
  
  // Protected routes
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute>
        <Layout>
          <Dashboard />
        </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/projects",
    element: (
      <ProtectedRoute>
        <Layout>
          <Projects />
        </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/projects/:id",
    element: (
      <ProtectedRoute>
        <Layout>
          <ProjectDetail />
        </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/schedule",
    element: (
      <ProtectedRoute>
        <Layout>
          <Schedule />
        </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/financials",
    element: (
      <ProtectedRoute>
        <Layout>
          <Financials />
        </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/documents",
    element: (
      <ProtectedRoute>
        <Layout>
          <Documents />
        </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/field",
    element: (
      <ProtectedRoute>
        <Layout>
          <Field />
        </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/inspections",
    element: (
      <ProtectedRoute>
        <Layout>
          <Inspections />
        </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/design",
    element: (
      <ProtectedRoute>
        <Layout>
          <Design />
        </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/reports",
    element: (
      <ProtectedRoute>
        <Layout>
          <Reports />
        </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/users",
    element: (
      <ProtectedRoute>
        <Layout>
          <UserManagementPage />
        </Layout>
      </ProtectedRoute>
    ),
  },
], {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true,
  },
})

function App() {
  return (
    <AuthProvider>
      <ProjectProvider>
        <Routes>
          <Route path="/" element={<Simplelanding />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/register-company" element={<CompanyRegistrationPage />} />
          <Route path="/accept-invitation/:token" element={<AcceptInvitationPage />} />
          <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
          <Route path="/projects" element={<ProtectedRoute><Layout><Projects /></Layout></ProtectedRoute>} />
          <Route path="/projects/:id" element={<ProtectedRoute><Layout><ProjectDetail /></Layout></ProtectedRoute>} />
          <Route path="/users" element={<ProtectedRoute><Layout><UserManagementPage /></Layout></ProtectedRoute>} />
          <Route path="/schedule" element={<ProtectedRoute><Layout><Schedule /></Layout></ProtectedRoute>} />
          <Route path="/financials" element={<ProtectedRoute><Layout><Financials /></Layout></ProtectedRoute>} />
          <Route path="/documents" element={<ProtectedRoute><Layout><Documents /></Layout></ProtectedRoute>} />
          <Route path="/field" element={<ProtectedRoute><Layout><Field /></Layout></ProtectedRoute>} />
          <Route path="/inspections" element={<ProtectedRoute><Layout><Inspections /></Layout></ProtectedRoute>} />
          <Route path="/design" element={<ProtectedRoute><Layout><Design /></Layout></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute><Layout><Reports /></Layout></ProtectedRoute>} />
        </Routes>
      </ProjectProvider>
    </AuthProvider>
  )
}

export default App
