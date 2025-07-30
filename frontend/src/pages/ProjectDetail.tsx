import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { constructionApi } from '../services/api'
import EditProjectModal from '../components/EditProjectModalSimple'
import { useState } from 'react'
import { 
  Building2, 
  Calendar, 
  DollarSign, 
  Users, 
  ArrowLeft, 
  Edit,
  FileText,
  ClipboardCheck,
  Compass,
  BarChart3,
  Clock,
  // AlertTriangle,
  CheckCircle,
  TrendingUp,
  Plus,
  ArrowRight
} from 'lucide-react'
import { Link } from 'react-router-dom'

const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>()
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  
  const { data: projectData, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: () => constructionApi.getProject(Number(id)),
    enabled: !!id,
  })

  // Empty state - no mock data
  const project = projectData?.data

  // Project modules for quick access
  const projectModules = [
    {
      name: 'Schedule',
      description: 'Manage tasks, timelines, and milestones',
      href: '/schedule',
      icon: Calendar,
      color: 'bg-blue-500',
      stats: '12 active tasks'
    },
    {
      name: 'Financials',
      description: 'Budget tracking, costs, and payments',
      href: '/financials',
      icon: DollarSign,
      color: 'bg-green-500',
      stats: '$2.5M budget'
    },
    {
      name: 'Documents',
      description: 'Plans, contracts, and project files',
      href: '/documents',
      icon: FileText,
      color: 'bg-purple-500',
      stats: '45 documents'
    },
    {
      name: 'Field Team',
      description: 'Crew management and labor tracking',
      href: '/field',
      icon: Users,
      color: 'bg-orange-500',
      stats: '8 team members'
    },
    {
      name: 'Inspections',
      description: 'Quality control and compliance checks',
      href: '/inspections',
      icon: ClipboardCheck,
      color: 'bg-red-500',
      stats: '3 pending'
    },
    {
      name: 'Design',
      description: 'Drawings, specifications, and changes',
      href: '/design',
      icon: Compass,
      color: 'bg-indigo-500',
      stats: '7 drawings'
    },
    {
      name: 'Reports',
      description: 'Progress reports and analytics',
      href: '/reports',
      icon: BarChart3,
      color: 'bg-yellow-500',
      stats: 'Weekly report due'
    }
  ]

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
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link to="/projects" className="btn-secondary">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <div>
            <h1 className="page-title">{project.name || 'Project Home'}</h1>
            <p className="page-subtitle">
              {project.description || 'Project management hub and overview'}
            </p>
          </div>
        </div>
        <button 
          className="btn-primary"
          onClick={() => setIsEditModalOpen(true)}
        >
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
                ${project.budget?.toLocaleString() || project.contract_amount?.toLocaleString() || '0'}
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
              <p className="text-sm font-medium text-gray-600">Status</p>
              <p className="text-xl font-bold text-gray-900">
                {project.status || 'Active'}
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
              <p className="text-sm font-medium text-gray-600">Project Manager</p>
              <p className="text-lg font-bold text-gray-900">
                {project.project_manager || 'Not Assigned'}
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
              <p className="text-sm font-medium text-gray-600">Duration</p>
              <p className="text-xl font-bold text-gray-900">
                {project.estimated_duration ? `${project.estimated_duration} days` : 'TBD'}
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <Calendar className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Project Modules Grid */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Project Modules</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {projectModules.map((module, index) => {
            const IconComponent = module.icon
            return (
              <Link
                key={index}
                to={module.href}
                className="group bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-gray-300 transition-all duration-200"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg ${module.color} bg-opacity-10`}>
                    <IconComponent className={`w-6 h-6 ${module.color.replace('bg-', 'text-')}`} />
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{module.name}</h3>
                <p className="text-sm text-gray-600 mb-3">{module.description}</p>
                <p className="text-xs text-gray-500 font-medium">{module.stats}</p>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Project Details and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Project Information</h3>
            <button className="text-sm text-blue-600 hover:text-blue-800">
              <Edit className="w-4 h-4 inline mr-1" />
              Edit
            </button>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Job Number</label>
                <p className="text-sm text-gray-900">{project.job_number || 'Not Set'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Priority</label>
                <p className="text-sm text-gray-900">{project.job_priority || 'Medium'}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Start Date</label>
                <p className="text-sm text-gray-900">
                  {project.start_date ? new Date(project.start_date).toLocaleDateString() : 'Not Set'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">End Date</label>
                <p className="text-sm text-gray-900">
                  {project.end_date ? new Date(project.end_date).toLocaleDateString() : 'Not Set'}
                </p>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Location</label>
              <p className="text-sm text-gray-900">
                {[project.address, project.city, project.state].filter(Boolean).join(', ') || 'Not Set'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Client</label>
              <p className="text-sm text-gray-900">{project.client_name || 'Not Set'}</p>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
            <button className="text-sm text-blue-600 hover:text-blue-800">View All</button>
          </div>
          <div className="space-y-4">
            {/* Sample activity items */}
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-gray-900">Foundation inspection completed</p>
                <p className="text-xs text-gray-500">2 hours ago</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Plus className="w-5 h-5 text-blue-500 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-gray-900">New document uploaded: Site Plan Rev 3</p>
                <p className="text-xs text-gray-500">4 hours ago</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <TrendingUp className="w-5 h-5 text-purple-500 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-gray-900">Project progress updated to 75%</p>
                <p className="text-xs text-gray-500">1 day ago</p>
              </div>
            </div>
            {/* Empty state for when no activity */}
            {false && (
              <div className="text-center py-8 text-gray-500">
                <Clock className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p>No recent activity</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Project Modal */}
      {project && (
        <EditProjectModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          project={project}
        />
      )}
    </div>
  )
}

export default ProjectDetail
