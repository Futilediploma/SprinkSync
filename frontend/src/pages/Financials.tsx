import { useQuery } from '@tanstack/react-query'
import { constructionApi } from '../services/api'
import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react'

const Financials = () => {
  const { data: financialsData, isLoading } = useQuery({
    queryKey: ['financials'],
    queryFn: () => constructionApi.getFinancials(),
  })

  const { data: sovData } = useQuery({
    queryKey: ['sov'],
    queryFn: () => constructionApi.getSOV(),
  })

  const mockData = {
    budget_summary: {
      total_budget: 1500000,
      spent_to_date: 800000,
      remaining: 700000,
      variance: -50000
    },
    cost_breakdown: [
      { category: 'Materials', budgeted: 600000, actual: 620000 },
      { category: 'Labor', budgeted: 500000, actual: 480000 },
      { category: 'Equipment', budgeted: 200000, actual: 150000 },
      { category: 'Permits', budgeted: 50000, actual: 55000 }
    ]
  }

  const data = financialsData?.data || mockData
  const sov = sovData?.data || {
    total_contract_value: 1500000,
    line_items: [
      { item: 'Site Preparation', original_value: 100000, current_value: 105000, percent_complete: 100 },
      { item: 'Foundation', original_value: 300000, current_value: 300000, percent_complete: 90 },
      { item: 'Framing', original_value: 400000, current_value: 420000, percent_complete: 60 },
      { item: 'Electrical', original_value: 200000, current_value: 200000, percent_complete: 30 },
      { item: 'Plumbing', original_value: 150000, current_value: 150000, percent_complete: 25 },
      { item: 'Finishes', original_value: 350000, current_value: 350000, percent_complete: 10 }
    ]
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="shimmer h-32 rounded-lg"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Financial Management</h2>
        <p className="text-gray-600 mt-1">Track budgets, costs, and financial performance</p>
      </div>

      {/* Budget Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Budget</p>
              <p className="text-3xl font-bold text-gray-900">${data.budget_summary.total_budget.toLocaleString()}</p>
              <p className="text-sm text-gray-500 mt-1">Contract value</p>
            </div>
            <div className="w-12 h-12 construction-gradient rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Spent to Date</p>
              <p className="text-3xl font-bold text-gray-900">${data.budget_summary.spent_to_date.toLocaleString()}</p>
              <p className="text-sm text-green-600 mt-1">
                {((data.budget_summary.spent_to_date / data.budget_summary.total_budget) * 100).toFixed(1)}% of budget
              </p>
            </div>
            <div className="w-12 h-12 info-gradient rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Remaining</p>
              <p className="text-3xl font-bold text-gray-900">${data.budget_summary.remaining.toLocaleString()}</p>
              <p className="text-sm text-blue-600 mt-1">Available funds</p>
            </div>
            <div className="w-12 h-12 success-gradient rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Variance</p>
              <p className={`text-3xl font-bold ${data.budget_summary.variance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                ${Math.abs(data.budget_summary.variance).toLocaleString()}
              </p>
              <p className={`text-sm mt-1 ${data.budget_summary.variance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                {data.budget_summary.variance < 0 ? 'Over budget' : 'Under budget'}
              </p>
            </div>
            <div className={`w-12 h-12 ${data.budget_summary.variance < 0 ? 'danger-gradient' : 'success-gradient'} rounded-lg flex items-center justify-center`}>
              {data.budget_summary.variance < 0 ? 
                <TrendingDown className="w-6 h-6 text-white" /> :
                <TrendingUp className="w-6 h-6 text-white" />
              }
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost Breakdown */}
        <div className="construction-card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Cost Breakdown</h3>
          <div className="space-y-4">
            {data.cost_breakdown.map((item: any, index: number) => {
              const variance = item.actual - item.budgeted
              const variancePercent = ((variance / item.budgeted) * 100).toFixed(1)
              return (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-gray-900">{item.category}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">
                          ${item.actual.toLocaleString()} / ${item.budgeted.toLocaleString()}
                        </span>
                        {variance !== 0 && (
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            variance > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {variance > 0 ? '+' : ''}{variancePercent}%
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          item.actual > item.budgeted ? 'bg-red-500' : 'bg-construction-gradient'
                        }`}
                        style={{ width: `${Math.min((item.actual / item.budgeted) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Schedule of Values */}
        <div className="construction-card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Schedule of Values (SOV)</h3>
          <div className="space-y-3">
            {sov.line_items.map((item: any, index: number) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-900">{item.item}</span>
                  <span className="text-sm font-medium text-construction-600">
                    {item.percent_complete}%
                  </span>
                </div>
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Value: ${item.current_value.toLocaleString()}</span>
                  <span>Complete: ${(item.current_value * item.percent_complete / 100).toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="h-2 bg-construction-gradient rounded-full transition-all duration-300"
                    style={{ width: `${item.percent_complete}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex justify-between font-semibold">
              <span>Total Contract Value:</span>
              <span>${sov.total_contract_value.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cash Flow Projection */}
      <div className="construction-card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Cash Flow Projection</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">$250K</p>
            <p className="text-sm text-blue-800">Next 30 Days</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">$450K</p>
            <p className="text-sm text-green-800">Next 60 Days</p>
          </div>
          <div className="text-center p-4 bg-construction-50 rounded-lg">
            <p className="text-2xl font-bold text-construction-600">$700K</p>
            <p className="text-sm text-construction-800">Next 90 Days</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Financials
