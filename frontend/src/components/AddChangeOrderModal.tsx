import { useState, useEffect, useRef } from 'react'
import { X, FileEdit, Calendar, DollarSign, User, FileText, Paperclip, Trash2, Download } from 'lucide-react'
import { generateChangeOrderPDF } from '../utils/pdfExport'

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

interface AddChangeOrderModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (changeOrder: Omit<ChangeOrder, 'id'>) => void
  editingChangeOrder?: ChangeOrder
}

const AddChangeOrderModal: React.FC<AddChangeOrderModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  editingChangeOrder 
}) => {
  const [formData, setFormData] = useState({
    changeOrderNumber: editingChangeOrder?.changeOrderNumber || '',
    description: editingChangeOrder?.description || '',
    submittedTo: editingChangeOrder?.submittedTo || '',
    dateQuoted: editingChangeOrder?.dateQuoted || new Date().toISOString().split('T')[0],
    dateApproved: editingChangeOrder?.dateApproved || '',
    amount: editingChangeOrder?.amount?.toString() || '',
    status: editingChangeOrder?.status || 'pending' as const,
    notes: editingChangeOrder?.notes || '',
    
  })

  const [attachments, setAttachments] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Update form data when editingChangeOrder changes
  useEffect(() => {
    if (editingChangeOrder) {
      setFormData({
        changeOrderNumber: editingChangeOrder.changeOrderNumber || '',
        description: editingChangeOrder.description || '',
        submittedTo: editingChangeOrder.submittedTo || '',
        dateQuoted: editingChangeOrder.dateQuoted || new Date().toISOString().split('T')[0],
        dateApproved: editingChangeOrder.dateApproved || '',
        amount: editingChangeOrder.amount?.toString() || '',
        status: editingChangeOrder.status || 'pending' as const,
        notes: editingChangeOrder.notes || '',
      })
      // Note: In a real app, you'd load existing attachments here
      setAttachments([])
    } else {
      // Reset form for new change order
      setFormData({
        changeOrderNumber: '',
        description: '',
        submittedTo: '',
        dateQuoted: new Date().toISOString().split('T')[0],
        dateApproved: '',
        amount: '',
        status: 'pending' as const,
        notes: '',
      })
      setAttachments([])
    }
    setErrors({})
  }, [editingChangeOrder, isOpen])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.changeOrderNumber.trim()) {
      newErrors.changeOrderNumber = 'Change Order Number is required'
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required'
    }
    
    if (!formData.submittedTo.trim()) {
      newErrors.submittedTo = 'Submitted To field is required'
    }
    
    if (!formData.amount || isNaN(Number(formData.amount))) {
      newErrors.amount = 'Valid amount is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    const changeOrderData = {
      changeOrderNumber: formData.changeOrderNumber,
      description: formData.description,
      submittedTo: formData.submittedTo,
      dateQuoted: formData.dateQuoted,
      dateApproved: formData.dateApproved || undefined,
      amount: Number(formData.amount),
      status: formData.status,
      notes: formData.notes,
      attachments: attachments.map(file => file.name)
    }

    onSave(changeOrderData)
    onClose()
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files)
      setAttachments(prev => [...prev, ...selectedFiles])
    }
  }

  const handleRemoveAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  const handleAddAttachment = () => {
    fileInputRef.current?.click()
  }

  const handleExportToPDF = () => {
    const pdfData = {
      changeOrderNumber: formData.changeOrderNumber,
      description: formData.description,
      submittedTo: formData.submittedTo,
      dateQuoted: formData.dateQuoted,
      dateApproved: formData.dateApproved,
      amount: Number(formData.amount),
      status: formData.status,
      notes: formData.notes,
      attachments: attachments.map(file => file.name),
      projectName: 'Current Project', // You can pass this as a prop
      contractorName: 'SprinkSync Construction' // You can pass this as a prop
    }
    
    generateChangeOrderPDF(pdfData)
  }


  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileEdit className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {editingChangeOrder ? 'Edit Change Order' : 'Add Change Order'}
              </h2>
              <p className="text-sm text-gray-500">
                {editingChangeOrder ? 'Update change order details' : 'Create a new change order for this project'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="max-h-[60vh] overflow-y-auto space-y-6">
            
            {/* Change Order Number and Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="changeOrderNumber" className="block text-sm font-medium text-gray-700 mb-2">
                  Change Order Number *
                </label>
                <div className="relative">
                  <FileText className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    id="changeOrderNumber"
                    name="changeOrderNumber"
                    value={formData.changeOrderNumber}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.changeOrderNumber ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="CO-001"
                  />
                </div>
                {errors.changeOrderNumber && <p className="text-red-500 text-xs mt-1">{errors.changeOrderNumber}</p>}
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="pending">Pending</option>
                  <option value="in-review">In Review</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
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
                onChange={handleChange}
                rows={3}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.description ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Describe the change order work..."
              />
              {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
            </div>

            {/* Submitted To and Amount */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="submittedTo" className="block text-sm font-medium text-gray-700 mb-2">
                  Submitted To *
                </label>
                <div className="relative">
                  <User className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    id="submittedTo"
                    name="submittedTo"
                    value={formData.submittedTo}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.submittedTo ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Contact person name"
                  />
                </div>
                {errors.submittedTo && <p className="text-red-500 text-xs mt-1">{errors.submittedTo}</p>}
              </div>

              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                  Amount *
                </label>
                <div className="relative">
                  <DollarSign className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="number"
                    id="amount"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    step="0.01"
                    className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.amount ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="0.00"
                  />
                </div>
                {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="dateQuoted" className="block text-sm font-medium text-gray-700 mb-2">
                  Date Quoted
                </label>
                <div className="relative">
                  <Calendar className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="date"
                    id="dateQuoted"
                    name="dateQuoted"
                    value={formData.dateQuoted}
                    onChange={handleChange}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="dateApproved" className="block text-sm font-medium text-gray-700 mb-2">
                  Date Approved
                </label>
                <div className="relative">
                  <Calendar className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="date"
                    id="dateApproved"
                    name="dateApproved"
                    value={formData.dateApproved}
                    onChange={handleChange}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Additional notes or comments..."
              />
            </div>
          </div>

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Attachments */} 
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Attachments
                </label>
                <p className="text-xs text-gray-500 mb-2">
                    (Optional) You can attach files related to this change order.
                </p>
                <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                        <button 
                            type="button" 
                            onClick={handleAddAttachment}
                            className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <Paperclip className="w-4 h-4" />
                            <span>Add Attachment</span>
                        </button>
                        {attachments.length === 0 && (
                            <span className="text-sm text-gray-500">No files attached</span>
                        )}
                        {attachments.length > 0 && (
                            <span className="text-sm text-gray-600">{attachments.length} file(s) attached</span>
                        )}
                    </div>
                    
                    {/* File List */}
                    {attachments.length > 0 && (
                        <div className="space-y-2">
                            {attachments.map((file, index) => (
                                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                                    <div className="flex items-center space-x-2">
                                        <Paperclip className="w-4 h-4 text-gray-400" />
                                        <span className="text-sm text-gray-700">{file.name}</span>
                                        <span className="text-xs text-gray-500">
                                            ({(file.size / 1024).toFixed(1)} KB)
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveAttachment(index)}
                                        className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>


          {/* Footer */}
          <div className="flex justify-between items-center mt-6 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleExportToPDF}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <Download className="w-4 h-4" />
              <span>Export to PDF</span>
            </button>
            
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {editingChangeOrder ? 'Update Change Order' : 'Create Change Order'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddChangeOrderModal
