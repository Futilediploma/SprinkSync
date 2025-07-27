import { useQuery } from '@tanstack/react-query'
import { constructionApi } from '../services/api'
import { ClipboardCheck, AlertTriangle, CheckCircle, Plus } from 'lucide-react'

const Inspections = () => {
  const { data: inspectionsData, isLoading } = useQuery({
    queryKey: ['inspections'],
    queryFn: () => constructionApi.getInspections(),
  })

  const { data: upcomingData } = useQuery({
    queryKey: ['upcoming-inspections'],
    queryFn: () => constructionApi.getUpcomingInspections(),
  })

  const mockInspections = [
    {
      id: 1,
      inspection_type: 'Foundation',
      scheduled_date: '2024-01-20T09:00:00',
      completed_date: '2024-01-20T10:30:00',
      status: 'completed',
      result: 'passed',
      notes: 'Foundation meets all specifications',
      inspector: 'John Smith - City Building Dept'
    },
    {
      id: 2,
      inspection_type: 'Framing',
      scheduled_date: '2024-01-25T14:00:00',
      completed_date: null,
      status: 'scheduled',
      result: null,
      notes: null,
      inspector: 'Sarah Johnson - City Building Dept'
    }
  ]

  const mockUpcoming = {
    inspections: [
      { type: 'Foundation', date: '2024-01-22', inspector: 'City Building Dept', status: 'scheduled' },
      { type: 'Framing', date: '2024-02-05', inspector: 'City Building Dept', status: 'pending' },
      { type: 'Electrical Rough', date: '2024-02-12', inspector: 'Electrical Inspector', status: 'pending' },
      { type: 'Plumbing Rough', date: '2024-02-15', inspector: 'Plumbing Inspector', status: 'pending' }
    ]
  }

  const inspections = inspectionsData?.data || mockInspections
  const upcoming = upcomingData?.data || mockUpcoming

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'status-completed'
      case 'scheduled': return 'status-active'
      case 'pending': return 'status-pending'
      case 'failed': return 'status-overdue'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getResultColor = (result: string) => {
    switch (result) {
      case 'passed': return 'bg-green-100 text-green-800'
      case 'failed': return 'bg-red-100 text-red-800'
      case 'conditional': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return <div className="shimmer h-64 rounded-lg"></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Inspections</h2>
          <p className="text-gray-600 mt-1">Schedule and track construction inspections</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button className="btn-primary">
            <Plus className="w-5 h-5 mr-2" />
            Schedule Inspection
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Inspections */}
        <div className="construction-card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Inspections</h3>
          <div className="space-y-4">
            {upcoming.inspections.map((inspection: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 construction-gradient rounded-lg flex items-center justify-center">
                    <ClipboardCheck className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{inspection.type}</p>
                    <p className="text-sm text-gray-600">{inspection.inspector}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{inspection.date}</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(inspection.status)}`}>
                    {inspection.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Inspection History */}
        <div className="construction-card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Inspections</h3>
          <div className="space-y-4">
            {inspections.map((inspection: any) => (
              <div key={inspection.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      inspection.result === 'passed' ? 'bg-green-100 text-green-600' :
                      inspection.result === 'failed' ? 'bg-red-100 text-red-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {inspection.result === 'passed' ? <CheckCircle className="w-4 h-4" /> :
                       inspection.result === 'failed' ? <AlertTriangle className="w-4 h-4" /> :
                       <ClipboardCheck className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{inspection.inspection_type}</p>
                      <p className="text-sm text-gray-600">{inspection.inspector}</p>
                    </div>
                  </div>
                  {inspection.result && (
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getResultColor(inspection.result)}`}>
                      {inspection.result}
                    </span>
                  )}
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>Scheduled: {new Date(inspection.scheduled_date).toLocaleDateString()}</p>
                  {inspection.completed_date && (
                    <p>Completed: {new Date(inspection.completed_date).toLocaleDateString()}</p>
                  )}
                  {inspection.notes && (
                    <p className="text-gray-900 mt-2">{inspection.notes}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Inspection Summary */}
      <div className="construction-card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Inspection Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">12</p>
            <p className="text-sm text-green-800">Passed</p>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <p className="text-2xl font-bold text-red-600">1</p>
            <p className="text-sm text-red-800">Failed</p>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <p className="text-2xl font-bold text-yellow-600">2</p>
            <p className="text-sm text-yellow-800">Conditional</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">4</p>
            <p className="text-sm text-blue-800">Scheduled</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Inspections
