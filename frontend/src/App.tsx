import { Routes, Route } from 'react-router-dom'
import { ProjectProvider } from './contexts/ProjectContext'
import Layout from './components/Layout'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
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

function App() {
  return (
    <ProjectProvider>
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      
      {/* Protected routes with Layout */}
      <Route path="/dashboard" element={
        <Layout>
          <Dashboard />
        </Layout>
      } />
      <Route path="/projects" element={
        <Layout>
          <Projects />
        </Layout>
      } />
      <Route path="/projects/:id" element={
        <Layout>
          <ProjectDetail />
        </Layout>
      } />
      <Route path="/schedule" element={
        <Layout>
          <Schedule />
        </Layout>
      } />
      <Route path="/financials" element={
        <Layout>
          <Financials />
        </Layout>
      } />
      <Route path="/documents" element={
        <Layout>
          <Documents />
        </Layout>
      } />
      <Route path="/field" element={
        <Layout>
          <Field />
        </Layout>
      } />
      <Route path="/inspections" element={
        <Layout>
          <Inspections />
        </Layout>
      } />
      <Route path="/design" element={
        <Layout>
          <Design />
        </Layout>
      } />
      <Route path="/reports" element={
        <Layout>
          <Reports />
        </Layout>
      } />
    </Routes>
    </ProjectProvider>
  )
}

export default App
