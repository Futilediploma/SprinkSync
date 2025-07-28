import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { constructionApi } from '../services/api'
import { Building2, Calendar, DollarSign, Users, ArrowLeft, Edit } from 'lucide-react'
import { Link } from 'react-router-dom'

const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>()
  
  const { data: projectData, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: () => constructionApi.getProject(Number(id)),
    enabled: !!id,
  })

  // Empty state - no mock data
  const project = projectData?.data

  if (isLoading) {
    return (
      <div className="page-container">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
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

  if (!project) {
    return (
      <div className="page-container">
        <div className="flex items-center gap-4 mb-6">
          <Link to="/projects" className="btn-secondary">
            <ArrowLeft className="w-4 h-4" />
            Back to Projects
          </Link>
        </div>
        
        <div className="empty-state">
          <div className="empty-state-icon">
            <Building2 className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="empty-state-title">Project Not Found</h3>
          <p className="empty-state-description">
            The project you're looking for doesn't exist or may have been deleted.
          </p>
          <Link to="/projects" className="btn-primary">
            <ArrowLeft className="w-4 h-4" />
            Back to Projects
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link to="/projects" className="btn-secondary">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <div>
            <h1 className="page-title">{project.name || 'Project Details'}</h1>
            <p className="page-subtitle">{project.description || 'No description available'}</p>
          </div>
        </div>
        <button className="btn-primary">
          <Edit className="w-4 h-4" />
          Edit Project
        </button>
      </div>

      {/* Project Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Budget</p>
              <p className="text-3xl font-bold text-gray-900">
                ${project.budget?.toLocaleString() || '0'}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Progress</p>
              <p className="text-3xl font-bold text-gray-900">
                {project.progress || 0}%
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <Building2 className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Team Size</p>
              <p className="text-3xl font-bold text-gray-900">
                {project.teamSize || 0}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Days Left</p>
              <p className="text-3xl font-bold text-gray-900">
                {project.daysLeft || 0}
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <Calendar className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Project Content Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="construction-card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Overview</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span className="font-medium">{project.status || 'Not Set'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Start Date:</span>
              <span className="font-medium">
                {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'Not Set'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">End Date:</span>
              <span className="font-medium">
                {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'Not Set'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Location:</span>
              <span className="font-medium">{project.location || 'Not Set'}</span>
            </div>
          </div>
        </div>

        <div className="construction-card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="text-center py-8 text-gray-500">
            <Calendar className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p>No recent activity</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProjectDetail
