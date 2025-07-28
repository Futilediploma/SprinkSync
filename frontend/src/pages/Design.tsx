import { useQuery } from '@tanstack/react-query'
import { constructionApi } from '../services/api'
import { useProject } from '../contexts/ProjectContext'
import { Layers, Upload, Download, Plus, Search } from 'lucide-react'

const Design = () => {
  const { currentProject, isProjectSelected } = useProject()

  const { data: drawingsData, isLoading } = useQuery({
    queryKey: ['drawings', currentProject?.id],
    queryFn: () => constructionApi.getDrawings(),
    enabled: isProjectSelected,
  })

  // Empty state - no mock data
  const drawings = drawingsData?.data || []

  // Show project selection prompt if no project is selected
  if (!isProjectSelected) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <div className="empty-state-icon">
            <Layers className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="empty-state-title">Select a Project</h3>
          <p className="empty-state-description">
            Choose a project from the sidebar to view and manage its design files and drawings.
          </p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Design & Drawings - {currentProject?.name}</h1>
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
          <h1 className="page-title">Design & Drawings - {currentProject?.name}</h1>
          <p className="page-subtitle">Manage architectural plans, blueprints, and design documents for {currentProject?.name}</p>
        </div>
        <div className="flex gap-3">
          <button className="btn-secondary">
            <Search className="w-4 h-4" />
            Search Drawings
          </button>
          <button className="btn-primary">
            <Upload className="w-4 h-4" />
            Upload Drawing
          </button>
        </div>
      </div>

      {drawings.length === 0 ? (
        <>
          {/* Summary Cards - Empty State */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="stat-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Drawings</p>
                  <p className="text-3xl font-bold text-gray-900">0</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Layers className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Current Revision</p>
                  <p className="text-3xl font-bold text-gray-900">-</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <Upload className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Downloads</p>
                  <p className="text-3xl font-bold text-gray-900">0</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <Download className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Empty State */}
          <div className="empty-state">
            <div className="empty-state-icon">
              <Layers className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="empty-state-title">No Design Files</h3>
            <p className="empty-state-description">
              Upload your architectural plans, blueprints, and design documents to get started with design management.
            </p>
            <div className="flex gap-3 justify-center">
              <button className="btn-primary">
                <Upload className="w-4 h-4" />
                Upload First Drawing
              </button>
              <button className="btn-secondary">
                <Plus className="w-4 h-4" />
                Create New Set
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-6">
          {/* Drawings content would go here */}
        </div>
      )}
    </div>
  )
}

export default Design
