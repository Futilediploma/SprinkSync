import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { projectsApi, schedulesApi, phasesApi, crewTypesApi } from '../api'
import type { Project, ProjectSchedule, SchedulePhase, CrewType } from '../types'

export default function ScheduleEditor() {
  const { id } = useParams<{ id: string }>()
  const projectId = parseInt(id!)

  const [project, setProject] = useState<Project | null>(null)
  const [schedule, setSchedule] = useState<ProjectSchedule | null>(null)
  const [crewTypes, setCrewTypes] = useState<CrewType[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateSchedule, setShowCreateSchedule] = useState(false)
  const [newScheduleDates, setNewScheduleDates] = useState({
    start_date: '',
    end_date: ''
  })
  const [showCreatePhase, setShowCreatePhase] = useState(false)
  const [editingPhaseId, setEditingPhaseId] = useState<number | null>(null)

  const [newPhase, setNewPhase] = useState({
    phase_name: '',
    start_date: '',
    end_date: '',
    estimated_man_hours: '',
    crew_size: '',
    crew_type_id: '',
    notes: ''
  })

  const [editPhase, setEditPhase] = useState({
    phase_name: '',
    start_date: '',
    end_date: '',
    estimated_man_hours: '',
    crew_size: '',
    crew_type_id: '',
    notes: ''
  })

  useEffect(() => {
    loadData()
  }, [projectId])

  const loadData = async () => {
    try {
      setLoading(true)
      const [projectRes, crewTypesRes] = await Promise.all([
        projectsApi.get(projectId),
        crewTypesApi.list()
      ])

      setProject(projectRes.data)
      setCrewTypes(crewTypesRes.data)

      // Try to load schedule
      try {
        const scheduleRes = await projectsApi.getSchedule(projectId)
        setSchedule(scheduleRes.data)
      } catch (error) {
        // No schedule exists yet
        setSchedule(null)
      }
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newScheduleDates.start_date || !newScheduleDates.end_date) return

    try {
      await projectsApi.createSchedule(projectId, {
        start_date: newScheduleDates.start_date,
        end_date: newScheduleDates.end_date,
        schedule_name: 'Main Schedule'
      })
      setShowCreateSchedule(false)
      loadData()
    } catch (error) {
      console.error('Failed to create schedule:', error)
      alert('Failed to create schedule')
    }
  }

  const handleAddPhase = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!schedule) return

    try {
      await schedulesApi.createPhase(schedule.id, {
        phase_name: newPhase.phase_name,
        start_date: newPhase.start_date,
        end_date: newPhase.end_date,
        estimated_man_hours: newPhase.estimated_man_hours ? parseFloat(newPhase.estimated_man_hours) : undefined,
        crew_size: newPhase.crew_size ? parseFloat(newPhase.crew_size) : undefined,
        crew_type_id: newPhase.crew_type_id ? parseInt(newPhase.crew_type_id) : undefined,
        notes: newPhase.notes || undefined
      })

      setNewPhase({
        phase_name: '',
        start_date: '',
        end_date: '',
        estimated_man_hours: '',
        crew_size: '',
        crew_type_id: '',
        notes: ''
      })
      setShowCreatePhase(false)
      loadData()
    } catch (error) {
      console.error('Failed to add phase:', error)
      alert('Failed to add phase. Make sure to provide either man-hours or crew size.')
    }
  }

  const handleDeletePhase = async (phaseId: number) => {
    if (!confirm('Delete this phase?')) return

    try {
      await phasesApi.delete(phaseId)
      loadData()
    } catch (error) {
      console.error('Failed to delete phase:', error)
      alert('Failed to delete phase')
    }
  }

  const handleEditPhase = (phase: SchedulePhase) => {
    setEditingPhaseId(phase.id)
    setEditPhase({
      phase_name: phase.phase_name,
      start_date: phase.start_date,
      end_date: phase.end_date,
      estimated_man_hours: phase.estimated_man_hours?.toString() || '',
      crew_size: phase.crew_size?.toString() || '',
      crew_type_id: phase.crew_type_id?.toString() || '',
      notes: phase.notes || ''
    })
  }

  const handleUpdatePhase = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingPhaseId) return

    try {
      await phasesApi.update(editingPhaseId, {
        phase_name: editPhase.phase_name,
        start_date: editPhase.start_date,
        end_date: editPhase.end_date,
        estimated_man_hours: editPhase.estimated_man_hours ? parseFloat(editPhase.estimated_man_hours) : undefined,
        crew_size: editPhase.crew_size ? parseFloat(editPhase.crew_size) : undefined,
        crew_type_id: editPhase.crew_type_id ? parseInt(editPhase.crew_type_id) : undefined,
        notes: editPhase.notes || undefined
      })

      setEditingPhaseId(null)
      setEditPhase({
        phase_name: '',
        start_date: '',
        end_date: '',
        estimated_man_hours: '',
        crew_size: '',
        crew_type_id: '',
        notes: ''
      })
      loadData()
    } catch (error) {
      console.error('Failed to update phase:', error)
      alert('Failed to update phase. Make sure to provide either man-hours or crew size.')
    }
  }

  const handleCancelEdit = () => {
    setEditingPhaseId(null)
    setEditPhase({
      phase_name: '',
      start_date: '',
      end_date: '',
      estimated_man_hours: '',
      crew_size: '',
      crew_type_id: '',
      notes: ''
    })
  }

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  if (!project) {
    return <div className="text-center py-12">Project not found</div>
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-gray-600">
        <Link to="/" className="hover:text-primary-600">Projects</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{project.name}</span>
        <span>/</span>
        <span className="text-gray-900 font-medium">Schedule</span>
      </div>

      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{project.name}</h2>
          <p className="mt-1 text-sm text-gray-600">
            {project.customer_name && `Customer: ${project.customer_name}`}
          </p>
        </div>
        {schedule && (
          <Link
            to={`/projects/${projectId}/forecast`}
            className="btn btn-primary"
          >
            View Forecast →
          </Link>
        )}
      </div>

      {/* Schedule Info or Create */}
      {!schedule ? (
        <>
          <div className="card text-center py-12">
            <p className="text-gray-600 mb-4">No schedule created yet.</p>
            <button onClick={() => setShowCreateSchedule(true)} className="btn btn-primary">
              Create Schedule
            </button>
          </div>

          {/* Create Schedule Modal */}
          {showCreateSchedule && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h3 className="text-lg font-bold mb-4">Create Project Schedule</h3>
                <form onSubmit={handleCreateSchedule} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={newScheduleDates.start_date}
                      onChange={(e) => setNewScheduleDates({ ...newScheduleDates, start_date: e.target.value })}
                      className="input"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={newScheduleDates.end_date}
                      onChange={(e) => setNewScheduleDates({ ...newScheduleDates, end_date: e.target.value })}
                      className="input"
                      required
                    />
                  </div>
                  <div className="flex space-x-3">
                    <button type="submit" className="btn btn-primary flex-1">
                      Create
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCreateSchedule(false)}
                      className="btn btn-secondary flex-1"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Schedule Header */}
          <div className="card">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Schedule Name</label>
                <p className="mt-1 text-lg font-semibold">{schedule.schedule_name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Date Range</label>
                <p className="mt-1 text-lg font-semibold">
                  {schedule.start_date} to {schedule.end_date}
                </p>
              </div>
            </div>
          </div>

          {/* Phases */}
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Schedule Phases</h3>
              <button
                onClick={() => setShowCreatePhase(true)}
                className="btn btn-primary"
              >
                + Add Phase
              </button>
            </div>

            {/* Create Phase Form */}
            {showCreatePhase && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-bold mb-3">New Phase</h4>
                <form onSubmit={handleAddPhase} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phase Name *
                      </label>
                      <input
                        type="text"
                        value={newPhase.phase_name}
                        onChange={(e) => setNewPhase({ ...newPhase, phase_name: e.target.value })}
                        className="input"
                        placeholder="e.g., Underground, Rough-In"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Crew Type
                      </label>
                      <select
                        value={newPhase.crew_type_id}
                        onChange={(e) => setNewPhase({ ...newPhase, crew_type_id: e.target.value })}
                        className="input"
                      >
                        <option value="">None</option>
                        {crewTypes.map((ct) => (
                          <option key={ct.id} value={ct.id}>{ct.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Date *
                      </label>
                      <input
                        type="date"
                        value={newPhase.start_date}
                        onChange={(e) => setNewPhase({ ...newPhase, start_date: e.target.value })}
                        className="input"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Date *
                      </label>
                      <input
                        type="date"
                        value={newPhase.end_date}
                        onChange={(e) => setNewPhase({ ...newPhase, end_date: e.target.value })}
                        className="input"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Total Man-Hours
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={newPhase.estimated_man_hours}
                        onChange={(e) => setNewPhase({ ...newPhase, estimated_man_hours: e.target.value })}
                        className="input"
                        placeholder="e.g., 640"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        OR Crew Size
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={newPhase.crew_size}
                        onChange={(e) => setNewPhase({ ...newPhase, crew_size: e.target.value })}
                        className="input"
                        placeholder="e.g., 3.5"
                      />
                    </div>
                  </div>
                  <div className="flex space-x-3">
                    <button type="submit" className="btn btn-primary">
                      Add Phase
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCreatePhase(false)}
                      className="btn btn-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Edit Phase Form */}
            {editingPhaseId && (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-bold mb-3">Edit Phase</h4>
                <form onSubmit={handleUpdatePhase} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phase Name *
                      </label>
                      <input
                        type="text"
                        value={editPhase.phase_name}
                        onChange={(e) => setEditPhase({ ...editPhase, phase_name: e.target.value })}
                        className="input"
                        placeholder="e.g., Underground, Rough-In"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Crew Type
                      </label>
                      <select
                        value={editPhase.crew_type_id}
                        onChange={(e) => setEditPhase({ ...editPhase, crew_type_id: e.target.value })}
                        className="input"
                      >
                        <option value="">None</option>
                        {crewTypes.map((ct) => (
                          <option key={ct.id} value={ct.id}>{ct.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Date *
                      </label>
                      <input
                        type="date"
                        value={editPhase.start_date}
                        onChange={(e) => setEditPhase({ ...editPhase, start_date: e.target.value })}
                        className="input"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Date *
                      </label>
                      <input
                        type="date"
                        value={editPhase.end_date}
                        onChange={(e) => setEditPhase({ ...editPhase, end_date: e.target.value })}
                        className="input"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Total Man-Hours
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={editPhase.estimated_man_hours}
                        onChange={(e) => setEditPhase({ ...editPhase, estimated_man_hours: e.target.value })}
                        className="input"
                        placeholder="e.g., 640"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        OR Crew Size
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={editPhase.crew_size}
                        onChange={(e) => setEditPhase({ ...editPhase, crew_size: e.target.value })}
                        className="input"
                        placeholder="e.g., 3.5"
                      />
                    </div>
                  </div>
                  <div className="flex space-x-3">
                    <button type="submit" className="btn btn-primary">
                      Update Phase
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="btn btn-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Phases Table */}
            {schedule.phases.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No phases added yet. Click "Add Phase" to get started.
              </div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Phase Name</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Man-Hours</th>
                    <th>Crew Size</th>
                    <th>Crew Type</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {schedule.phases.map((phase) => (
                    <tr key={phase.id}>
                      <td className="font-medium">{phase.phase_name}</td>
                      <td>{phase.start_date}</td>
                      <td>{phase.end_date}</td>
                      <td>{phase.estimated_man_hours || '—'}</td>
                      <td>{phase.crew_size || '—'}</td>
                      <td>{phase.crew_type?.name || '—'}</td>
                      <td>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditPhase(phase)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeletePhase(phase.id)}
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
        </>
      )}
    </div>
  )
}
