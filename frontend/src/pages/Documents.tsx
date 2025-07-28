import { useQuery } from '@tanstack/react-query'
import { constructionApi } from '../services/api'
import { useProject } from '../contexts/ProjectContext'
import { FileText, Upload } from 'lucide-react'

const Documents = () => {
  const { currentProject, isProjectSelected } = useProject()

  const { isLoading } = useQuery({
    queryKey: ['documents', currentProject?.id],
    queryFn: () => constructionApi.getDocuments(),
    enabled: isProjectSelected,
  })

  // Removed unused drawingsData query

  // Empty state - no mock data

  // Show project selection prompt if no project is selected
  if (!isProjectSelected) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <div className="empty-state-icon">
            <FileText className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="empty-state-title">Select a Project</h3>
          <p className="empty-state-description">
            Choose a project from the sidebar to view and manage its documents.
          </p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Documents - {currentProject?.name}</h1>
        </div>
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="shimmer h-32 rounded-lg"></div>
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
          <h1 className="page-title">Documents - {currentProject?.name}</h1>
          <p className="page-subtitle">Manage and organize documents for {currentProject?.name}</p>
        </div>
        <div className="flex gap-3">
          <button className="btn-secondary">
            Create Folder
          </button>
          <button className="btn-primary">
            <Upload className="w-5 h-5 mr-2" />
            Upload Documents
          </button>
        </div>
      </div>

      {/* Empty State */}
      <div className="empty-state">
        <div className="empty-state-icon">
          <FileText className="w-12 h-12 text-gray-400" />
        </div>
        <h3 className="empty-state-title">No Documents</h3>
        <p className="empty-state-description">
          Upload your project documents, plans, and specifications to get started with document management.
        </p>
        <div className="flex gap-3 justify-center">
          <button className="btn-primary">
            <Upload className="w-5 h-5 mr-2" />
            Upload Documents
          </button>
          <button className="btn-secondary">
            Create Folder
          </button>
        </div>
      </div>
    </div>
  )
}

export default Documents
