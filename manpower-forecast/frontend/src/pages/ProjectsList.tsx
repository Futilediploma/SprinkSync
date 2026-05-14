import { useState, useEffect } from 'react'
import { projectsApi, manpowerNeedsApi } from '../api'
import type { Project, ProjectSubcontractor } from '../types'
import { apiSubsToUiSubs, uiSubsToApiSubs } from '../types'
import { validateProject, ValidationError, getFieldError } from '../utils/validation'

export default function ProjectsList() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('active')
  const [typeFilter, setTypeFilter] = useState<string>('all') // all, mechanical, electrical, vesda, both
  const [awsFilter, setAwsFilter] = useState<'all' | 'aws' | 'standard'>('all')
  const [manpowerStatusFilter, setManpowerStatusFilter] = useState<'all' | 'active' | 'prospective'>('all')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)

  // Export Modal State
  const [showExportModal, setShowExportModal] = useState(false)
  const [exporting, setExporting] = useState<'pdf' | 'docx' | 'excel' | null>(null)
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())

  // Delete Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null)

  // Sorting State
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null)

  const [newProject, setNewProject] = useState<{
    name: string;
    customer_name: string;
    project_number: string;
    notes: string;
    required_manpower: string;
    sub_headcount: string;
    start_date: string;
    end_date: string;
    status: string;
    is_mechanical: boolean;
    is_electrical: boolean;
    is_vesda: boolean;
    is_aws: boolean;
    is_out_of_town: boolean;
    bfpe_sprinkler_headcount: number;
    bfpe_vesda_headcount: number;
    bfpe_electrical_headcount: number;
    foreman: string;
    po_number: string;
    manpower_allocated: boolean;
    subcontractors: ProjectSubcontractor[];
  }>({
    name: '',
    customer_name: '',
    project_number: '',
    notes: '',
    required_manpower: '',
    sub_headcount: '',
    start_date: '',
    end_date: '',
    status: 'active',
    is_mechanical: false,
    is_electrical: false,
    is_vesda: false,
    is_aws: false,
    is_out_of_town: false,
    bfpe_sprinkler_headcount: 0,
    bfpe_vesda_headcount: 0,
    bfpe_electrical_headcount: 0,
    foreman: '',
    po_number: '',
    manpower_allocated: false,
    subcontractors: [],
  })

  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])

  useEffect(() => {
    loadProjects()
  }, [statusFilter])

  const loadProjects = async () => {
    try {
      setLoading(true)
      // 'needs_manpower' requires fetching active+prospective across all statuses
      const response = await projectsApi.list(statusFilter === 'needs_manpower' ? undefined : statusFilter)
      setProjects(response.data)
    } catch (error) {
      console.error('Failed to load projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleAllocated = async (project: Project) => {
    try {
      await projectsApi.update(project.id, { manpower_allocated: !project.manpower_allocated })
      loadProjects()
    } catch (error) {
      console.error('Failed to update allocation status:', error)
    }
  }


  const buildFilename = (ext: string) => {
    const parts = ['Unallocated_Manpower']
    if (manpowerStatusFilter !== 'all') parts.push(manpowerStatusFilter.charAt(0).toUpperCase() + manpowerStatusFilter.slice(1))
    if (awsFilter !== 'all') parts.push(awsFilter.toUpperCase())
    if (typeFilter !== 'all') parts.push(typeFilter.charAt(0).toUpperCase() + typeFilter.slice(1))
    return parts.join('_') + '.' + ext
  }

  const handleExport = async (format: 'pdf' | 'docx' | 'excel') => {
    setExporting(format)
    try {
      const ids = sortedProjects.map(p => p.id)
      let response: any
      let mimeType: string
      let ext: string

      if (format === 'pdf') {
        response = await manpowerNeedsApi.exportPdf(ids, manpowerStatusFilter)
        mimeType = 'application/pdf'
        ext = 'pdf'
      } else if (format === 'docx') {
        response = await manpowerNeedsApi.exportDocx(ids, manpowerStatusFilter)
        mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ext = 'docx'
      } else {
        response = await manpowerNeedsApi.exportExcel(ids, manpowerStatusFilter)
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ext = 'xlsx'
      }

      const url = window.URL.createObjectURL(new Blob([response.data], { type: mimeType }))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', buildFilename(ext))
      document.body.appendChild(link)
      link.click()
      link.remove()
      setShowExportModal(false)
    } catch (error) {
      console.error(`Failed to export ${format}:`, error)
      alert(`Failed to export ${format.toUpperCase()}`)
    } finally {
      setExporting(null)
    }
  }

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault()

    const validation = validateProject(newProject)
    setValidationErrors(validation.errors)

    if (!validation.isValid) return

    try {
      const payload = {
        ...newProject,
        required_manpower: newProject.required_manpower?.trim() ? parseInt(newProject.required_manpower) : 0,
        sub_headcount: newProject.sub_headcount?.trim() ? parseInt(newProject.sub_headcount) : 0,
        subcontractors: uiSubsToApiSubs(newProject.subcontractors)
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
      required_manpower: project.required_manpower?.toString() || '',
      sub_headcount: project.sub_headcount?.toString() || '',
      start_date: project.start_date || '',
      end_date: project.end_date || '',
      status: project.status || 'active',
      is_mechanical: project.is_mechanical || false,
      is_electrical: project.is_electrical || false,
      is_vesda: project.is_vesda || false,
      is_aws: project.is_aws || false,
      is_out_of_town: project.is_out_of_town || false,
      bfpe_sprinkler_headcount: project.bfpe_sprinkler_headcount || 0,
      bfpe_vesda_headcount: project.bfpe_vesda_headcount || 0,
      bfpe_electrical_headcount: project.bfpe_electrical_headcount || 0,
      foreman: project.foreman || '',
      po_number: project.po_number || '',
      manpower_allocated: project.manpower_allocated || false,
      subcontractors: project.subcontractors ? apiSubsToUiSubs(project.subcontractors) : [],
    })
    setShowCreateForm(true)
  }

  const resetForm = () => {
    setNewProject({
      name: '',
      customer_name: '',
      project_number: '',
      notes: '',
      required_manpower: '',
      sub_headcount: '',
      start_date: '',
      end_date: '',
      status: 'active',
      is_mechanical: false,
      is_electrical: false,
      is_vesda: false,
      is_aws: false,
      is_out_of_town: false,
      bfpe_sprinkler_headcount: 0,
      bfpe_vesda_headcount: 0,
      bfpe_electrical_headcount: 0,
      foreman: '',
      po_number: '',
      manpower_allocated: false,
      subcontractors: [],
    })
    setEditingId(null)
    setShowCreateForm(false)
    setValidationErrors([])
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
      // Needs Manpower tab: active/prospective with required_manpower > 0 and not yet allocated
      if (statusFilter === 'needs_manpower') {
        if (!(['active', 'prospective'].includes(p.status) && (p.required_manpower || 0) > 0 && !p.manpower_allocated)) return false
        if (awsFilter === 'aws' && !p.is_aws) return false
        if (awsFilter === 'standard' && p.is_aws) return false
        if (manpowerStatusFilter === 'active' && p.status !== 'active') return false
        if (manpowerStatusFilter === 'prospective' && p.status !== 'prospective') return false
        if (typeFilter === 'mechanical') return p.is_mechanical
        if (typeFilter === 'electrical') return p.is_electrical
        if (typeFilter === 'vesda') return p.is_vesda
        if (typeFilter === 'both') return p.is_mechanical && p.is_electrical
        return true
      }

      // Filter by AWS
      if (awsFilter === 'aws' && !p.is_aws) return false
      if (awsFilter === 'standard' && p.is_aws) return false

      if (typeFilter === 'all') return true
      if (typeFilter === 'mechanical') return p.is_mechanical
      if (typeFilter === 'electrical') return p.is_electrical
      if (typeFilter === 'vesda') return p.is_vesda
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
              onClick={() => setAwsFilter('all')}
              className={`text-xs px-2 py-1 rounded ${awsFilter === 'all' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              All
            </button>
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
      <div className="flex flex-wrap gap-2">
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
        <button
          onClick={() => setStatusFilter('needs_manpower')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${statusFilter === 'needs_manpower'
            ? 'bg-orange-500 text-white'
            : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
            }`}
        >
          ⚠ Needs Manpower
        </button>

        <div className="w-px bg-gray-300 mx-2 h-8 self-center" />

        {['all', 'mechanical', 'electrical', 'vesda', 'both'].map((type) => (
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-5 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-3">
              {editingId ? 'Edit Project' : 'Create New Project'}
            </h3>
            <form onSubmit={handleSaveProject} className="space-y-3">
              {validationErrors.length > 0 && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  <ul className="list-disc list-inside">
                    {validationErrors.map((error, index) => (
                      <li key={index}>{error.message}</li>
                    ))}
                  </ul>
                </div>
              )}
              {/* Row 1: Name & Status */}
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700">Project Name *</label>
                  <input
                    type="text"
                    value={newProject.name}
                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                    className={`input py-1 text-sm ${getFieldError(validationErrors, 'Project name') ? 'border-red-500' : ''}`}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">Status</label>
                  <select
                    value={newProject.status}
                    onChange={(e) => setNewProject({ ...newProject, status: e.target.value })}
                    className="input py-1 text-sm"
                  >
                    <option value="active">Active</option>
                    <option value="prospective">Prospective</option>
                    <option value="completed">Completed</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Customer & Project # */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700">Customer</label>
                  <input
                    type="text"
                    value={newProject.customer_name}
                    onChange={(e) => setNewProject({ ...newProject, customer_name: e.target.value })}
                    className="input py-1 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">Project #</label>
                  <input
                    type="text"
                    value={newProject.project_number}
                    onChange={(e) => setNewProject({ ...newProject, project_number: e.target.value })}
                    className="input py-1 text-sm"
                  />
                </div>
              </div>

              {/* Row 3: Manpower & Dates */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700">Manpower Required</label>
                  <input
                    type="number"
                    min="0"
                    value={newProject.required_manpower}
                    onChange={(e) => setNewProject({ ...newProject, required_manpower: e.target.value })}
                    placeholder="# of men"
                    className="input py-1 text-sm w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">Start Date</label>
                  <input
                    type="date"
                    value={newProject.start_date}
                    onChange={(e) => setNewProject({ ...newProject, start_date: e.target.value })}
                    className="input py-1 text-sm w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">End Date</label>
                  <input
                    type="date"
                    value={newProject.end_date}
                    onChange={(e) => setNewProject({ ...newProject, end_date: e.target.value })}
                    className="input py-1 text-sm w-full"
                  />
                </div>
              </div>

              {/* Row 4: Types & Flags - All inline */}
              <div className="flex flex-wrap gap-x-4 gap-y-1 py-2 border-y text-xs">
                <label className="flex items-center gap-1">
                  <input type="checkbox" checked={newProject.is_mechanical} onChange={e => setNewProject({ ...newProject, is_mechanical: e.target.checked })} className="rounded text-primary-600" />
                  <span>Mechanical</span>
                </label>
                <label className="flex items-center gap-1">
                  <input type="checkbox" checked={newProject.is_electrical} onChange={e => setNewProject({ ...newProject, is_electrical: e.target.checked })} className="rounded text-primary-600" />
                  <span>Electrical</span>
                </label>
                <label className="flex items-center gap-1">
                  <input type="checkbox" checked={newProject.is_vesda} onChange={e => setNewProject({ ...newProject, is_vesda: e.target.checked })} className="rounded text-red-600" />
                  <span>VESDA</span>
                </label>
                <label className="flex items-center gap-1">
                  <input type="checkbox" checked={newProject.is_aws} onChange={e => setNewProject({ ...newProject, is_aws: e.target.checked })} className="rounded text-purple-600" />
                  <span className="text-purple-700 font-medium">AWS</span>
                </label>
                <label className="flex items-center gap-1">
                  <input type="checkbox" checked={newProject.is_out_of_town} onChange={e => setNewProject({ ...newProject, is_out_of_town: e.target.checked })} className="rounded text-purple-600" />
                  <span className="text-purple-700 font-medium">Out of Town</span>
                </label>
                <label className="flex items-center gap-1">
                  <input type="checkbox" checked={newProject.manpower_allocated} onChange={e => setNewProject({ ...newProject, manpower_allocated: e.target.checked })} className="rounded text-green-600" />
                  <span className="text-green-700 font-medium">Manpower Allocated</span>
                </label>
              </div>

              {/* Row 5: BFPE Labor */}
              <div className="border rounded p-2 text-xs bg-blue-50">
                <div className="font-medium text-blue-700 mb-2">BFPE Labor (Headcount)</div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs text-gray-600">Sprinkler</label>
                    <input
                      type="number"
                      min="0"
                      value={newProject.bfpe_sprinkler_headcount || ''}
                      onChange={e => setNewProject({ ...newProject, bfpe_sprinkler_headcount: parseInt(e.target.value) || 0 })}
                      placeholder="0"
                      className="w-full px-2 py-1 border rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600">VESDA</label>
                    <input
                      type="number"
                      min="0"
                      value={newProject.bfpe_vesda_headcount || ''}
                      onChange={e => setNewProject({ ...newProject, bfpe_vesda_headcount: parseInt(e.target.value) || 0 })}
                      placeholder="0"
                      className="w-full px-2 py-1 border rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600">Electrical</label>
                    <input
                      type="number"
                      min="0"
                      value={newProject.bfpe_electrical_headcount || ''}
                      onChange={e => setNewProject({ ...newProject, bfpe_electrical_headcount: parseInt(e.target.value) || 0 })}
                      placeholder="0"
                      className="w-full px-2 py-1 border rounded text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Row 6: Subcontractors - Compact grid */}
              <div className="grid grid-cols-2 gap-2">
                {["Dynalectric", "Federal Fire", "Fuentes", "Power Solutions", "Power Plus"].map((subName) => {
                  const subIndex = newProject.subcontractors.findIndex(s => s.name === subName);
                  const isChecked = subIndex !== -1;
                  const sub = isChecked ? newProject.subcontractors[subIndex] : null;
                  return (
                    <div key={subName} className="border rounded p-2 text-xs">
                      <label className="flex items-center gap-1 font-medium text-purple-700">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={e => {
                            let updatedSubs = [...newProject.subcontractors];
                            if (e.target.checked) {
                              updatedSubs.push({ name: subName, sprinkler: { enabled: false, headcount: 0 }, vesda: { enabled: false, headcount: 0 }, electrical: { enabled: false, headcount: 0 } });
                            } else {
                              updatedSubs = updatedSubs.filter(s => s.name !== subName);
                            }
                            setNewProject({ ...newProject, subcontractors: updatedSubs });
                          }}
                          className="rounded text-purple-600"
                        />
                        {subName}
                      </label>
                      {isChecked && sub && (
                        <div className="mt-1 ml-4 space-y-1">
                          <div className="flex items-center gap-1">
                            <input type="checkbox" checked={sub.sprinkler.enabled} onChange={e => {
                              const updatedSubs = [...newProject.subcontractors];
                              updatedSubs[subIndex] = { ...sub, sprinkler: { ...sub.sprinkler, enabled: e.target.checked } };
                              setNewProject({ ...newProject, subcontractors: updatedSubs });
                            }} className="rounded" />
                            <span className="w-12">Sprinkler</span>
                            {sub.sprinkler.enabled && (
                              <input type="number" min="0" value={sub.sprinkler.headcount || ''} onChange={e => {
                                const updatedSubs = [...newProject.subcontractors];
                                updatedSubs[subIndex] = { ...sub, sprinkler: { ...sub.sprinkler, headcount: parseInt(e.target.value) || 0 } };
                                setNewProject({ ...newProject, subcontractors: updatedSubs });
                              }} placeholder="#" className="w-12 px-1 py-0.5 border rounded text-xs" />
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <input type="checkbox" checked={sub.vesda.enabled} onChange={e => {
                              const updatedSubs = [...newProject.subcontractors];
                              updatedSubs[subIndex] = { ...sub, vesda: { ...sub.vesda, enabled: e.target.checked } };
                              setNewProject({ ...newProject, subcontractors: updatedSubs });
                            }} className="rounded" />
                            <span className="w-12">VESDA</span>
                            {sub.vesda.enabled && (
                              <input type="number" min="0" value={sub.vesda.headcount || ''} onChange={e => {
                                const updatedSubs = [...newProject.subcontractors];
                                updatedSubs[subIndex] = { ...sub, vesda: { ...sub.vesda, headcount: parseInt(e.target.value) || 0 } };
                                setNewProject({ ...newProject, subcontractors: updatedSubs });
                              }} placeholder="#" className="w-12 px-1 py-0.5 border rounded text-xs" />
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <input type="checkbox" checked={sub.electrical.enabled} onChange={e => {
                              const updatedSubs = [...newProject.subcontractors];
                              updatedSubs[subIndex] = { ...sub, electrical: { ...sub.electrical, enabled: e.target.checked } };
                              setNewProject({ ...newProject, subcontractors: updatedSubs });
                            }} className="rounded" />
                            <span className="w-12">Electrical</span>
                            {sub.electrical.enabled && (
                              <input type="number" min="0" value={sub.electrical.headcount || ''} onChange={e => {
                                const updatedSubs = [...newProject.subcontractors];
                                updatedSubs[subIndex] = { ...sub, electrical: { ...sub.electrical, headcount: parseInt(e.target.value) || 0 } };
                                setNewProject({ ...newProject, subcontractors: updatedSubs });
                              }} placeholder="#" className="w-12 px-1 py-0.5 border rounded text-xs" />
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Foreman / PO Number */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700">Foreman</label>
                  <input
                    type="text"
                    value={newProject.foreman}
                    onChange={(e) => setNewProject({ ...newProject, foreman: e.target.value })}
                    className="input py-1 text-sm"
                    placeholder="Assigned foreman..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">PO Number</label>
                  <input
                    type="text"
                    value={newProject.po_number}
                    onChange={(e) => setNewProject({ ...newProject, po_number: e.target.value })}
                    className="input py-1 text-sm"
                    placeholder="PO #..."
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-medium text-gray-700">Notes</label>
                <textarea
                  value={newProject.notes}
                  onChange={(e) => setNewProject({ ...newProject, notes: e.target.value })}
                  className="input py-1 text-sm"
                  rows={1}
                  placeholder="Optional..."
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

      {/* Export Format Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Export Report</h3>
            <p className="text-sm text-gray-500 mb-5">Choose a format to download the Unallocated Manpower Report</p>
            <div className="space-y-3">
              <button
                onClick={() => handleExport('pdf')}
                disabled={exporting !== null}
                className="w-full flex items-center gap-3 px-4 py-3 border border-gray-200 rounded-lg hover:bg-red-50 hover:border-red-300 transition-colors disabled:opacity-50"
              >
                <span className="text-2xl">📄</span>
                <div className="text-left">
                  <div className="font-medium text-gray-900">PDF</div>
                  <div className="text-xs text-gray-500">Professional formatted report</div>
                </div>
                {exporting === 'pdf' && <span className="ml-auto text-sm text-gray-400">Downloading...</span>}
              </button>
              <button
                onClick={() => handleExport('docx')}
                disabled={exporting !== null}
                className="w-full flex items-center gap-3 px-4 py-3 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors disabled:opacity-50"
              >
                <span className="text-2xl">📝</span>
                <div className="text-left">
                  <div className="font-medium text-gray-900">Word Document (.docx)</div>
                  <div className="text-xs text-gray-500">Editable Word format</div>
                </div>
                {exporting === 'docx' && <span className="ml-auto text-sm text-gray-400">Downloading...</span>}
              </button>
              <button
                onClick={() => handleExport('excel')}
                disabled={exporting !== null}
                className="w-full flex items-center gap-3 px-4 py-3 border border-gray-200 rounded-lg hover:bg-green-50 hover:border-green-300 transition-colors disabled:opacity-50"
              >
                <span className="text-2xl">📊</span>
                <div className="text-left">
                  <div className="font-medium text-gray-900">Excel Spreadsheet (.xlsx)</div>
                  <div className="text-xs text-gray-500">Sortable spreadsheet format</div>
                </div>
                {exporting === 'excel' && <span className="ml-auto text-sm text-gray-400">Downloading...</span>}
              </button>
            </div>
            <button
              onClick={() => setShowExportModal(false)}
              className="mt-4 w-full text-sm text-gray-500 hover:text-gray-700 py-2"
            >
              Cancel
            </button>
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

      {/* Needs Manpower export button */}
      {statusFilter === 'needs_manpower' && (
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <p className="text-sm text-orange-700 font-medium">
              {sortedProjects.length} project{sortedProjects.length !== 1 ? 's' : ''} need manpower assigned
            </p>
            <div className="flex bg-gray-100 rounded-lg p-0.5">
              {(['all', 'active', 'prospective'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setManpowerStatusFilter(s)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${manpowerStatusFilter === s ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>
          {sortedProjects.length > 0 && (
            <button onClick={() => setShowExportModal(true)} className="btn btn-secondary">
              Export Report
            </button>
          )}
        </div>
      )}

      {/* Projects Table */}
      <div className="card">
        {sortedProjects.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">
              {statusFilter === 'needs_manpower'
                ? 'All projects have manpower assigned.'
                : `No ${statusFilter} projects found.`}
            </p>
            {statusFilter !== 'needs_manpower' && (
              <p className="text-sm text-gray-400 mt-2">Create a new project to get started.</p>
            )}
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
                <th className="text-right cursor-pointer hover:bg-gray-50" onClick={() => handleSort('required_manpower')}>
                  Men Required {sortConfig?.key === 'required_manpower' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="cursor-pointer hover:bg-gray-50" onClick={() => handleSort('status')}>
                  Status {sortConfig?.key === 'status' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                {statusFilter !== 'needs_manpower' && <th>Subcontractors</th>}
                {statusFilter === 'needs_manpower' && <th className="cursor-pointer hover:bg-gray-50" onClick={() => handleSort('start_date')}>Start Date {sortConfig?.key === 'start_date' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>}
                {statusFilter === 'needs_manpower' && <th className="text-center">Allocated</th>}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedProjects.map((project) => (
                <>
                <tr key={project.id} className="cursor-pointer hover:bg-gray-50" onClick={() => setExpandedRows(prev => { const s = new Set(prev); s.has(project.id) ? s.delete(project.id) : s.add(project.id); return s; })}>
                  <td className="font-medium text-gray-900">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="text-gray-400 text-xs">{expandedRows.has(project.id) ? '▼' : '▶'}</span>
                      {project.name}
                      {project.source === 'sharepoint' && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700 leading-none">
                          SP
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="text-gray-600">{project.customer_name || '—'}</td>
                  <td className="text-gray-600">{project.project_number || '—'}</td>
                  <td className="text-right font-medium">
                    {project.required_manpower || '—'}
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
                      {project.is_vesda && <span className="text-[10px] uppercase bg-red-100 text-red-800 px-1 rounded">VESDA</span>}
                    </div>
                  </td>
                  {statusFilter !== 'needs_manpower' && (
                    <td>
                      {project.subcontractors && project.subcontractors.length > 0 ? (
                        <div className="space-y-1">
                          {project.subcontractors.map((sub, idx) => (
                            <div key={idx} className="text-xs">
                              <span className="font-medium text-gray-700">{sub.subcontractor_name}</span>
                              <span className={`ml-1 px-1 rounded ${sub.labor_type === 'sprinkler' ? 'bg-blue-100 text-blue-700' : sub.labor_type === 'electrical' ? 'bg-yellow-100 text-yellow-700' : 'bg-purple-100 text-purple-700'}`}>
                                {sub.labor_type}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                  )}
                  {statusFilter === 'needs_manpower' && (
                    <td className="text-gray-600 text-sm">
                      {project.start_date ? new Date(project.start_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                    </td>
                  )}
                  {statusFilter === 'needs_manpower' && (
                    <td className="text-center">
                      <input
                        type="checkbox"
                        checked={project.manpower_allocated}
                        onChange={() => handleToggleAllocated(project)}
                        className="w-4 h-4 rounded text-green-600 cursor-pointer"
                        title="Check to mark manpower as covered"
                      />
                    </td>
                  )}
                  <td>
                    <div className="flex space-x-2" onClick={e => e.stopPropagation()}>
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
                {expandedRows.has(project.id) && (
                  <tr key={`${project.id}-detail`} className="bg-blue-50 border-t border-blue-100">
                    <td colSpan={99} className="px-6 py-3">
                      <div className="flex gap-8 text-sm">
                        <div>
                          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Foreman</span>
                          <p className="text-gray-900 font-medium">{project.foreman || <span className="text-gray-400 italic">Not assigned</span>}</p>
                        </div>
                        <div>
                          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">PO Number</span>
                          <p className="text-gray-900 font-medium">{project.po_number || <span className="text-gray-400 italic">None</span>}</p>
                        </div>
                        <div>
                          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Budgeted Hours</span>
                          <p className="text-gray-900 font-medium">{project.budgeted_hours ? `${project.budgeted_hours} hrs` : <span className="text-gray-400 italic">Not set</span>}</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
                </>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
