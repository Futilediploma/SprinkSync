import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { constructionApi } from '../services/api'
import { useProject } from '../contexts/ProjectContext'
import { Building2, ChevronDown, Plus, Check } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const ProjectSelector = () => {
  const { currentProject, setCurrentProject } = useProject()
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()

  const { data: projectsData, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => constructionApi.getProjects(),
  })

  const projects = projectsData?.data?.projects || []

  const handleProjectSelect = (project: any) => {
    setCurrentProject(project)
    setIsOpen(false)
  }

  const clearProject = () => {
    setCurrentProject(null)
    setIsOpen(false)
  }

  const handleCreateProject = () => {
    setIsOpen(false)
    navigate('/projects')
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 rounded-lg">
            <Building2 className="w-4 h-4 text-orange-600" />
          </div>
          <div className="text-left">
            <p className="font-medium text-gray-900">
              {currentProject ? currentProject.name : 'Select Project'}
            </p>
            <p className="text-xs text-gray-500">
              {currentProject ? 'Active Project' : 'Choose a project to continue'}
            </p>
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
          {isLoading ? (
            <div className="p-3 text-sm text-gray-500">Loading projects...</div>
          ) : projects.length === 0 ? (
            <div className="p-3">
              <p className="text-sm text-gray-500 mb-2">No projects found</p>
              <button 
                onClick={handleCreateProject}
                className="w-full flex items-center gap-2 p-2 text-left hover:bg-gray-50 rounded text-orange-600 font-medium"
              >
                <Plus className="w-4 h-4" />
                Create New Project
              </button>
            </div>
          ) : (
            <div className="p-1">
              {currentProject && (
                <>
                  <button
                    onClick={clearProject}
                    className="w-full flex items-center gap-2 p-2 text-left hover:bg-gray-50 rounded text-gray-600"
                  >
                    <div className="w-4 h-4" /> {/* Spacer */}
                    View All Projects
                  </button>
                  <div className="border-t border-gray-100 my-1" />
                </>
              )}
              
              {projects.map((project: any) => (
                <button
                  key={project.id}
                  onClick={() => handleProjectSelect(project)}
                  className="w-full flex items-center gap-2 p-2 text-left hover:bg-gray-50 rounded"
                >
                  {currentProject?.id === project.id ? (
                    <Check className="w-4 h-4 text-orange-600" />
                  ) : (
                    <div className="w-4 h-4" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{project.name}</p>
                    {project.location && (
                      <p className="text-xs text-gray-500">{project.location}</p>
                    )}
                  </div>
                  {project.status && (
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      project.status === 'active' 
                        ? 'bg-green-100 text-green-800'
                        : project.status === 'completed'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {project.status}
                    </span>
                  )}
                </button>
              ))}
              
              <div className="border-t border-gray-100 my-1" />
              <button 
                onClick={handleCreateProject}
                className="w-full flex items-center gap-2 p-2 text-left hover:bg-gray-50 rounded text-orange-600 font-medium"
              >
                <Plus className="w-4 h-4" />
                Create New Project
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ProjectSelector
