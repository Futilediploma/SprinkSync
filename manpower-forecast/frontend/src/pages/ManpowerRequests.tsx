import { useEffect, useMemo, useState } from 'react'
import { employeesApi, manpowerRequestsApi, projectsApi } from '../api'
import type { Employee, ManpowerRequest, Project } from '../types'
import { getErrorMessage } from '../types'

type FormState = {
  id: number | null
  project_id: string
  superintendent_id: string
  pm_id: string
  foreman_id: string
  manpower_required: string
  requested_trades: string
  start_datetime: string
  expected_duration: string
  notes: string
}

const emptyForm: FormState = {
  id: null,
  project_id: '',
  superintendent_id: '',
  pm_id: '',
  foreman_id: '',
  manpower_required: '',
  requested_trades: '',
  start_datetime: '',
  expected_duration: '',
  notes: '',
}

export default function ManpowerRequests() {
  const [projects, setProjects] = useState<Project[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [requests, setRequests] = useState<ManpowerRequest[]>([])
  const [form, setForm] = useState<FormState>(emptyForm)
  const [employeeForm, setEmployeeForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'superintendent',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [projectResponse, employeeResponse, requestResponse] = await Promise.all([
        projectsApi.list(),
        employeesApi.list({ active: true }),
        manpowerRequestsApi.list(),
      ])
      setProjects(projectResponse.data)
      setEmployees(employeeResponse.data)
      setRequests(requestResponse.data)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const superintendents = useMemo(
    () => employees.filter(e => e.role === 'superintendent' || e.role === 'pm' || e.role === 'foreman' || e.role === 'other'),
    [employees]
  )
  const pms = useMemo(() => employees.filter(e => e.role === 'pm' || e.role === 'other'), [employees])
  const foremen = useMemo(() => employees.filter(e => e.role === 'foreman' || e.role === 'other'), [employees])

  const selectedProject = projects.find(p => p.id === Number(form.project_id))

  const handleProjectChange = (projectId: string) => {
    const project = projects.find(p => p.id === Number(projectId))
    setForm({
      ...form,
      project_id: projectId,
      superintendent_id: project?.superintendent_id?.toString() || '',
      pm_id: project?.pm_id?.toString() || '',
    })
  }

  const resetForm = () => setForm(emptyForm)

  const handleCreateEmployee = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await employeesApi.create({
        ...employeeForm,
        active: true,
      })
      setEmployeeForm({ name: '', email: '', phone: '', role: 'superintendent' })
      await loadData()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setError(null)

    const payload = {
      project_id: Number(form.project_id),
      superintendent_id: form.superintendent_id ? Number(form.superintendent_id) : null,
      pm_id: form.pm_id ? Number(form.pm_id) : null,
      foreman_id: form.foreman_id ? Number(form.foreman_id) : null,
      manpower_required: form.manpower_required,
      requested_trades: form.requested_trades,
      start_datetime: toApiDatetime(form.start_datetime),
      expected_duration: form.expected_duration,
      notes: form.notes,
    }

    try {
      if (form.id) {
        await manpowerRequestsApi.update(form.id, payload)
      } else {
        await manpowerRequestsApi.create(payload)
      }
      resetForm()
      await loadData()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (request: ManpowerRequest) => {
    const project = request.project || projects.find(p => p.id === request.project_id)
    setForm({
      id: request.id,
      project_id: request.project_id.toString(),
      superintendent_id: project?.superintendent_id?.toString() || '',
      pm_id: project?.pm_id?.toString() || '',
      foreman_id: request.foreman_id?.toString() || '',
      manpower_required: request.manpower_required,
      requested_trades: request.requested_trades,
      start_datetime: toDateInput(request.start_datetime),
      expected_duration: request.expected_duration,
      notes: request.notes || '',
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (loading) {
    return <div className="text-center py-12">Loading manpower requests...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Manpower Requests</h2>
          <p className="text-sm text-gray-500 mt-1">Send internal superintendent manpower notifications.</p>
        </div>
        <button onClick={loadData} className="btn btn-secondary">Refresh</button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {form.id ? 'Update Manpower Request' : 'New Manpower Request'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="block">
              <span className="block text-sm font-medium text-gray-700 mb-1">Project</span>
              <select
                value={form.project_id}
                onChange={(e) => handleProjectChange(e.target.value)}
                className="input"
                required
              >
                <option value="">Select project...</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="block text-sm font-medium text-gray-700 mb-1">Superintendent</span>
              <select
                value={form.superintendent_id}
                onChange={(e) => setForm({ ...form, superintendent_id: e.target.value })}
                className="input"
                required
              >
                <option value="">Select superintendent...</option>
                {superintendents.map(employee => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name} ({employee.email})
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="block text-sm font-medium text-gray-700 mb-1">PM</span>
              <select
                value={form.pm_id}
                onChange={(e) => setForm({ ...form, pm_id: e.target.value })}
                className="input"
              >
                <option value="">No PM notification</option>
                {pms.map(employee => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name} ({employee.email})
                  </option>
                ))}
              </select>
            </label>
          </div>

          {selectedProject && (
            <div className="bg-gray-50 border border-gray-200 rounded p-3 text-sm text-gray-700">
              <span className="font-medium">GC:</span> {selectedProject.customer_name || 'Not set'}
              <span className="mx-2 text-gray-300">|</span>
              <span className="font-medium">Address:</span> {selectedProject.address || 'Not set'}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <label className="block">
              <span className="block text-sm font-medium text-gray-700 mb-1">Manpower Required</span>
              <input
                value={form.manpower_required}
                onChange={(e) => setForm({ ...form, manpower_required: e.target.value })}
                className="input"
                placeholder="4 Fitters, 1 Apprentice"
                required
              />
            </label>

            <label className="block">
              <span className="block text-sm font-medium text-gray-700 mb-1">Requested Trades</span>
              <input
                value={form.requested_trades}
                onChange={(e) => setForm({ ...form, requested_trades: e.target.value })}
                className="input"
                placeholder="Sprinkler Fitters"
                required
              />
            </label>

            <label className="block">
              <span className="block text-sm font-medium text-gray-700 mb-1">Start Date</span>
              <input
                type="date"
                value={form.start_datetime}
                onChange={(e) => setForm({ ...form, start_datetime: e.target.value })}
                className="input"
                required
              />
            </label>

            <label className="block">
              <span className="block text-sm font-medium text-gray-700 mb-1">Duration</span>
              <input
                value={form.expected_duration}
                onChange={(e) => setForm({ ...form, expected_duration: e.target.value })}
                className="input"
                placeholder="2 weeks"
                required
              />
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="block">
              <span className="block text-sm font-medium text-gray-700 mb-1">Foreman</span>
              <select
                value={form.foreman_id}
                onChange={(e) => setForm({ ...form, foreman_id: e.target.value })}
                className="input"
              >
                <option value="">No foreman notification</option>
                {foremen.map(employee => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name} ({employee.email})
                  </option>
                ))}
              </select>
            </label>

            <label className="block md:col-span-2">
              <span className="block text-sm font-medium text-gray-700 mb-1">Notes / Comments</span>
              <input
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="input"
                placeholder="Begin rough-in on Level 2"
              />
            </label>
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="btn btn-primary">
              {saving ? 'Saving...' : form.id ? 'Update and Notify' : 'Create and Notify'}
            </button>
            {form.id && (
              <button type="button" onClick={resetForm} className="btn btn-secondary">
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Employee Contacts</h3>
        <form onSubmit={handleCreateEmployee} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
          <label className="block">
            <span className="block text-sm font-medium text-gray-700 mb-1">Name</span>
            <input
              value={employeeForm.name}
              onChange={(e) => setEmployeeForm({ ...employeeForm, name: e.target.value })}
              className="input"
              required
            />
          </label>
          <label className="block">
            <span className="block text-sm font-medium text-gray-700 mb-1">Email</span>
            <input
              type="email"
              value={employeeForm.email}
              onChange={(e) => setEmployeeForm({ ...employeeForm, email: e.target.value })}
              className="input"
              required
            />
          </label>
          <label className="block">
            <span className="block text-sm font-medium text-gray-700 mb-1">Phone</span>
            <input
              value={employeeForm.phone}
              onChange={(e) => setEmployeeForm({ ...employeeForm, phone: e.target.value })}
              className="input"
            />
          </label>
          <label className="block">
            <span className="block text-sm font-medium text-gray-700 mb-1">Role</span>
            <select
              value={employeeForm.role}
              onChange={(e) => setEmployeeForm({ ...employeeForm, role: e.target.value })}
              className="input"
            >
              <option value="superintendent">Superintendent</option>
              <option value="pm">PM</option>
              <option value="foreman">Foreman</option>
              <option value="office">Office</option>
              <option value="other">Other</option>
            </select>
          </label>
          <button type="submit" disabled={saving} className="btn btn-secondary">
            Add Contact
          </button>
        </form>
        {employees.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {employees.map(employee => (
              <span key={employee.id} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                {employee.name} - {employee.role}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification History</h3>
        {requests.length === 0 ? (
          <div className="text-center py-10 text-gray-500">No manpower requests yet.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Project</th>
                <th>Manpower</th>
                <th>Start</th>
                <th>Notifications</th>
                <th>Last Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map(request => {
                const latestNotification = [...(request.notifications || [])].sort((a, b) => b.id - a.id)[0]
                return (
                  <tr key={request.id}>
                    <td>
                      <div className="font-medium text-gray-900">{request.project?.name || `Project #${request.project_id}`}</div>
                      <div className="text-xs text-gray-500">{request.project?.customer_name || 'GC not set'}</div>
                    </td>
                    <td>
                      <div className="text-sm text-gray-900">{request.manpower_required}</div>
                      <div className="text-xs text-gray-500">{request.requested_trades}</div>
                    </td>
                    <td className="text-sm text-gray-600">{formatDate(request.start_datetime)}</td>
                    <td>
                      <div className="space-y-1">
                        {(request.notifications || []).map(notification => (
                          <div key={notification.id} className="text-xs">
                            <span className={`inline-flex px-2 py-0.5 rounded-full font-medium ${statusClass(notification.status)}`}>
                              {notification.status}
                            </span>
                            <span className="ml-2 text-gray-600">{notification.recipient_email}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="text-sm text-gray-600">
                      {latestNotification ? (
                        <>
                          <div>{latestNotification.sent_at ? formatDateTime(latestNotification.sent_at) : latestNotification.status}</div>
                          {latestNotification.error_message && (
                            <div className="text-xs text-red-600 max-w-xs truncate">{latestNotification.error_message}</div>
                          )}
                        </>
                      ) : (
                        'No notifications'
                      )}
                    </td>
                    <td>
                      <button onClick={() => handleEdit(request)} className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                        Edit
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function toDateInput(value: string) {
  if (!value) return ''
  return value.slice(0, 10)
}

function toApiDatetime(value: string) {
  if (!value) return value
  return value.length === 10 ? `${value}T00:00:00` : value
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function statusClass(status: string) {
  if (status === 'sent') return 'bg-green-100 text-green-800'
  if (status === 'failed') return 'bg-red-100 text-red-800'
  return 'bg-yellow-100 text-yellow-800'
}
