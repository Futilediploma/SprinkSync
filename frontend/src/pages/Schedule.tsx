import { useQuery } from '@tanstack/react-query'
import { constructionApi } from '../services/api'
import { Calendar, Clock, Users, Filter, Plus } from 'lucide-react'

const Schedule = () => {
  const { data: tasksData, isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => constructionApi.getTasks(),
  })

  // Empty state - no mock data
  const tasks = tasksData?.data || []

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'status-completed'
      case 'in_progress': return 'status-active'
      case 'scheduled': return 'status-pending'
      case 'overdue': return 'status-overdue'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="shimmer h-12 rounded-lg"></div>
        <div className="shimmer h-64 rounded-lg"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Schedule Management</h2>
          <p className="text-gray-600 mt-1">Track project timelines and task dependencies</p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button className="btn-secondary">
            <Calendar className="w-4 h-4 mr-2" />
            Gantt View
          </button>
          <button className="btn-primary">
            <Plus className="w-5 h-5 mr-2" />
            New Task
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="construction-card p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="flex items-center space-x-4">
            <select className="form-input w-48">
              <option>All Projects</option>
              <option>Downtown Office Complex</option>
              <option>Residential Tower A</option>
            </select>
            <select className="form-input w-40">
              <option>All Status</option>
              <option>Completed</option>
              <option>In Progress</option>
              <option>Scheduled</option>
            </select>
            <button className="btn-secondary">
              <Filter className="w-4 h-4 mr-2" />
              More Filters
            </button>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span>Total: {tasks.length} tasks</span>
          </div>
        </div>
      </div>

      {/* Tasks Table */}
      <div className="construction-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Task Name</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Assigned To</th>
                <th>Duration</th>
                <th>Progress</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task: any) => (
                <tr key={task.id}>
                  <td>
                    <div>
                      <div className="font-medium text-gray-900">{task.name}</div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">{task.description}</div>
                    </div>
                  </td>
                  <td>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                      {task.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    <span className={`px-2 py-1 rounded text-xs font-medium border ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-2 text-gray-400" />
                      <span className="text-sm">{task.assigned_to}</span>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-2 text-gray-400" />
                      <span className="text-sm">{task.duration_days} days</span>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${task.progress}%`,
                            background: task.progress === 100 ? '#10b981' : 
                                      task.progress > 50 ? '#3b82f6' : '#f59e0b'
                          }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{task.progress}%</span>
                    </div>
                  </td>
                  <td>
                    <span className="text-sm text-gray-900">{task.start_date}</span>
                  </td>
                  <td>
                    <span className="text-sm text-gray-900">{task.end_date}</span>
                  </td>
                  <td>
                    <button className="text-construction-600 hover:text-construction-700 text-sm font-medium">
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Timeline View */}
      <div className="construction-card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Timeline Overview</h3>
        <div className="space-y-4">
          {tasks.slice(0, 4).map((task: any, index: number) => (
            <div key={task.id} className="relative">
              <div className="flex items-center space-x-4">
                <div className={`w-3 h-3 rounded-full ${
                  task.status === 'completed' ? 'bg-green-500' :
                  task.status === 'in_progress' ? 'bg-blue-500' :
                  'bg-gray-300'
                }`}></div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">{task.name}</span>
                    <span className="text-sm text-gray-500">{task.start_date} - {task.end_date}</span>
                  </div>
                  <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full bg-construction-gradient transition-all duration-300"
                      style={{ width: `${task.progress}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              {index < tasks.length - 1 && (
                <div className="absolute left-1.5 top-6 w-0.5 h-8 bg-gray-200"></div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Schedule
