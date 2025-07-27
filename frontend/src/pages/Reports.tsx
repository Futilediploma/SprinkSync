import { useQuery } from '@tanstack/react-query'
import { constructionApi } from '../services/api'
import { BarChart3, FileText, TrendingUp, Download } from 'lucide-react'

const Reports = () => {
  const { data: reportsData, isLoading } = useQuery({
    queryKey: ['reports'],
    queryFn: () => constructionApi.getReports(),
  })

  const mockReports = {
    available_reports: [
      { name: 'Project Status', type: 'dashboard', last_generated: '2024-01-18' },
      { name: 'Cost Analysis', type: 'financial', last_generated: '2024-01-17' },
      { name: 'Schedule Performance', type: 'timeline', last_generated: '2024-01-18' },
      { name: 'Safety Report', type: 'safety', last_generated: '2024-01-15' },
      { name: 'Quality Control', type: 'quality', last_generated: '2024-01-16' }
    ]
  }

  const reports = reportsData?.data || mockReports

  const getReportIcon = (type: string) => {
    switch (type) {
      case 'dashboard': return BarChart3
      case 'financial': return TrendingUp
      case 'timeline': return FileText
      default: return FileText
    }
  }

  if (isLoading) {
    return <div className="shimmer h-64 rounded-lg"></div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Reports & Analytics</h2>
        <p className="text-gray-600 mt-1">Generate and download project reports</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.available_reports.map((report: any, index: number) => {
          const IconComponent = getReportIcon(report.type)
          return (
            <div key={index} className="construction-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 construction-gradient rounded-lg flex items-center justify-center">
                  <IconComponent className="w-6 h-6 text-white" />
                </div>
                <button className="p-2 text-gray-400 hover:text-construction-600 transition-colors">
                  <Download className="w-5 h-5" />
                </button>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{report.name}</h3>
              <p className="text-sm text-gray-600 mb-4">
                Last generated: {report.last_generated}
              </p>
              <button className="w-full btn-secondary text-sm">
                Generate Report
              </button>
            </div>
          )
        })}
      </div>

      <div className="construction-card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Analytics</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">85%</p>
            <p className="text-sm text-blue-800">Schedule Performance</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">92%</p>
            <p className="text-sm text-green-800">Quality Score</p>
          </div>
          <div className="text-center p-4 bg-construction-50 rounded-lg">
            <p className="text-2xl font-bold text-construction-600">$1.2M</p>
            <p className="text-sm text-construction-800">Budget Remaining</p>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <p className="text-2xl font-bold text-yellow-600">45</p>
            <p className="text-sm text-yellow-800">Days to Completion</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Reports
