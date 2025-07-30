import { FormData } from './types.js'

interface BasicInfoTabProps {
  formData: FormData
  errors: { [key: string]: string }
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void
}

export const BasicInfoTab = ({ formData, errors, onChange }: BasicInfoTabProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Project Information</h3>
      
      {/* Project Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
          Project Name *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={onChange}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-construction-500 ${
            errors.name ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Enter project name"
        />
        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
          Description *
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={onChange}
          rows={3}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-construction-500 ${
            errors.description ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Describe the project scope and objectives"
        />
        {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
      </div>

      {/* Location & Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
            Location
          </label>
          <input
            type="text"
            id="location"
            name="location"
            value={formData.location}
            onChange={onChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-construction-500"
            placeholder="Project location"
          />
        </div>

        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
            Initial Status
          </label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={onChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-construction-500"
          >
            <option value="Planning">Planning</option>
            <option value="In Progress">In Progress</option>
            <option value="On Hold">On Hold</option>
          </select>
        </div>
      </div>

      {/* Project Type & Building Type */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="projectType" className="block text-sm font-medium text-gray-700 mb-2">
            Project Type
          </label>
          <select
            id="projectType"
            name="projectType"
            value={formData.projectType}
            onChange={onChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-construction-500"
          >
            <option value="">Select type</option>
            <option value="Commercial">Commercial</option>
            <option value="Residential">Residential</option>
            <option value="Industrial">Industrial</option>
            <option value="Infrastructure">Infrastructure</option>
            <option value="Renovation">Renovation</option>
          </select>
        </div>

        <div>
          <label htmlFor="buildingType" className="block text-sm font-medium text-gray-700 mb-2">
            Building Type
          </label>
          <input
            type="text"
            id="buildingType"
            name="buildingType"
            value={formData.buildingType}
            onChange={onChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-construction-500"
            placeholder="e.g., Office Building, Warehouse"
          />
        </div>
      </div>
    </div>
  )
}
