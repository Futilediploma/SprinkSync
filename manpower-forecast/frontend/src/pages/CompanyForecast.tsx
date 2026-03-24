import { useState, useEffect } from 'react'
import { forecastsApi, projectsApi, exportApi } from '../api'
import type { Project } from '../types'
import { format, addMonths } from 'date-fns'

export default function CompanyForecast() {
  const [projects, setProjects] = useState<Project[]>([])

  // Filters
  const [startDate, setStartDate] = useState(() => format(new Date(), 'yyyy-MM-dd'))
  const [endDate, setEndDate] = useState(() => format(addMonths(new Date(), 3), 'yyyy-MM-dd'))
  const [selectedProjects, setSelectedProjects] = useState<number[]>([])
  const [selectedSubcontractors, setSelectedSubcontractors] = useState<string[]>([])
  const [granularity, setGranularity] = useState<'weekly' | 'monthly'>('weekly')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [awsFilter, setAwsFilter] = useState<'all' | 'aws' | 'standard'>('all')

  const uniqueSubcontractors = [...new Set(
    projects.flatMap(p => p.subcontractors?.map(s => s.subcontractor_name) || [])
  )].sort()

  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    try {
      const projectsRes = await projectsApi.list()
      const fetchedProjects = projectsRes.data.filter(p =>
        ['active', 'prospective'].includes(p.status)
      )
      setProjects(fetchedProjects)

      if (fetchedProjects.length > 0) {
        let minDate = ''
        let maxDate = ''
        fetchedProjects.forEach(p => {
          if (p.start_date && (!minDate || p.start_date < minDate)) minDate = p.start_date
          if (p.end_date && (!maxDate || p.end_date > maxDate)) maxDate = p.end_date
        })
        if (minDate) setStartDate(minDate)
        if (maxDate) setEndDate(maxDate)
      }
    } catch (error) {
      console.error('Failed to load data:', error)
    }
  }

  const getEffectiveProjectIds = () => {
    if (selectedProjects.length > 0) return selectedProjects
    return projects
      .filter(p => {
        if (awsFilter === 'aws' && !p.is_aws) return false
        if (awsFilter === 'standard' && p.is_aws) return false
        if (typeFilter === 'mechanical' && !p.is_mechanical) return false
        if (typeFilter === 'electrical' && !p.is_electrical) return false
        if (typeFilter === 'vesda' && !p.is_vesda) return false
        if (typeFilter === 'both' && (!p.is_mechanical || !p.is_electrical)) return false
        if (selectedSubcontractors.length > 0) {
          const projectSubs = p.subcontractors?.map(s => s.subcontractor_name) || []
          if (!selectedSubcontractors.some(sub => projectSubs.includes(sub))) return false
        }
        return true
      })
      .map(p => p.id)
  }

  const handleExportCsv = async (exportType: 'forecast' | 'projects') => {
    try {
      const effectiveProjectIds = getEffectiveProjectIds()
      const response = await forecastsApi.exportCsv({
        start_date: startDate,
        end_date: endDate,
        project_ids: effectiveProjectIds.length > 0 ? effectiveProjectIds : undefined,
        subcontractor_names: selectedSubcontractors.length > 0 ? selectedSubcontractors : undefined,
        granularity
      }, exportType)
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `forecast_${exportType}_${new Date().getTime()}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      console.error('Failed to export CSV:', error)
      alert('Failed to export CSV')
    }
  }

  const handleExportPdf = async () => {
    try {
      const hasProjectFilters = selectedProjects.length > 0 || awsFilter !== 'all' || typeFilter !== 'all'
      const effectiveProjectIds = hasProjectFilters ? getEffectiveProjectIds() : []
      const response = await exportApi.pdf({
        start_date: startDate,
        end_date: endDate,
        project_ids: effectiveProjectIds.length > 0 ? effectiveProjectIds : undefined,
        subcontractor_names: selectedSubcontractors.length > 0 ? selectedSubcontractors : undefined,
      })
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
      const link = document.createElement('a')
      link.href = url
      const filename = selectedSubcontractors.length > 0
        ? `BFPE_Manpower_Forecast_(${selectedSubcontractors.join('_').replace(/ /g, '_')}).pdf`
        : 'BFPE_Manpower_Forecast.pdf'
      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      console.error('Failed to export PDF:', error)
      alert('Failed to export PDF')
    }
  }

  const toggleProject = (projectId: number) => {
    setSelectedProjects(prev =>
      prev.includes(projectId) ? prev.filter(id => id !== projectId) : [...prev, projectId]
    )
  }

  const toggleSubcontractor = (subName: string) => {
    setSelectedSubcontractors(prev =>
      prev.includes(subName) ? prev.filter(name => name !== subName) : [...prev, subName]
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          {awsFilter === 'all' ? 'All Company Reports' : awsFilter === 'aws' ? 'AWS Projects Reports' : 'Company Reports'}
        </h2>
        <div className="flex space-x-1 mt-2">
          <button onClick={() => setAwsFilter('all')} className={`text-xs px-2 py-1 rounded ${awsFilter === 'all' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>All</button>
          <button onClick={() => setAwsFilter('standard')} className={`text-xs px-2 py-1 rounded ${awsFilter === 'standard' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>Standard</button>
          <button onClick={() => setAwsFilter('aws')} className={`text-xs px-2 py-1 rounded ${awsFilter === 'aws' ? 'bg-purple-600 text-white' : 'text-purple-600 hover:bg-purple-50'}`}>AWS Projects</button>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <h3 className="text-lg font-bold mb-4">Filters</h3>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="input" />
          </div>
        </div>

        <div className="flex bg-gray-100 rounded-lg p-1 mb-4 w-fit">
          {['all', 'mechanical', 'electrical', 'vesda', 'both'].map((type) => (
            <button
              key={type}
              onClick={() => { setTypeFilter(type); setSelectedProjects([]) }}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${typeFilter === type ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex justify-between items-end mb-2">
              <label className="block text-sm font-medium text-gray-700">Projects ({selectedProjects.length > 0 ? selectedProjects.length : 'All'})</label>
              <div className="space-x-2 text-xs">
                <button onClick={() => setSelectedProjects(projects.map(p => p.id))} className="text-primary-600 hover:text-primary-800">Select All</button>
                <button onClick={() => setSelectedProjects([])} className="text-gray-500 hover:text-gray-700">Clear</button>
              </div>
            </div>
            <div className="space-y-1 max-h-40 overflow-y-auto border border-gray-200 rounded p-2">
              {projects
                .filter(p => {
                  if (awsFilter === 'aws' && !p.is_aws) return false
                  if (awsFilter === 'standard' && p.is_aws) return false
                  if (typeFilter === 'mechanical') return p.is_mechanical
                  if (typeFilter === 'electrical') return p.is_electrical
                  if (typeFilter === 'vesda') return p.is_vesda
                  if (typeFilter === 'both') return p.is_mechanical && p.is_electrical
                  return true
                })
                .map((project) => (
                  <label key={project.id} className="flex items-center space-x-2 text-sm">
                    <input type="checkbox" checked={selectedProjects.includes(project.id)} onChange={() => toggleProject(project.id)} className="rounded" />
                    <span>{project.name}</span>
                  </label>
                ))}
            </div>
          </div>

          <div>
            <div className="flex justify-between items-end mb-2">
              <label className="block text-sm font-medium text-gray-700">Subcontractors ({selectedSubcontractors.length > 0 ? selectedSubcontractors.length : 'All'})</label>
              <div className="space-x-2 text-xs">
                <button onClick={() => setSelectedSubcontractors([...uniqueSubcontractors])} className="text-primary-600 hover:text-primary-800">Select All</button>
                <button onClick={() => setSelectedSubcontractors([])} className="text-gray-500 hover:text-gray-700">Clear</button>
              </div>
            </div>
            <div className="space-y-1 max-h-40 overflow-y-auto border border-gray-200 rounded p-2">
              {uniqueSubcontractors.length > 0 ? (
                uniqueSubcontractors.map((subName) => (
                  <label key={subName} className="flex items-center space-x-2 text-sm">
                    <input type="checkbox" checked={selectedSubcontractors.includes(subName)} onChange={() => toggleSubcontractor(subName)} className="rounded" />
                    <span>{subName}</span>
                  </label>
                ))
              ) : (
                <p className="text-sm text-gray-500 italic">No subcontractors assigned</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Export */}
      <div className="card">
        <h3 className="text-lg font-bold mb-4">Export Reports</h3>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => handleExportCsv('forecast')} className="btn btn-secondary">Export Forecast CSV</button>
          <button onClick={() => handleExportCsv('projects')} className="btn btn-secondary">Export Projects CSV</button>
          <button onClick={handleExportPdf} className="btn btn-primary">Export All Projects PDF</button>
        </div>
        <p className="text-xs text-gray-500 mt-3">CSV exports use the granularity setting below. PDF includes all selected projects.</p>
        <div className="flex space-x-2 mt-3">
          <button onClick={() => setGranularity('weekly')} className={`px-3 py-1.5 rounded text-sm font-medium ${granularity === 'weekly' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>Weekly</button>
          <button onClick={() => setGranularity('monthly')} className={`px-3 py-1.5 rounded text-sm font-medium ${granularity === 'monthly' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>Monthly</button>
        </div>
      </div>
    </div>
  )
}
