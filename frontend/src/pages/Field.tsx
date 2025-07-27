import { useQuery } from '@tanstack/react-query'
import { constructionApi } from '../services/api'
import { Users, Calendar, Shield, TrendingUp } from 'lucide-react'

const Field = () => {
  const { data: fieldData, isLoading } = useQuery({
    queryKey: ['field'],
    queryFn: () => constructionApi.getFieldOverview(),
  })

  const { data: laborData } = useQuery({
    queryKey: ['labor'],
    queryFn: () => constructionApi.getLaborTracking(),
  })

  const mockField = {
    daily_reports: [
      { date: '2024-01-18', weather: 'Sunny, 45°F', crew_count: 12, work_completed: 'Foundation pour completed' },
      { date: '2024-01-17', weather: 'Cloudy, 42°F', crew_count: 10, work_completed: 'Rebar placement' },
      { date: '2024-01-16', weather: 'Light rain, 38°F', crew_count: 8, work_completed: 'Site cleanup' }
    ],
    safety_metrics: {
      days_without_incident: 45,
      total_incidents_ytd: 0,
      safety_meetings_held: 12
    }
  }

  const mockLabor = {
    crews: [
      { crew: 'Concrete', members: 6, hours_today: 48, task: 'Foundation work' },
      { crew: 'Electrical', members: 3, hours_today: 24, task: 'Rough-in installation' },
      { crew: 'Plumbing', members: 2, hours_today: 16, task: 'Underground utilities' },
      { crew: 'General', members: 4, hours_today: 32, task: 'Site preparation' }
    ],
    productivity: {
      target_hours_per_day: 120,
      actual_hours_today: 120,
      efficiency: 100
    }
  }

  const field = fieldData?.data || mockField
  const labor = laborData?.data || mockLabor

  if (isLoading) {
    return <div className="shimmer h-64 rounded-lg"></div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Field Management</h2>
        <p className="text-gray-600 mt-1">Monitor crew activities and safety metrics</p>
      </div>

      {/* Safety Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Days Without Incident</p>
              <p className="text-3xl font-bold text-green-600">{field.safety_metrics.days_without_incident}</p>
            </div>
            <div className="w-12 h-12 success-gradient rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Safety Meetings</p>
              <p className="text-3xl font-bold text-blue-600">{field.safety_metrics.safety_meetings_held}</p>
            </div>
            <div className="w-12 h-12 info-gradient rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Productivity</p>
              <p className="text-3xl font-bold text-construction-600">{labor.productivity.efficiency}%</p>
            </div>
            <div className="w-12 h-12 construction-gradient rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Labor Tracking */}
        <div className="construction-card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Crews</h3>
          <div className="space-y-4">
            {labor.crews.map((crew: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 construction-gradient rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{crew.crew} Crew</p>
                    <p className="text-sm text-gray-600">{crew.task}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{crew.members} workers</p>
                  <p className="text-sm text-gray-600">{crew.hours_today} hours today</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Daily Reports */}
        <div className="construction-card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Reports</h3>
          <div className="space-y-4">
            {field.daily_reports.map((report: any, index: number) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-medium text-gray-900">{report.date}</span>
                  <span className="text-sm text-gray-600">{report.crew_count} crew members</span>
                </div>
                <p className="text-sm text-gray-600 mb-2">Weather: {report.weather}</p>
                <p className="text-sm text-gray-900">{report.work_completed}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Field
