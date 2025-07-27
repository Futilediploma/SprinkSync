import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Projects from './pages/Projects'
import Schedule from './pages/Schedule'
import Financials from './pages/Financials'
import Documents from './pages/Documents'
import Field from './pages/Field'
import Inspections from './pages/Inspections'
import Design from './pages/Design'
import Reports from './pages/Reports'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/schedule" element={<Schedule />} />
        <Route path="/financials" element={<Financials />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/field" element={<Field />} />
        <Route path="/inspections" element={<Inspections />} />
        <Route path="/design" element={<Design />} />
        <Route path="/reports" element={<Reports />} />
      </Routes>
    </Layout>
  )
}

export default App
