import { Compass, Layers, Ruler, FileImage } from 'lucide-react'

const Design = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Design Management</h2>
        <p className="text-gray-600 mt-1">Manage design documents and architectural plans</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="construction-card p-6 text-center">
          <div className="w-12 h-12 construction-gradient rounded-lg flex items-center justify-center mx-auto mb-4">
            <Compass className="w-6 h-6 text-white" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Architectural Plans</h3>
          <p className="text-sm text-gray-600">45 drawings</p>
        </div>

        <div className="construction-card p-6 text-center">
          <div className="w-12 h-12 info-gradient rounded-lg flex items-center justify-center mx-auto mb-4">
            <Layers className="w-6 h-6 text-white" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Structural Plans</h3>
          <p className="text-sm text-gray-600">23 drawings</p>
        </div>

        <div className="construction-card p-6 text-center">
          <div className="w-12 h-12 success-gradient rounded-lg flex items-center justify-center mx-auto mb-4">
            <Ruler className="w-6 h-6 text-white" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">MEP Plans</h3>
          <p className="text-sm text-gray-600">34 drawings</p>
        </div>

        <div className="construction-card p-6 text-center">
          <div className="w-12 h-12 warning-gradient rounded-lg flex items-center justify-center mx-auto mb-4">
            <FileImage className="w-6 h-6 text-white" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">3D Models</h3>
          <p className="text-sm text-gray-600">12 models</p>
        </div>
      </div>

      <div className="construction-card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Design Changes</h3>
        <div className="space-y-4">
          {[
            { id: 'A-201', title: 'Floor Plan Level 1 - Revision 4', date: '2024-01-18', type: 'Architectural' },
            { id: 'S-101', title: 'Structural Foundation - Revision 2', date: '2024-01-17', type: 'Structural' },
            { id: 'M-201', title: 'HVAC Layout - Revision 3', date: '2024-01-16', type: 'Mechanical' }
          ].map((change, index) => (
            <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">{change.title}</p>
                <p className="text-sm text-gray-600">{change.type} • {change.date}</p>
              </div>
              <span className="text-construction-600 font-medium text-sm">{change.id}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Design
