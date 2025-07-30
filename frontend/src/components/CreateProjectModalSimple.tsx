import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { constructionApi } from '../services/api'
import { X, Building2, Calendar, DollarSign, Users } from 'lucide-react'
import { BasicInfoTab } from './ProjectModal/BasicInfoTab'
import { FinancialTab } from './ProjectModal/FinancialTab'
import { FormData } from './ProjectModal/types'

interface CreateProjectModalProps {
  isOpen: boolean
  onClose: () => void
}

const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('basic')
  
  const [formData, setFormData] = useState<FormData>({
    // Basic Information
    name: '',
    description: '',
    location: '',
    budget: '',
    startDate: '',
    endDate: '',
    status: 'Planning',
    
    // Job Information
    jobNumber: '',
    jobName: '',
    contractNumber: '',
    contractAmount: '',
    changeOrderAmount: '',
    totalContractAmount: '',
    
    // Client Information
    clientName: '',
    clientContact: '',
    clientPhone: '',
    clientEmail: '',
    clientAddress: '',
    
    // Project Details
    projectType: '',
    projectScope: '',
    buildingType: '',
    squareFootage: '',
    numberOfFloors: '',
    constructionType: '',
    
    // Personnel
    projectManager: '',
    superintendent: '',
    projectEngineer: '',
    safetyManager: '',
    qualityManager: '',
    
    // Dates and Schedule
    awardDate: '',
    noticeToProceeed: '',
    originalCompletionDate: '',
    revisedCompletionDate: '',
    substantialCompletionDate: '',
    finalCompletionDate: '',
    
    // Permits and Approvals
    buildingPermitNumber: '',
    buildingPermitDate: '',
    occupancyPermitDate: '',
    certificateOfOccupancy: '',
    
    // Financial Information
    originalBudget: '',
    approvedBudget: '',
    currentBudget: '',
    costToDate: '',
    projectedFinalCost: '',
    contingency: '',
    retentionPercentage: '',
    liquidatedDamages: '',
    
    // Subcontractors and Vendors
    generalContractor: '',
    architect: '',
    engineer: '',
    majorSubcontractors: '',
    keyVendors: '',
    
    // Insurance and Bonding
    bondingCompany: '',
    bondAmount: '',
    insuranceCarrier: '',
    policyNumber: '',
    
    // Project Requirements
    warrantyPeriod: '',
    milestones: '',
    
    // Safety and Quality
    safetyRequirements: '',
    qualityStandards: '',
    environmentalRequirements: '',
    
    // Documents and Specifications
    planRevision: '',
    specificationVersion: '',
    addendaNumbers: '',
    
    // Additional Information
    notes: '',
    specialRequirements: '',
    riskFactors: '',
    opportunities: ''
  })

  const [errors, setErrors] = useState<{[key: string]: string}>({})

  const createProjectMutation = useMutation({
    mutationFn: (data: any) => constructionApi.createProject(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      onClose()
      resetForm()
      setErrors({})
    },
    onError: (error: any) => {
      console.error('Failed to create project:', error)
    }
  })

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      location: '',
      budget: '',
      startDate: '',
      endDate: '',
      status: 'Planning',
      jobNumber: '',
      jobName: '',
      contractNumber: '',
      contractAmount: '',
      changeOrderAmount: '',
      totalContractAmount: '',
      clientName: '',
      clientContact: '',
      clientPhone: '',
      clientEmail: '',
      clientAddress: '',
      projectType: '',
      projectScope: '',
      buildingType: '',
      squareFootage: '',
      numberOfFloors: '',
      constructionType: '',
      projectManager: '',
      superintendent: '',
      projectEngineer: '',
      safetyManager: '',
      qualityManager: '',
      awardDate: '',
      noticeToProceeed: '',
      originalCompletionDate: '',
      revisedCompletionDate: '',
      substantialCompletionDate: '',
      finalCompletionDate: '',
      buildingPermitNumber: '',
      buildingPermitDate: '',
      occupancyPermitDate: '',
      certificateOfOccupancy: '',
      originalBudget: '',
      approvedBudget: '',
      currentBudget: '',
      costToDate: '',
      projectedFinalCost: '',
      contingency: '',
      retentionPercentage: '',
      liquidatedDamages: '',
      generalContractor: '',
      architect: '',
      engineer: '',
      majorSubcontractors: '',
      keyVendors: '',
      bondingCompany: '',
      bondAmount: '',
      insuranceCarrier: '',
      policyNumber: '',
      warrantyPeriod: '',
      milestones: '',
      safetyRequirements: '',
      qualityStandards: '',
      environmentalRequirements: '',
      planRevision: '',
      specificationVersion: '',
      addendaNumbers: '',
      notes: '',
      specialRequirements: '',
      riskFactors: '',
      opportunities: ''
    })
  }

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {}
    
    if (!formData.name.trim()) {
      newErrors.name = 'Project name is required'
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Project description is required'
    }
    
    if (formData.budget && isNaN(Number(formData.budget))) {
      newErrors.budget = 'Budget must be a valid number'
    }
    
    if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
      newErrors.endDate = 'End date must be after start date'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    const projectData = {
      name: formData.name,
      description: formData.description,
      status: formData.status,
      job_number: formData.jobNumber,
      job_type: formData.projectType,
      job_category: formData.buildingType,
      job_priority: 'Medium',
      address: formData.location,
      client_name: formData.clientName,
      client_contact: formData.clientContact,
      client_phone: formData.clientPhone,
      client_email: formData.clientEmail,
      billing_address: formData.clientAddress,
      start_date: formData.startDate || null,
      end_date: formData.endDate || null,
      contract_amount: formData.contractAmount ? Number(formData.contractAmount) : null,
      budget: formData.budget ? Number(formData.budget) : null,
      project_manager: formData.projectManager,
      site_supervisor: formData.superintendent,
      progress: 0
    }

    createProjectMutation.mutate(projectData)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  if (!isOpen) return null

  const tabs = [
    { id: 'basic', name: 'Basic Info', icon: Building2 },
    { id: 'schedule', name: 'Schedule', icon: Calendar },
    { id: 'financial', name: 'Financial', icon: DollarSign },
    { id: 'personnel', name: 'Personnel', icon: Users },
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-construction-gradient rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Create New Project</h2>
              <p className="text-sm text-gray-600">Add a new construction project to SprinkSync</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => {
              const IconComponent = tab.icon
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-construction-500 text-construction-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  {tab.name}
                </button>
              )
            })}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
          <div className="flex-1 p-6 overflow-y-auto">
            {activeTab === 'basic' && (
              <BasicInfoTab 
                formData={formData} 
                errors={errors} 
                onChange={handleChange} 
              />
            )}
            
            {activeTab === 'financial' && (
              <FinancialTab 
                formData={formData} 
                errors={errors} 
                onChange={handleChange} 
              />
            )}

            {/* Add other tabs as needed */}
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center p-6 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              Simplified project creation
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary"
                disabled={createProjectMutation.isPending}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={createProjectMutation.isPending}
              >
                {createProjectMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  'Create Project'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateProjectModal
