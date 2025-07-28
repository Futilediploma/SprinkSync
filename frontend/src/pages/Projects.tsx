import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { constructionApi } from '../services/api'
import { useProject } from '../contexts/ProjectContext'
import { Building2, Plus, Calendar, DollarSign, MoreVertical, Edit } from 'lucide-react'
import { Link } from 'react-router-dom'
import CreateProjectModal from '../components/CreateProjectModal'

export default function Projects() {
  const { setCurrentProject } = useProject()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const { data: projectsData, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => constructionApi.getProjects(),
  })

  const projects = projectsData?.data?.projects || []

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800 border-green-200'
      case 'In Progress': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'Planning': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'On Hold': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const handleSelectProject = (project: any) => {
    setCurrentProject({
      id: project.id,
      name: project.name,
      description: project.description,
      status: project.status,
      budget: project.budget,
      progress: project.progress,
      startDate: project.startDate,
      endDate: project.endDate,
      location: project.location
    })
  }

  if (isLoading) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Projects</h1>
        </div>
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
                <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
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
          <h1 className="page-title">Projects</h1>
          <p className="page-subtitle">Manage all your construction projects</p>
        </div>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="btn-primary"
        >
          <Plus className="w-4 h-4" />
          New Project
        </button>
      </div>

      {projects.length === 0 ? (
        /* Empty State */
        <div className="empty-state">
          <div className="empty-state-icon">
            <Building2 className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="empty-state-title">No Projects Yet</h3>
          <p className="empty-state-description">
            Create your first construction project to start managing schedules, budgets, and teams.
          </p>
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="btn-primary"
          >
            <Plus className="w-4 h-4" />
            Create First Project
          </button>
        </div>
      ) : (
        /* Projects Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project: any) => (
            <div key={project.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
              {/* Project Header */}
              <div className="p-6 pb-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {project.name}
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {project.description || 'No description available'}
                    </p>
                  </div>
                  <div className="relative">
                    <button className="p-1 hover:bg-gray-100 rounded">
                      <MoreVertical className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="flex items-center gap-2 mb-4">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(project.status)}`}>
                    {project.status}
                  </span>
                </div>

                {/* Project Stats */}
                <div className="space-y-3">
                  {project.budget && (
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <DollarSign className="w-4 h-4" />
                        Budget
                      </div>
                      <span className="font-medium text-gray-900">
                        ${project.budget.toLocaleString()}
                      </span>
                    </div>
                  )}

                  {project.progress !== undefined && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Progress</span>
                        <span className="font-medium text-gray-900">{project.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-construction-gradient h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${project.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {project.deadline && (
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="w-4 h-4" />
                        Deadline
                      </div>
                      <span className="font-medium text-gray-900">
                        {new Date(project.deadline).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Project Actions */}
              <div className="px-6 py-4 bg-gray-50 rounded-b-lg border-t border-gray-100">
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleSelectProject(project)}
                    className="flex-1 btn-primary text-sm py-2"
                  >
                    Select Project
                  </button>
                  <Link 
                    to={`/projects/${project.id}`}
                    className="btn-secondary text-sm py-2 px-3"
                  >
                    <Edit className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      <CreateProjectModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
      />
    </div>
  )
}