import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { projectsApi, forecastsApi } from '../api'
import type { Project, ManpowerForecast } from '../types'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export default function ProjectForecast() {
  const { id } = useParams<{ id: string }>()
  const projectId = parseInt(id!)

  const [project, setProject] = useState<Project | null>(null)
  const [forecast, setForecast] = useState<ManpowerForecast | null>(null)
  const [loading, setLoading] = useState(true)
  const [granularity, setGranularity] = useState<'weekly' | 'monthly'>('weekly')

  useEffect(() => {
    loadData()
  }, [projectId, granularity])

  const loadData = async () => {
    try {
      setLoading(true)
      const [projectRes, forecastRes] = await Promise.all([
        projectsApi.get(projectId),
        forecastsApi.project(projectId, granularity)
      ])
      
      setProject(projectRes.data)
      setForecast(forecastRes.data)
    } catch (error) {
      console.error('Failed to load forecast:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  if (!project || !forecast) {
    return <div className="text-center py-12">Data not found</div>
  }

  const chartData = granularity === 'weekly'
    ? forecast.weekly_forecast.map(w => ({
        name: w.week,
        'Man Hours': w.man_hours
      }))
    : forecast.monthly_forecast.map(m => ({
        name: m.month_name,
        'Man Hours': m.man_hours
      }))

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-gray-600">
        <Link to="/" className="hover:text-primary-600">Projects</Link>
        <span>/</span>
        <Link to={`/projects/${projectId}/schedule`} className="hover:text-primary-600">
          {project.name}
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">Forecast</span>
      </div>

      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{project.name} - Forecast</h2>
          <p className="mt-1 text-sm text-gray-600">
            {forecast.start_date} to {forecast.end_date}
          </p>
        </div>
        <Link
          to={`/projects/${projectId}/schedule`}
          className="btn btn-secondary"
        >
          ← Back to Schedule
        </Link>
      </div>

      {/* Summary Card */}
      <div className="card">
        <div className="grid grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-600">Total Man-Hours</p>
            <p className="text-3xl font-bold text-primary-600">
              {forecast.total_man_hours.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Date Range</p>
            <p className="text-lg font-semibold text-gray-900">
              {forecast.start_date} to {forecast.end_date}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Phases</p>
            <p className="text-lg font-semibold text-gray-900">
              {granularity === 'weekly' ? forecast.weekly_forecast.length : forecast.monthly_forecast.length} periods
            </p>
          </div>
        </div>
      </div>

      {/* Granularity Toggle */}
      <div className="flex space-x-2">
        <button
          onClick={() => setGranularity('weekly')}
          className={`px-4 py-2 rounded-lg font-medium text-sm ${
            granularity === 'weekly'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Weekly
        </button>
        <button
          onClick={() => setGranularity('monthly')}
          className={`px-4 py-2 rounded-lg font-medium text-sm ${
            granularity === 'monthly'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Monthly
        </button>
      </div>

      {/* Chart */}
      <div className="card">
        <h3 className="text-lg font-bold mb-4">Manpower Demand</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
            <YAxis />
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
    </div>
  )
}
