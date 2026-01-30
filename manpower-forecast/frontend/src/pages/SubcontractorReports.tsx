import { useState, useEffect } from 'react'
import { subcontractorReportsApi, SubcontractorReport } from '../api'
import { format } from 'date-fns'

const SUBCONTRACTORS = ['Dynalectric', 'Fuentes', 'Power Solutions', 'Power Plus']

export default function SubcontractorReports() {
  const [selectedSub, setSelectedSub] = useState<string>('')
  const [report, setReport] = useState<SubcontractorReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')

  useEffect(() => {
    if (selectedSub) {
      loadReport()
    }
  }, [selectedSub, startDate, endDate])

  const loadReport = async () => {
    if (!selectedSub) return

    try {
      setLoading(true)
      const response = await subcontractorReportsApi.getReport(
        selectedSub,
        startDate || undefined,
        endDate || undefined
      )
      setReport(response.data)
    } catch (error) {
      console.error('Failed to load report:', error)
      setReport(null)
    } finally {
      setLoading(false)
    }
  }

  const handleExportPdf = async () => {
    if (!selectedSub) return

    try {
      const response = await subcontractorReportsApi.exportPdf(
        selectedSub,
        startDate || undefined,
        endDate || undefined
      )
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `${selectedSub.replace(' ', '_')}_labor_report.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      console.error('Failed to export PDF:', error)
      alert('Failed to export PDF')
    }
  }

  const clearFilters = () => {
    setStartDate('')
    setEndDate('')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Subcontractor Reports</h2>
        <p className="mt-1 text-sm text-gray-600">
          View labor assigned to subcontractors across all projects
        </p>
      </div>

      {/* Filters */}
      <div className="card">
        <h3 className="text-lg font-bold mb-4">Select Subcontractor</h3>

        {/* Subcontractor Selection */}
        <div className="flex flex-wrap gap-2 mb-4">
          {SUBCONTRACTORS.map((sub) => (
            <button
              key={sub}
              onClick={() => setSelectedSub(sub)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                selectedSub === sub
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {sub}
            </button>
          ))}
        </div>

        {/* Date Range Filters */}
        <div className="grid grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date (Optional)
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date (Optional)
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input"
            />
          </div>
          <div>
            <button
              onClick={clearFilters}
              className="btn btn-secondary"
            >
              Clear Dates
            </button>
          </div>
        </div>
      </div>

      {/* No Selection */}
      {!selectedSub && (
        <div className="card text-center py-12 text-gray-500">
          Select a subcontractor above to view their labor report
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="card text-center py-12">Loading report...</div>
      )}

      {/* Report Display */}
      {selectedSub && !loading && report && (
        <>
          {/* Summary Card */}
          <div className="card">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{report.subcontractor_name}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {report.projects.length} project{report.projects.length !== 1 ? 's' : ''} assigned
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Total Man-Hours</p>
                <p className="text-3xl font-bold text-primary-600">
                  {Number(report.total_man_hours).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Export Button */}
          <div className="flex justify-end">
            <button
              onClick={handleExportPdf}
              className="btn btn-primary"
            >
              Export PDF Report
            </button>
          </div>

          {/* Projects Table */}
          {report.projects.length > 0 ? (
            <div className="card">
              <h3 className="text-lg font-bold mb-4">Assigned Projects & Phases</h3>
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Project</th>
                      <th>Project #</th>
                      <th>Labor Type</th>
                      <th>Phase</th>
                      <th>Start</th>
                      <th>End</th>
                      <th className="text-right">Man-Hours</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.projects.map((project) => (
                      project.phases.length > 0 ? (
                        project.phases.map((phase, idx) => (
                          <tr key={`${project.project_id}-${idx}`}>
                            {idx === 0 && (
                              <>
                                <td rowSpan={project.phases.length} className="font-medium align-top">
                                  {project.project_name}
                                </td>
                                <td rowSpan={project.phases.length} className="align-top">
                                  {project.project_number || '-'}
                                </td>
                                <td rowSpan={project.phases.length} className="align-top">
                                  <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                                    project.labor_type === 'sprinkler'
                                      ? 'bg-blue-100 text-blue-800'
                                      : project.labor_type === 'electrical'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-purple-100 text-purple-800'
                                  }`}>
                                    {project.labor_type.charAt(0).toUpperCase() + project.labor_type.slice(1)}
                                  </span>
                                </td>
                              </>
                            )}
                            <td>{phase.phase_name}</td>
                            <td>{format(new Date(phase.start_date), 'MMM d, yyyy')}</td>
                            <td>{format(new Date(phase.end_date), 'MMM d, yyyy')}</td>
                            <td className="text-right font-semibold">
                              {Number(phase.man_hours).toLocaleString()}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr key={project.project_id}>
                          <td className="font-medium">{project.project_name}</td>
                          <td>{project.project_number || '-'}</td>
                          <td>
                            <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                              project.labor_type === 'sprinkler'
                                ? 'bg-blue-100 text-blue-800'
                                : project.labor_type === 'electrical'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-purple-100 text-purple-800'
                            }`}>
                              {project.labor_type.charAt(0).toUpperCase() + project.labor_type.slice(1)}
                            </span>
                          </td>
                          <td colSpan={3} className="text-gray-500 italic">No phases scheduled</td>
                          <td className="text-right font-semibold">
                            {Number(project.total_project_hours).toLocaleString()}
                          </td>
                        </tr>
                      )
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50 font-bold">
                      <td colSpan={6}>Total</td>
                      <td className="text-right text-primary-600">
                        {Number(report.total_man_hours).toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          ) : (
            <div className="card text-center py-12 text-gray-500">
              No projects assigned to {report.subcontractor_name}
            </div>
          )}
        </>
      )}
    </div>
  )
}
