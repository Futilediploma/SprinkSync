import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { constructionApi } from '../services/api'
import { useProject } from '../contexts/ProjectContext'
import AddChangeOrderModal from '../components/AddChangeOrderModal'
import { generateChangeOrderPDF } from '../utils/pdfExport'
import { EmptyState } from '../components/shared'
import { 
  DollarSign, 
  TrendingUp, 
  AlertTriangle, 
  FileText, 
  Plus, 
  Download,
  Edit,
  Eye,
  Calculator,
  PieChart,
  BarChart3,
  Target,
  Calendar,
  Filter,
  FileEdit
} from 'lucide-react'

interface BudgetCategory {
  id: string
  name: string
  budgeted: number
  spent: number
  remaining: number
  percentage: number
  status: 'on-track' | 'over-budget' | 'warning'
  lastUpdated: string
}

interface ChangeOrder {
  id: string
  changeOrderNumber: string
  description: string
  submittedTo: string
  dateQuoted: string
  dateApproved?: string
  amount: number
  status: 'pending' | 'approved' | 'rejected' | 'in-review'
  notes?: string
  attachments?: string[]
}

const Financials = () => {
  const { currentProject, isProjectSelected } = useProject()
  const [activeTab, setActiveTab] = useState<'overview' | 'budget' | 'expenses' | 'payments' | 'reports' | 'change-order'>('overview')
  const [showAddChangeOrder, setShowAddChangeOrder] = useState(false)
  const [editingChangeOrder, setEditingChangeOrder] = useState<ChangeOrder | undefined>(undefined)

  const { data: financialsData, isLoading } = useQuery({
    queryKey: ['financials', currentProject?.id],
    queryFn: () => constructionApi.getFinancials(),
    enabled: isProjectSelected,
  })

  // Extract data from API response or use empty defaults
  const budgetCategories: BudgetCategory[] = financialsData?.data?.budgetCategories || []
  
  // Sample change order data - in real app this would come from API
  const [changeOrders, setChangeOrders] = useState<ChangeOrder[]>([
    {
      id: '1',
      changeOrderNumber: 'CO-001',
      description: 'COLO1 repairs',
      submittedTo: 'Sean Milby',
      dateQuoted: '2025-06-26',
      dateApproved: undefined,
      amount: 882.00,
      status: 'pending',
      notes: 'pending till 5000 is reached for repairs. submitted to WT 6/25/2025'
    },
    {
      id: '2', 
      changeOrderNumber: 'CO-002',
      description: 'JULY 2025 PIPE REPAIRS',
      submittedTo: 'Sean Milby',
      dateQuoted: '2025-07-22',
      dateApproved: undefined,
      amount: 3174.00,
      status: 'pending',
      notes: 'pending till 5000 is reached for repairs. Submitted to WT 7/22/2025'
    }
  ])

  // Calculate totals from real data
  const totalBudgeted = budgetCategories.reduce((sum, cat) => sum + cat.budgeted, 0)
  const totalSpent = budgetCategories.reduce((sum, cat) => sum + cat.spent, 0)
  const totalRemaining = totalBudgeted - totalSpent
  const overallProgress = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0
  const weeklyBurnRate = financialsData?.data?.burnRate || 0

  // Show project selection prompt if no project is selected
  if (!isProjectSelected) {
    return (
      <div className="page-container">
        <EmptyState
          icon={<DollarSign className="w-12 h-12 text-gray-400" />}
          title="Select a Project"
          description="Choose a project from the sidebar to view its financial data and budget tracking."
        />
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Financial Management - {currentProject?.name}</h1>
        </div>
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="stat-card">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on-track': return 'text-green-600 bg-green-100'
      case 'warning': return 'text-yellow-600 bg-yellow-100'
      case 'over-budget': return 'text-red-600 bg-red-100'
      case 'approved': return 'text-green-600 bg-green-100'
      case 'pending': return 'text-yellow-600 bg-yellow-100'
      case 'rejected': return 'text-red-600 bg-red-100'
      case 'paid': return 'text-green-600 bg-green-100'
      case 'overdue': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Change Order handlers
  const handleAddChangeOrder = (changeOrderData: Omit<ChangeOrder, 'id'>) => {
    const newChangeOrder = {
      ...changeOrderData,
      id: (changeOrders.length + 1).toString()
    }
    setChangeOrders([...changeOrders, newChangeOrder])
  }

  const handleEditChangeOrder = (changeOrder: ChangeOrder) => {
    setEditingChangeOrder(changeOrder)
    setShowAddChangeOrder(true)
  }

  const handleUpdateChangeOrder = (changeOrderData: Omit<ChangeOrder, 'id'>) => {
    if (editingChangeOrder) {
      const updatedChangeOrders = changeOrders.map(co => 
        co.id === editingChangeOrder.id 
          ? { ...changeOrderData, id: editingChangeOrder.id }
          : co
      )
      setChangeOrders(updatedChangeOrders)
      setEditingChangeOrder(undefined)
    }
  }

  const handleCloseModal = () => {
    setShowAddChangeOrder(false)
    setEditingChangeOrder(undefined)
  }

  const handleExportChangeOrderPDF = (changeOrder: ChangeOrder) => {
    const pdfData = {
      changeOrderNumber: changeOrder.changeOrderNumber,
      description: changeOrder.description,
      submittedTo: changeOrder.submittedTo,
      dateQuoted: changeOrder.dateQuoted,
      dateApproved: changeOrder.dateApproved,
      amount: changeOrder.amount,
      status: changeOrder.status,
      notes: changeOrder.notes,
      attachments: changeOrder.attachments || [],
      projectName: 'Current Project',
      contractorName: 'SprinkSync Construction'
    }
    
    generateChangeOrderPDF(pdfData)
  }

  const tabs = [
    { id: 'overview', name: 'Overview', icon: BarChart3 },
    { id: 'change-order', name: 'Change Orders', icon: FileEdit },
    { id: 'expenses', name: 'Expenses', icon: FileText },
    { id: 'payments', name: 'Payments', icon: Calendar },
    { id: 'reports', name: 'Reports', icon: PieChart },
  ]

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Financial Management</h1>
          <p className="page-subtitle">
            Budget tracking and expense management for {currentProject?.name}
          </p>
        </div>
        <div className="flex gap-3">
          <button className="btn-secondary">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const IconComponent = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`group inline-flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <IconComponent className="w-5 h-5 mr-2" />
                  {tab.name}
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="stat-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Budget</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${currentProject?.budget?.toLocaleString() || currentProject?.contractAmount?.toLocaleString() || '0'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Project budget</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <DollarSign className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Spent</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalSpent)}</p>
                  <p className="text-xs text-green-600 mt-1 flex items-center">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    {overallProgress.toFixed(1)}% of budget
                  </p>
                </div>
                <div className="p-3 bg-red-100 rounded-full">
                  <TrendingUp className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Remaining</p>
                  <p className={`text-2xl font-bold ${totalRemaining >= 0 ? 'text-green-900' : 'text-red-900'}`}>
                    {formatCurrency(totalRemaining)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {((totalRemaining / totalBudgeted) * 100).toFixed(1)}% remaining
                  </p>
                </div>
                <div className={`p-3 rounded-full ${totalRemaining >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                  <Calculator className={`w-6 h-6 ${totalRemaining >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Burn Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(weeklyBurnRate)}</p>
                  <p className="text-xs text-gray-500 mt-1">per week avg</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <BarChart3 className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Budget Categories Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Budget Categories</h3>
            {budgetCategories.length > 0 ? (
              <div className="space-y-4">
                {budgetCategories.slice(0, 3).map((category) => (
                  <div key={category.id} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900">{category.name}</span>
                        <span className="text-sm text-gray-600">
                          {formatCurrency(category.spent)} / {formatCurrency(category.budgeted)}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            category.status === 'over-budget'
                              ? 'bg-red-500'
                              : category.status === 'warning'
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(category.percentage, 100)}%` }}
                        />
                      </div>
                    </div>
                    <span
                      className={`ml-3 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                        category.status
                      )}`}
                    >
                      {category.percentage.toFixed(1)}%
                    </span>
                  </div>
                ))}
                <button className="mt-4 text-sm text-blue-600 hover:text-blue-800">
                  View all categories →
                </button>
              </div>
            ) : (
              <div className="text-center py-8">
                <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">No Budget Categories</h4>
                <p className="text-gray-500 mb-4">Set up budget categories to track your project spending.</p>
                <button className="btn-primary">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Budget
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'change-order' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Change Order Management</h2>
            <button 
              className="btn-primary"
              onClick={() => setShowAddChangeOrder(true)}
            >
              <Plus className="w-4 h-4" />
              Add Change Order
            </button>
          </div>

          {/* Change Order Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="stat-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Original Contract</p>
                  <p className="text-2xl font-bold text-gray-900">$4,706,196</p>
                  <p className="text-xs text-gray-500 mt-1">Base contract value</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Change Orders</p>
                  <p className="text-2xl font-bold text-yellow-900">
                    {formatCurrency(changeOrders.filter(co => co.status === 'pending').reduce((sum, co) => sum + co.amount, 0))}
                  </p>
                  <p className="text-xs text-yellow-600 mt-1">
                    {changeOrders.filter(co => co.status === 'pending').length} pending orders
                  </p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-full">
                  <AlertTriangle className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Approved Change Orders</p>
                  <p className="text-2xl font-bold text-green-900">
                    {formatCurrency(changeOrders.filter(co => co.status === 'approved').reduce((sum, co) => sum + co.amount, 0))}
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    {changeOrders.filter(co => co.status === 'approved').length} approved orders
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <Target className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Project Value</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(4706196 + changeOrders.filter(co => co.status === 'approved').reduce((sum, co) => sum + co.amount, 0))}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Contract + approved COs</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <Calculator className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Change Order Log */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Change Order Log</h3>
                <div className="flex space-x-2">
                  <button className="btn-secondary text-sm">
                    <Filter className="w-4 h-4" />
                    Filter
                  </button>
                  <button className="btn-secondary text-sm">
                    <Download className="w-4 h-4" />
                    Export
                  </button>
                </div>
              </div>
            </div>
            
            {changeOrders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Change Order #
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {changeOrders.map((changeOrder) => (
                      <tr key={changeOrder.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{changeOrder.changeOrderNumber}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{changeOrder.description}</div>
                          {changeOrder.notes && (
                            <div className="text-sm text-gray-500 max-w-xs truncate">{changeOrder.notes}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(changeOrder.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                              changeOrder.status
                            )}`}
                          >
                            {changeOrder.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button className="text-blue-600 hover:text-blue-900" title="View Details">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button 
                              className="text-gray-600 hover:text-gray-900" 
                              title="Edit"
                              onClick={() => handleEditChangeOrder(changeOrder)}
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button 
                              className="text-green-600 hover:text-green-900" 
                              title="Export to PDF"
                              onClick={() => handleExportChangeOrderPDF(changeOrder)}
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <FileEdit className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Change Orders</h3>
                <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                  Start tracking project changes by creating your first change order.
                </p>
                <button 
                  className="btn-primary"
                  onClick={() => setShowAddChangeOrder(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Change Order
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add/Edit Change Order Modal */}
      <AddChangeOrderModal
        isOpen={showAddChangeOrder}
        onClose={handleCloseModal}
        onSave={editingChangeOrder ? handleUpdateChangeOrder : handleAddChangeOrder}
        editingChangeOrder={editingChangeOrder}
      />
    </div>
  )
}

export default Financials