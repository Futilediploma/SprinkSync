import { useState, useEffect } from 'react'
import { forecastsApi, projectsApi, exportApi } from '../api'
  const handleExportPdf = async () => {
    try {
      const response = await exportApi.pdf();
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `all_projects_gantt_${new Date().getTime()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Failed to export PDF:', error);
      alert('Failed to export PDF');
    }
  };
import type { ManpowerForecast, Project } from '../types'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { format, addMonths } from 'date-fns'

export default function CompanyForecast() {
  const [forecast, setForecast] = useState<ManpowerForecast | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)

  // Filters
  const [startDate, setStartDate] = useState(() => format(new Date(), 'yyyy-MM-dd'))
  const [endDate, setEndDate] = useState(() => format(addMonths(new Date(), 3), 'yyyy-MM-dd'))
  const [selectedProjects, setSelectedProjects] = useState<number[]>([])
  const [granularity, setGranularity] = useState<'weekly' | 'monthly'>('weekly')
  const [typeFilter, setTypeFilter] = useState<string>('all') // all, mechanical, electrical, vesda, both
  const [awsFilter, setAwsFilter] = useState<'all' | 'aws' | 'standard'>('standard')

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    if (projects.length > 0) {
      loadForecast()
    }
  }, [startDate, endDate, selectedProjects, granularity, typeFilter, awsFilter])

  const loadInitialData = async () => {
    try {
      const projectsRes = await projectsApi.list()
      // Filter for Active and Prospective projects only
      const fetchedProjects = projectsRes.data.filter(p =>
        ['active', 'prospective'].includes(p.status)
      )
      setProjects(fetchedProjects)

      // Calculate date range from projects
      if (fetchedProjects.length > 0) {
        let minDate = ''
        let maxDate = ''

        fetchedProjects.forEach(p => {
          if (p.start_date) {
            if (!minDate || p.start_date < minDate) minDate = p.start_date
          }
          if (p.end_date) {
            if (!maxDate || p.end_date > maxDate) maxDate = p.end_date
          }
        })

        if (minDate) setStartDate(minDate)
        if (maxDate) setEndDate(maxDate)
      }
    } catch (error) {
      console.error('Failed to load data:', error)
    }
  }

  const loadForecast = async () => {
    try {
      setLoading(true)

      // Determine effective project IDs
      let effectiveProjectIds = undefined
      if (selectedProjects.length > 0) {
        effectiveProjectIds = selectedProjects
      } else {
        // Apply filters if no specific projects selected
        effectiveProjectIds = projects
          .filter(p => {
            // Filter by AWS
            if (awsFilter === 'aws' && !p.is_aws) return false
            if (awsFilter === 'standard' && p.is_aws) return false

            // Filter by Type
            if (typeFilter === 'mechanical' && !p.is_mechanical) return false
            if (typeFilter === 'electrical' && !p.is_electrical) return false
            if (typeFilter === 'vesda' && !p.is_vesda) return false
            if (typeFilter === 'both' && (!p.is_mechanical || !p.is_electrical)) return false

            return true
          })
          .map(p => p.id)
      }

      const response = await forecastsApi.companyWide({
        start_date: startDate,
        end_date: endDate,
        project_ids: effectiveProjectIds,
        // crew_type_ids removed
        granularity
      })
      setForecast(response.data)
    } catch (error) {
      console.error('Failed to load forecast:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExportCsv = async (exportType: 'forecast' | 'projects') => {
    try {
      const response = await forecastsApi.exportCsv({
        start_date: startDate,
        end_date: endDate,
        project_ids: selectedProjects.length > 0 ? selectedProjects : undefined,
        // crew_type_ids removed
        granularity
      }, exportType)

      // Create download link
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

  const toggleProject = (projectId: number) => {
    setSelectedProjects(prev =>
      prev.includes(projectId)
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    )
  }



  const chartData = forecast ? (
    granularity === 'weekly'
      ? forecast.weekly_forecast.map(w => ({
        name: format(new Date(w.week_start), 'MMM d'),
        'Man Hours': w.man_hours
      }))
      : forecast.monthly_forecast.map(m => ({
        name: m.month_name,
        'Man Hours': m.man_hours
      }))
  ) : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          {awsFilter === 'all' ? 'All Company Forecast' : awsFilter === 'aws' ? 'AWS Projects Forecast' : 'Company-Wide Forecast'}
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          Aggregate manpower demand across all active projects
        </p>
        {/* Main View Tabs */}
        <div className="flex space-x-1 mt-2">
          <button
            onClick={() => setAwsFilter('standard')}
            className={`text-xs px-2 py-1 rounded ${awsFilter === 'standard' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            Standard
          </button>
          <button
            onClick={() => setAwsFilter('aws')}
            className={`text-xs px-2 py-1 rounded ${awsFilter === 'aws' ? 'bg-purple-600 text-white' : 'text-purple-600 hover:bg-purple-50'}`}
          >
            AWS Projects
          </button>
          <button
            onClick={() => setAwsFilter('all')}
            className={`text-xs px-2 py-1 rounded ${awsFilter === 'all' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            All
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <h3 className="text-lg font-bold mb-4">Filters</h3>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input"
            />
          </div>
        </div>

        {/* Type Filter Controls */}
        <div className="flex bg-gray-100 rounded-lg p-1 mb-4 w-fit">
          {['all', 'mechanical', 'electrical', 'vesda', 'both'].map((type) => (
            <button
              key={type}
              onClick={() => {
                setTypeFilter(type)
                // Optionally clear selected projects when switching filters so the "All" logic takes over
                setSelectedProjects([])
              }}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${typeFilter === type
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex justify-between items-end mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Projects ({selectedProjects.length > 0 ? selectedProjects.length : 'All'})
              </label>
              <div className="space-x-2 text-xs">
                <button
                  onClick={() => setSelectedProjects(projects.map(p => p.id))}
                  className="text-primary-600 hover:text-primary-800"
                >
                  Select All
                </button>
                <button
                  onClick={() => setSelectedProjects([])}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Clear
                </button>
              </div>
            </div>
            <div className="space-y-1 max-h-40 overflow-y-auto border border-gray-200 rounded p-2">
              {projects
                .filter(p => {
                  // AWS Filter
                  if (awsFilter === 'aws' && !p.is_aws) return false
                  if (awsFilter === 'standard' && p.is_aws) return false

                  if (typeFilter === 'all') return true
                  if (typeFilter === 'mechanical') return p.is_mechanical
                  if (typeFilter === 'electrical') return p.is_electrical
                  if (typeFilter === 'vesda') return p.is_vesda
                  if (typeFilter === 'both') return p.is_mechanical && p.is_electrical
                  return true
                })
                .map((project) => (
                  <label key={project.id} className="flex items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedProjects.includes(project.id)}
                      onChange={() => toggleProject(project.id)}
                      className="rounded"
                    />
                    <span>{project.name}</span>
                  </label>
                ))}
            </div>
          </div>


        </div>
      </div>

      {/* Summary */}
      {forecast && (
        <div className="card">
          <div className="grid grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-600">Total Man-Hours</p>
              <p className="text-3xl font-bold text-primary-600">
                {forecast.total_man_hours.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Active Projects</p>
              <p className="text-3xl font-bold text-gray-900">
                {forecast.project_count}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Time Periods</p>
              <p className="text-3xl font-bold text-gray-900">
                {granularity === 'weekly' ? forecast.weekly_forecast.length : forecast.monthly_forecast.length}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Granularity & Export */}
      <div className="flex justify-between items-center">
        <div className="flex space-x-2">
          <button
            onClick={() => setGranularity('weekly')}
            className={`px-4 py-2 rounded-lg font-medium text-sm ${granularity === 'weekly'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
          >
            Weekly
          </button>
          <button
            onClick={() => setGranularity('monthly')}
            className={`px-4 py-2 rounded-lg font-medium text-sm ${granularity === 'monthly'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
          >
            Monthly
          </button>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => handleExportCsv('forecast')}
            className="btn btn-secondary"
          >
            Export Forecast CSV
          </button>
          <button
            onClick={() => handleExportCsv('projects')}
            className="btn btn-secondary"
          >
            Export Projects CSV
          </button>
          <button
            onClick={handleExportPdf}
            className="btn btn-secondary"
          >
            Export All Projects PDF
          </button>
        </div>
      </div>

      {/* Chart */}
      {loading ? (
        <div className="card text-center py-12">Loading forecast...</div>
      ) : forecast ? (
        <>
          <div className="card">
            <h3 className="text-lg font-bold mb-4">Manpower Demand Over Time</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis domain={[0, Math.max(...chartData.map(d => d['Man Hours'] || 0)) + 250]} allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Man Hours" fill="#2563eb" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Forecast Table */}
          <div className="card">
            <h3 className="text-lg font-bold mb-4">
              {granularity === 'weekly' ? 'Weekly' : 'Monthly'} Breakdown
            </h3>
            <table className="table">
              <thead>
                <tr>
                  <th>{granularity === 'weekly' ? 'Week' : 'Month'}</th>
                  {granularity === 'weekly' && <th>Week Start</th>}
                  <th className="text-right">Man Hours</th>
                </tr>
              </thead>
              <tbody>
                {granularity === 'weekly' ? (
                  forecast.weekly_forecast.map((week) => (
                    <tr key={week.week}>
                      <td className="font-medium">{week.week}</td>
                      <td>{week.week_start}</td>
                      <td className="text-right font-semibold">{week.man_hours.toLocaleString()}</td>
                    </tr>
                  ))
                ) : (
                  forecast.monthly_forecast.map((month) => (
                    <tr key={month.month}>
                      <td className="font-medium">{month.month_name}</td>
                      <td className="text-right font-semibold">{month.man_hours.toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Project Contributions */}
          {forecast.projects_included.length > 0 && (
            <div className="card">
              <h3 className="text-lg font-bold mb-4">Project Contributions</h3>
              <table className="table">
                <thead>
                  <tr>
                    <th>Project Name</th>
                    <th className="text-right">Total Man Hours</th>
                    <th className="text-right">% of Total</th>
                  </tr>
                </thead>
                <tbody>
                  {forecast.projects_included.map((project) => (
                    <tr key={project.id}>
                      <td className="font-medium">{project.name}</td>
                      <td className="text-right font-semibold">
                        {project.man_hours.toLocaleString()}
                      </td>
                      <td className="text-right text-gray-600">
                        {((project.man_hours / forecast.total_man_hours) * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
        <div className="card text-center py-12 text-gray-500">
          No forecast data available
        </div>
      )}
    </div>
  )
}
