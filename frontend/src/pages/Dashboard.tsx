import { Building2, Calendar, DollarSign, Users, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { constructionApi } from '../services/api'
import { useProject } from '../contexts/ProjectContext'

export default function Dashboard() {
  const { currentProject, isProjectSelected } = useProject()

  // Fetch dashboard data from API - project-scoped when project is selected
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats', currentProject?.id],
    queryFn: () => constructionApi.getDashboardStats(),
    enabled: isProjectSelected,
  })

  const { data: alertsData, isLoading: alertsLoading } = useQuery({
    queryKey: ['dashboard-alerts', currentProject?.id], 
    queryFn: () => constructionApi.getDashboardAlerts(),
    enabled: isProjectSelected,
  })

  const { data: projectsData, isLoading: projectsLoading } = useQuery({
    queryKey: ['projects', currentProject?.id],
    queryFn: () => constructionApi.getProjects(),
    enabled: isProjectSelected,
  })

  // Use API data or fallback to loading state
  const stats = statsData?.data?.stats || []
  const alerts = alertsData?.data?.alerts || []
  const recentProjects = projectsData?.data?.projects || []

  const iconMap = {
    'Active Projects': Building2,
    'Total Budget': DollarSign,
    'Team Members': Users,
    'Completion Rate': TrendingUp,
  }

  // Show project selection prompt if no project is selected
  if (!isProjectSelected) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <div className="empty-state-icon">
            <Building2 className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="empty-state-title">Select a Project</h3>
          <p className="empty-state-description">
            Choose a project from the sidebar to view its dashboard and analytics.
          </p>
        </div>
      </div>
    )
  }

  if (statsLoading || alertsLoading || projectsLoading) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Dashboard - {currentProject?.name}</h1>
        </div>
        <div className="animate-pulse">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="stat-card">
                <div className="h-16 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard - {currentProject?.name}</h1>
          <p className="page-subtitle">Project overview and key metrics for {currentProject?.name}</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat: any, index: number) => {
          const IconComponent = iconMap[stat.name as keyof typeof iconMap] || Building2
          return (
            <div key={index} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <IconComponent className="h-6 w-6 text-construction-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">{stat.name}</dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">{stat.value}</div>
                        <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                          {stat.change}
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Projects */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Recent Projects</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {recentProjects.map((project: any, index: number) => (
                  <div key={index} className="flex items-center space-x-4">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">{project.name}</h4>
                      <div className="flex items-center mt-1">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          project.status === 'Completed' ? 'bg-green-100 text-green-800' :
                          project.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {project.status}
                        </span>
                        <span className="ml-2 text-xs text-gray-500">Due: {project.deadline}</span>
                      </div>
                    </div>
                    <div className="flex-shrink-0 w-24">
                      <div className="bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-construction-gradient h-2 rounded-full" 
                          style={{ width: `${project.progress}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-500 mt-1">{project.progress}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Alerts */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Recent Alerts</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {alerts.map((alert: any, index: number) => (
                  <div key={index} className="flex space-x-3">
                    <div className="flex-shrink-0">
                      {alert.type === 'warning' && <AlertTriangle className="h-5 w-5 text-yellow-500" />}
                      {alert.type === 'info' && <Calendar className="h-5 w-5 text-blue-500" />}
                      {alert.type === 'success' && <CheckCircle className="h-5 w-5 text-green-500" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{alert.message}</p>
                      <p className="text-xs text-gray-500 mt-1">{alert.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}