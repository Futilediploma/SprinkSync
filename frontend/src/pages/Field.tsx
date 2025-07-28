import { useQuery } from '@tanstack/react-query'
import { constructionApi } from '../services/api'
import { useProject } from '../contexts/ProjectContext'
import { HardHat, Clock, AlertCircle, Plus, Users } from 'lucide-react'

const Field = () => {
  const { currentProject, isProjectSelected } = useProject()

  const { data: fieldData, isLoading } = useQuery({
    queryKey: ['field', currentProject?.id],
    queryFn: () => constructionApi.getFieldOverview(),
    enabled: isProjectSelected,
  })

  // Empty state - no mock data
  const fieldActivities = fieldData?.data || []

  // Show project selection prompt if no project is selected
  if (!isProjectSelected) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <div className="empty-state-icon">
            <HardHat className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="empty-state-title">Select a Project</h3>
          <p className="empty-state-description">
            Choose a project from the sidebar to view its field operations and site activities.
          </p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Field Operations - {currentProject?.name}</h1>
        </div>
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="stat-card">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Field Operations - {currentProject?.name}</h1>
          <p className="page-subtitle">Monitor on-site activities, labor tracking, and field reports for {currentProject?.name}</p>
        </div>
        <div className="flex gap-3">
          <button className="btn-secondary">
            <Clock className="w-4 h-4" />
            Time Tracking
          </button>
          <button className="btn-primary">
            <Plus className="w-4 h-4" />
            New Report
          </button>
        </div>
      </div>

      {fieldActivities.length === 0 ? (
        <>
          {/* Summary Cards - Empty State */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="stat-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Workers</p>
                  <p className="text-3xl font-bold text-gray-900">0</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Hours Today</p>
                  <p className="text-3xl font-bold text-gray-900">0</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <Clock className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Safety Issues</p>
                  <p className="text-3xl font-bold text-gray-900">0</p>
                </div>
                <div className="p-3 bg-red-100 rounded-full">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Empty State */}
          <div className="empty-state">
            <div className="empty-state-icon">
              <HardHat className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="empty-state-title">No Field Data</h3>
            <p className="empty-state-description">
              Start tracking field operations by adding workers, logging time, and creating field reports.
            </p>
            <div className="flex gap-3 justify-center">
              <button className="btn-primary">
                <Users className="w-4 h-4" />
                Add Workers
              </button>
              <button className="btn-secondary">
                <Clock className="w-4 h-4" />
                Start Time Tracking
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-6">
          {/* Field activities content would go here */}
        </div>
      )}
    </div>
  )
}

export default Field
