import { useQuery } from '@tanstack/react-query'
import { constructionApi } from '../services/api'
import { FileText, Download, Eye, Upload, Search, Filter } from 'lucide-react'

const Documents = () => {
  const { data: documentsData, isLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: () => constructionApi.getDocuments(),
  })

  const { data: drawingsData } = useQuery({
    queryKey: ['drawings'],
    queryFn: () => constructionApi.getDrawings(),
  })

  const mockDocuments = {
    document_categories: [
      { category: 'Plans', count: 45, last_updated: '2024-01-15' },
      { category: 'Specifications', count: 23, last_updated: '2024-01-10' },
      { category: 'RFIs', count: 8, last_updated: '2024-01-18' },
      { category: 'Submittals', count: 12, last_updated: '2024-01-16' },
      { category: 'Change Orders', count: 3, last_updated: '2024-01-17' },
      { category: 'Photos', count: 156, last_updated: '2024-01-18' }
    ]
  }

  const mockDrawings = {
    drawings: [
      { id: 'A-001', title: 'Site Plan', revision: '3', date: '2024-01-15' },
      { id: 'A-101', title: 'Foundation Plan', revision: '2', date: '2024-01-12' },
      { id: 'A-201', title: 'Floor Plan - Level 1', revision: '4', date: '2024-01-16' },
      { id: 'A-301', title: 'Exterior Elevations', revision: '1', date: '2024-01-10' },
      { id: 'S-101', title: 'Structural Foundation', revision: '2', date: '2024-01-14' },
      { id: 'M-101', title: 'Mechanical Plan', revision: '1', date: '2024-01-11' }
    ]
  }

  const documents = documentsData?.data || mockDocuments
  const drawings = drawingsData?.data || mockDrawings

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="shimmer h-12 rounded-lg"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="shimmer h-32 rounded-lg"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Document Management</h2>
          <p className="text-gray-600 mt-1">Organize and access all project documents</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button className="btn-primary">
            <Upload className="w-5 h-5 mr-2" />
            Upload Documents
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="construction-card p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search documents..."
                className="form-input pl-10 w-64"
              />
            </div>
            <button className="btn-secondary">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </button>
          </div>
        </div>
      </div>

      {/* Document Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {documents.document_categories.map((category: any, index: number) => (
          <div key={index} className="construction-card p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 construction-gradient rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-construction-600">{category.count}</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{category.category}</h3>
            <p className="text-sm text-gray-600">
              Last updated: {category.last_updated}
            </p>
            <button className="mt-4 w-full btn-secondary text-sm">
              View Documents
            </button>
          </div>
        ))}
      </div>

      {/* Construction Drawings */}
      <div className="construction-card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Construction Drawings</h3>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Drawing ID</th>
                <th>Title</th>
                <th>Revision</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {drawings.drawings.map((drawing: any) => (
                <tr key={drawing.id}>
                  <td>
                    <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                      {drawing.id}
                    </span>
                  </td>
                  <td>
                    <span className="font-medium text-gray-900">{drawing.title}</span>
                  </td>
                  <td>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                      Rev {drawing.revision}
                    </span>
                  </td>
                  <td>
                    <span className="text-sm text-gray-600">{drawing.date}</span>
                  </td>
                  <td>
                    <div className="flex items-center space-x-2">
                      <button className="p-2 text-gray-400 hover:text-construction-600 transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-construction-600 transition-colors">
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Documents */}
      <div className="construction-card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Documents</h3>
        <div className="space-y-3">
          {[
            { name: 'Project Specifications v2.1.pdf', type: 'PDF', size: '2.4 MB', uploaded: '2 hours ago' },
            { name: 'Site Survey Results.dwg', type: 'DWG', size: '5.1 MB', uploaded: '4 hours ago' },
            { name: 'Material Safety Data Sheet.pdf', type: 'PDF', size: '1.2 MB', uploaded: '1 day ago' },
            { name: 'Change Order #003.pdf', type: 'PDF', size: '856 KB', uploaded: '2 days ago' }
          ].map((doc, index) => (
            <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-construction-50 text-construction-600 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{doc.name}</p>
                  <p className="text-sm text-gray-500">{doc.type} • {doc.size}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500">{doc.uploaded}</span>
                <div className="flex items-center space-x-2">
                  <button className="p-2 text-gray-400 hover:text-construction-600 transition-colors">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-construction-600 transition-colors">
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Documents
