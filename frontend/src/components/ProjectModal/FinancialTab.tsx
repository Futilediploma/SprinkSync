import { FormData } from './types.js'

interface FinancialTabProps {
  formData: FormData
  errors: { [key: string]: string }
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void
}

export const FinancialTab = ({ formData, errors, onChange }: FinancialTabProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Information</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="budget" className="block text-sm font-medium text-gray-700 mb-2">
            Project Budget
          </label>
          <input
            type="number"
            id="budget"
            name="budget"
            value={formData.budget}
            onChange={onChange}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-construction-500 ${
              errors.budget ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="0"
            min="0"
          />
          {errors.budget && <p className="mt-1 text-sm text-red-600">{errors.budget}</p>}
        </div>

        <div>
          <label htmlFor="contractAmount" className="block text-sm font-medium text-gray-700 mb-2">
            Contract Amount
          </label>
          <input
            type="number"
            id="contractAmount"
            name="contractAmount"
            value={formData.contractAmount}
            onChange={onChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-construction-500"
            placeholder="0"
            min="0"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="contingency" className="block text-sm font-medium text-gray-700 mb-2">
            Contingency Amount
          </label>
          <input
            type="number"
            id="contingency"
            name="contingency"
            value={formData.contingency}
            onChange={onChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-construction-500"
            placeholder="0"
            min="0"
          />
        </div>

        <div>
          <label htmlFor="retentionPercentage" className="block text-sm font-medium text-gray-700 mb-2">
            Retention Percentage
          </label>
          <input
            type="number"
            id="retentionPercentage"
            name="retentionPercentage"
            value={formData.retentionPercentage}
            onChange={onChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-construction-500"
            placeholder="0"
            min="0"
            max="100"
            step="0.1"
          />
        </div>
      </div>
    </div>
  )
}
