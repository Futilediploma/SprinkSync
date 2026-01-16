import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { projectsApi } from '../api'
import type { Project } from '../types'

export default function ProjectsList() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('active')
  const [typeFilter, setTypeFilter] = useState<string>('all') // all, mechanical, electrical, both
  const [awsFilter, setAwsFilter] = useState<'all' | 'aws' | 'standard'>('standard')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)

  // Delete Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null)

  // Sorting State
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null)

  const [newProject, setNewProject] = useState({
    name: '',
    customer_name: '',
    project_number: '',
    notes: '',
    budgeted_hours: '',
    start_date: '',
    end_date: '',
    status: 'active',
    is_mechanical: false,
    is_electrical: false,
    is_aws: false
  })

  useEffect(() => {
    loadProjects()
  }, [statusFilter])

  const loadProjects = async () => {
    try {
      setLoading(true)
      const response = await projectsApi.list(statusFilter)
      setProjects(response.data)
    } catch (error) {
      console.error('Failed to load projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = {
        ...newProject,
        budgeted_hours: newProject.budgeted_hours ? parseFloat(newProject.budgeted_hours) : undefined
      }

      if (editingId) {
        await projectsApi.update(editingId, payload)
      } else {
        await projectsApi.create({
          ...payload,
          status: newProject.status || 'active'
        })
      }

      resetForm()
      loadProjects()
    } catch (error) {
      console.error('Failed to save project:', error)
      alert('Failed to save project')
    }
  }

  const handleEditClick = (project: Project) => {
    setEditingId(project.id)
    setNewProject({
      name: project.name,
      customer_name: project.customer_name || '',
      project_number: project.project_number || '',
      notes: project.notes || '',
      budgeted_hours: project.budgeted_hours?.toString() || '',
      start_date: project.start_date || '',
      end_date: project.end_date || '',
      status: project.status || 'active',
      is_mechanical: project.is_mechanical || false,
      is_electrical: project.is_electrical || false,
      is_aws: project.is_aws || false
    })
    setShowCreateForm(true)
  }

  const resetForm = () => {
    setNewProject({
      name: '',
      customer_name: '',
      project_number: '',
      notes: '',
      budgeted_hours: '',
      start_date: '',
      end_date: '',
      status: 'active',
      is_mechanical: false,
      is_electrical: false,
      is_aws: false
    })
    setEditingId(null)
    setShowCreateForm(false)
  }

  const handleDeleteClick = (project: Project) => {
    setProjectToDelete(project)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (!projectToDelete) return

    try {
      await projectsApi.delete(projectToDelete.id)
      setShowDeleteModal(false)
      setProjectToDelete(null)
      loadProjects()
    } catch (error) {
      console.error('Failed to delete project:', error)
      alert('Failed to delete project')
    }
  }

  // Sorting Logic
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc'
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  const sortedProjects = [...projects]
    .filter(p => {
      // Filter by AWS
      if (awsFilter === 'aws') {
        if (!p.is_aws) return false
      }
      if (awsFilter === 'standard') {
        if (p.is_aws) return false
      }
      // 'all' passes through

      if (typeFilter === 'all') return true
      if (typeFilter === 'mechanical') return p.is_mechanical
      if (typeFilter === 'electrical') return p.is_electrical
      if (typeFilter === 'both') return p.is_mechanical && p.is_electrical
      return true
    })
    .sort((a, b) => {
      if (!sortConfig) return 0

      const aValue = a[sortConfig.key as keyof Project]
      const bValue = b[sortConfig.key as keyof Project]

      if (aValue === bValue) return 0

      // Handle nulls
      if (aValue === null || aValue === undefined) return 1
      if (bValue === null || bValue === undefined) return -1

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1
      }
      return 0
    })

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {awsFilter === 'all' ? 'All Projects' : awsFilter === 'aws' ? 'AWS Projects' : 'Projects'}
          </h2>
          {/* Main View Tabs */}
          <div className="flex space-x-1 mt-1">
            <button
              onClick={() => setAwsFilter('standard')}
              className={`text-xs px-2 py-1 rounded ${awsFilter === 'standard' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              Standard
            </button>
            <button
              onClick={() => setAwsFilter('aws')}
              className={`text-xs px-2 py-1 rounded ${awsFilter === 'aws' ? 'bg-purple-600 text-white' : 'text-purple-600 hover:bg-purple-50'}`}
            >
              AWS Projects
            </button>
            <button
              onClick={() => setAwsFilter('all')}
              className={`text-xs px-2 py-1 rounded ${awsFilter === 'all' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              All
            </button>
          </div>
        </div>
        <button
          onClick={() => {
            resetForm()
            setShowCreateForm(true)
          }}
          className="btn btn-primary"
        >
          + New Project
        </button>
      </div>

      {/* Status Filter */}
      <div className="flex space-x-2">
        {['active', 'prospective', 'completed', 'archived'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${statusFilter === status
              ? 'bg-primary-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}

        <div className="w-px bg-gray-300 mx-2 h-8 self-center" />

        {['all', 'mechanical', 'electrical', 'both'].map((type) => (
          <button
            key={type}
            onClick={() => setTypeFilter(type)}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${typeFilter === type
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      {/* Create Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">
              {editingId ? 'Edit Project' : 'Create New Project'}
            </h3>
            <form onSubmit={handleSaveProject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project Name *
                </label>
                <input
                  type="text"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={newProject.status}
                  onChange={(e) => setNewProject({ ...newProject, status: e.target.value })}
                  className="input"
                >
                  <option value="active">Active</option>
                  <option value="prospective">Prospective</option>
                  <option value="completed">Completed</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              {/* Project Types */}
              <div className="flex space-x-6">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={newProject.is_mechanical}
                    onChange={e => setNewProject({ ...newProject, is_mechanical: e.target.checked })}
                    className="rounded text-primary-600"
                  />
                  <span className="text-sm font-medium text-gray-700">Mechanical</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={newProject.is_electrical}
                    onChange={e => setNewProject({ ...newProject, is_electrical: e.target.checked })}
                    className="rounded text-primary-600"
                  />
                  <span className="text-sm font-medium text-gray-700">Electrical</span>
                </label>
              </div>

              {/* AWS Toggle */}
              <div className="flex items-center space-x-2 border-t pt-4">
                <input
                  type="checkbox"
                  checked={newProject.is_aws}
                  onChange={e => setNewProject({ ...newProject, is_aws: e.target.checked })}
                  className="rounded text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm font-bold text-purple-700">Is AWS Project?</span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Name
                </label>
                <input
                  type="text"
                  value={newProject.customer_name}
                  onChange={(e) => setNewProject({ ...newProject, customer_name: e.target.value })}
                  className="input"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={newProject.start_date}
                    onChange={(e) => setNewProject({ ...newProject, start_date: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={newProject.end_date}
                    onChange={(e) => setNewProject({ ...newProject, end_date: e.target.value })}
                    className="input"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project Number
                  </label>
                  <input
                    type="text"
                    value={newProject.project_number}
                    onChange={(e) => setNewProject({ ...newProject, project_number: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Budgeted Hours
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newProject.budgeted_hours}
                    onChange={(e) => setNewProject({ ...newProject, budgeted_hours: e.target.value })}
                    className="input"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={newProject.notes}
                  onChange={(e) => setNewProject({ ...newProject, notes: e.target.value })}
                  className="input"
                  rows={3}
                />
              </div>
              <div className="flex space-x-3">
                <button type="submit" className="btn btn-primary flex-1">
                  {editingId ? 'Save Changes' : 'Create Project'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && projectToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-2 text-red-600">Delete Project?</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <strong>{projectToDelete.name}</strong>?
              This will permanently remove the project and all its scheduled data.
              This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={confirmDelete}
                className="btn bg-red-600 text-white hover:bg-red-700 flex-1"
              >
                Delete Forever
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="btn btn-secondary flex-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Projects Table */}
      <div className="card">
        {projects.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No {statusFilter} projects found.</p>
            <p className="text-sm text-gray-400 mt-2">
              Create a new project to get started.
            </p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th className="cursor-pointer hover:bg-gray-50" onClick={() => handleSort('name')}>
                  Project Name {sortConfig?.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="cursor-pointer hover:bg-gray-50" onClick={() => handleSort('customer_name')}>
                  Customer {sortConfig?.key === 'customer_name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="cursor-pointer hover:bg-gray-50" onClick={() => handleSort('project_number')}>
                  Project # {sortConfig?.key === 'project_number' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="text-right cursor-pointer hover:bg-gray-50" onClick={() => handleSort('budgeted_hours')}>
                  Budgeted {sortConfig?.key === 'budgeted_hours' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="text-right cursor-pointer hover:bg-gray-50" onClick={() => handleSort('total_scheduled_hours')}>
                  Scheduled {sortConfig?.key === 'total_scheduled_hours' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="cursor-pointer hover:bg-gray-50" onClick={() => handleSort('status')}>
                  Status {sortConfig?.key === 'status' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedProjects.map((project) => (
                <tr key={project.id}>
                  <td className="font-medium text-gray-900">{project.name}</td>
                  <td className="text-gray-600">{project.customer_name || '—'}</td>
                  <td className="text-gray-600">{project.project_number || '—'}</td>
                  <td className="text-right font-medium">
                    {project.budgeted_hours ? project.budgeted_hours.toLocaleString() : '—'}
                  </td>
                  <td className="text-right font-medium">
                    <span className={
                      (project.budgeted_hours && project.total_scheduled_hours > project.budgeted_hours)
                        ? 'text-red-600'
                        : 'text-gray-900'
                    }>
                      {project.total_scheduled_hours ? project.total_scheduled_hours.toLocaleString() : '0'}
                    </span>
                  </td>
                  <td>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${project.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : project.status === 'prospective'
                        ? 'bg-purple-100 text-purple-800'
                        : project.status === 'completed'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                      {project.status}
                    </span>
                    <div className="mt-1 space-x-1">
                      {project.is_aws && <span className="text-[10px] uppercase bg-purple-100 text-purple-800 px-1 rounded border border-purple-200">AWS</span>}
                      {project.is_mechanical && <span className="text-[10px] uppercase bg-orange-100 text-orange-800 px-1 rounded">Mech</span>}
                      {project.is_electrical && <span className="text-[10px] uppercase bg-yellow-100 text-yellow-800 px-1 rounded">Elec</span>}
                    </div>
                  </td>
                  <td>
                    <div className="flex space-x-2">
                      <Link
                        to={`/projects/${project.id}/schedule`}
                        className="text-primary-600 hover:text-primary-800 text-sm font-medium"
                      >
                        Schedule
                      </Link>
                      <Link
                        to={`/projects/${project.id}/forecast`}
                        className="text-primary-600 hover:text-primary-800 text-sm font-medium"
                      >
                        Forecast
                      </Link>
                      <button
                        onClick={() => handleEditClick(project)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteClick(project)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
