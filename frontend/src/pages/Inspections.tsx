import { useQuery } from '@tanstack/react-query'
import { constructionApi } from '../services/api'
import { useProject } from '../contexts/ProjectContext'
import { ClipboardCheck, Calendar, Plus, Filter } from 'lucide-react'

const Inspections = () => {
  const { currentProject, isProjectSelected } = useProject()

  const { data: inspectionsData, isLoading } = useQuery({
    queryKey: ['inspections', currentProject?.id],
    queryFn: () => constructionApi.getInspections(),
    enabled: isProjectSelected,
  })

  // Empty state - no mock data
  const inspections = inspectionsData?.data || []

  // Show project selection prompt if no project is selected
  if (!isProjectSelected) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <div className="empty-state-icon">
            <ClipboardCheck className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="empty-state-title">Select a Project</h3>
          <p className="empty-state-description">
            Choose a project from the sidebar to view and manage its inspections.
          </p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Inspections - {currentProject?.name}</h1>
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
          <h1 className="page-title">Inspections - {currentProject?.name}</h1>
          <p className="page-subtitle">Manage quality control and inspections for {currentProject?.name}</p>
        </div>
        <div className="flex gap-3">
          <button className="btn-secondary">
            <Filter className="w-4 h-4" />
            Filter
          </button>
          <button className="btn-primary">
            <Plus className="w-4 h-4" />
            Schedule Inspection
          </button>
        </div>
      </div>

      {inspections.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <ClipboardCheck className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="empty-state-title">No Inspections Scheduled</h3>
          <p className="empty-state-description">
            Schedule quality control inspections and track compliance for your project.
          </p>
          <div className="flex gap-3 justify-center">
            <button className="btn-primary">
              <Plus className="w-4 h-4" />
              Schedule First Inspection
            </button>
            <button className="btn-secondary">
              <Calendar className="w-4 h-4" />
              View Calendar
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Inspections content would be rendered here */}
        </div>
      )}
    </div>
  )
}

export default Inspections