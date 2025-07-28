import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { constructionApi } from '../services/api'
import { X, Building2, Calendar, DollarSign, Users, FileText, Shield, Briefcase } from 'lucide-react'

interface CreateProjectModalProps {
  isOpen: boolean
  onClose: () => void
}

const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient()
  
  const [activeTab, setActiveTab] = useState('basic')
  
  const [formData, setFormData] = useState({
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
    
    // Dates and Schedule
    awardDate: '',
    noticeToProceeed: '',
    originalCompletionDate: '',
    revisedCompletionDate: '',
    substantialCompletionDate: '',
    finalCompletionDate: '',
    
    // Financial Information
    originalBudget: '',
    approvedBudget: '',
    currentBudget: '',
    costToDate: '',
    projectedFinalCost: '',
    contingency: '',
    
    // Personnel
    projectManager: '',
    superintendent: '',
    projectEngineer: '',
    safetyManager: '',
    qualityManager: '',
    
    // Subcontractors and Vendors
    generalContractor: '',
    architect: '',
    engineer: '',
    majorSubcontractors: '',
    keyVendors: '',
    
    // Permits and Approvals
    buildingPermitNumber: '',
    buildingPermitDate: '',
    occupancyPermitDate: '',
    certificateOfOccupancy: '',
    
    // Insurance and Bonding
    bondingCompany: '',
    bondAmount: '',
    insuranceCarrier: '',
    policyNumber: '',
    
    // Project Requirements
    retentionPercentage: '',
    warrantyPeriod: '',
    liquidatedDamages: '',
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

  const resetForm = () => {
    setFormData({
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
      
      // Dates and Schedule
      awardDate: '',
      noticeToProceeed: '',
      originalCompletionDate: '',
      revisedCompletionDate: '',
      substantialCompletionDate: '',
      finalCompletionDate: '',
      
      // Financial Information
      originalBudget: '',
      approvedBudget: '',
      currentBudget: '',
      costToDate: '',
      projectedFinalCost: '',
      contingency: '',
      
      // Personnel
      projectManager: '',
      superintendent: '',
      projectEngineer: '',
      safetyManager: '',
      qualityManager: '',
      
      // Subcontractors and Vendors
      generalContractor: '',
      architect: '',
      engineer: '',
      majorSubcontractors: '',
      keyVendors: '',
      
      // Permits and Approvals
      buildingPermitNumber: '',
      buildingPermitDate: '',
      occupancyPermitDate: '',
      certificateOfOccupancy: '',
      
      // Insurance and Bonding
      bondingCompany: '',
      bondAmount: '',
      insuranceCarrier: '',
      policyNumber: '',
      
      // Project Requirements
      retentionPercentage: '',
      warrantyPeriod: '',
      liquidatedDamages: '',
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
  }

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
      ...formData,
      budget: formData.budget ? Number(formData.budget) : undefined,
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
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
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
            {[
              { id: 'basic', name: 'Basic Info', icon: Building2 },
              { id: 'job', name: 'Job Details', icon: Briefcase },
              { id: 'client', name: 'Client Info', icon: Users },
              { id: 'schedule', name: 'Schedule', icon: Calendar },
              { id: 'financial', name: 'Financial', icon: DollarSign },
              { id: 'personnel', name: 'Personnel', icon: Users },
              { id: 'permits', name: 'Permits', icon: FileText },
              { id: 'safety', name: 'Safety', icon: Shield },
            ].map((tab) => {
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
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6 max-h-96 overflow-y-auto">
            {/* Basic Information Tab */}
            {activeTab === 'basic' && (
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
                    onChange={handleChange}
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
                    onChange={handleChange}
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
                      onChange={handleChange}
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
                      onChange={handleChange}
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
                      onChange={handleChange}
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
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-construction-500"
                      placeholder="e.g., Office Building, Warehouse"
                    />
                  </div>
                </div>

                {/* Square Footage & Floors */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="squareFootage" className="block text-sm font-medium text-gray-700 mb-2">
                      Square Footage
                    </label>
                    <input
                      type="number"
                      id="squareFootage"
                      name="squareFootage"
                      value={formData.squareFootage}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-construction-500"
                      placeholder="0"
                      min="0"
                    />
                  </div>

                  <div>
                    <label htmlFor="numberOfFloors" className="block text-sm font-medium text-gray-700 mb-2">
                      Number of Floors
                    </label>
                    <input
                      type="number"
                      id="numberOfFloors"
                      name="numberOfFloors"
                      value={formData.numberOfFloors}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-construction-500"
                      placeholder="0"
                      min="0"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Job Details Tab */}
            {activeTab === 'job' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="jobNumber" className="block text-sm font-medium text-gray-700 mb-2">
                      Job Number
                    </label>
                    <input
                      type="text"
                      id="jobNumber"
                      name="jobNumber"
                      value={formData.jobNumber}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-construction-500"
                      placeholder="Job number"
                    />
                  </div>

                  <div>
                    <label htmlFor="contractNumber" className="block text-sm font-medium text-gray-700 mb-2">
                      Contract Number
                    </label>
                    <input
                      type="text"
                      id="contractNumber"
                      name="contractNumber"
                      value={formData.contractNumber}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-construction-500"
                      placeholder="Contract number"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="projectScope" className="block text-sm font-medium text-gray-700 mb-2">
                    Project Scope
                  </label>
                  <textarea
                    id="projectScope"
                    name="projectScope"
                    value={formData.projectScope}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-construction-500"
                    placeholder="Detailed scope of work"
                  />
                </div>

                <div>
                  <label htmlFor="constructionType" className="block text-sm font-medium text-gray-700 mb-2">
                    Construction Type
                  </label>
                  <select
                    id="constructionType"
                    name="constructionType"
                    value={formData.constructionType}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-construction-500"
                  >
                    <option value="">Select construction type</option>
                    <option value="New Construction">New Construction</option>
                    <option value="Renovation">Renovation</option>
                    <option value="Addition">Addition</option>
                    <option value="Tenant Improvement">Tenant Improvement</option>
                  </select>
                </div>
              </div>
            )}

            {/* Client Information Tab */}
            {activeTab === 'client' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Client Information</h3>
                
                <div>
                  <label htmlFor="clientName" className="block text-sm font-medium text-gray-700 mb-2">
                    Client Name
                  </label>
                  <input
                    type="text"
                    id="clientName"
                    name="clientName"
                    value={formData.clientName}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-construction-500"
                    placeholder="Client company name"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="clientContact" className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Person
                    </label>
                    <input
                      type="text"
                      id="clientContact"
                      name="clientContact"
                      value={formData.clientContact}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-construction-500"
                      placeholder="Contact name"
                    />
                  </div>

                  <div>
                    <label htmlFor="clientPhone" className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="clientPhone"
                      name="clientPhone"
                      value={formData.clientPhone}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-construction-500"
                      placeholder="Phone number"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="clientEmail" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="clientEmail"
                    name="clientEmail"
                    value={formData.clientEmail}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-construction-500"
                    placeholder="email@company.com"
                  />
                </div>

                <div>
                  <label htmlFor="clientAddress" className="block text-sm font-medium text-gray-700 mb-2">
                    Client Address
                  </label>
                  <textarea
                    id="clientAddress"
                    name="clientAddress"
                    value={formData.clientAddress}
                    onChange={handleChange}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-construction-500"
                    placeholder="Full address"
                  />
                </div>
              </div>
            )}

            {/* Schedule Tab */}
            {activeTab === 'schedule' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Schedule</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                      Project Start Date
                    </label>
                    <input
                      type="date"
                      id="startDate"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-construction-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                      Project End Date
                    </label>
                    <input
                      type="date"
                      id="endDate"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-construction-500 ${
                        errors.endDate ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.endDate && <p className="mt-1 text-sm text-red-600">{errors.endDate}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="awardDate" className="block text-sm font-medium text-gray-700 mb-2">
                      Award Date
                    </label>
                    <input
                      type="date"
                      id="awardDate"
                      name="awardDate"
                      value={formData.awardDate}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-construction-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="noticeToProceeed" className="block text-sm font-medium text-gray-700 mb-2">
                      Notice to Proceed
                    </label>
                    <input
                      type="date"
                      id="noticeToProceeed"
                      name="noticeToProceeed"
                      value={formData.noticeToProceeed}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-construction-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="originalCompletionDate" className="block text-sm font-medium text-gray-700 mb-2">
                      Original Completion Date
                    </label>
                    <input
                      type="date"
                      id="originalCompletionDate"
                      name="originalCompletionDate"
                      value={formData.originalCompletionDate}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-construction-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="substantialCompletionDate" className="block text-sm font-medium text-gray-700 mb-2">
                      Substantial Completion Date
                    </label>
                    <input
                      type="date"
                      id="substantialCompletionDate"
                      name="substantialCompletionDate"
                      value={formData.substantialCompletionDate}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-construction-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Financial Tab */}
            {activeTab === 'financial' && (
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
                      onChange={handleChange}
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
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-construction-500"
                      placeholder="0"
                      min="0"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="changeOrderAmount" className="block text-sm font-medium text-gray-700 mb-2">
                      Change Order Amount
                    </label>
                    <input
                      type="number"
                      id="changeOrderAmount"
                      name="changeOrderAmount"
                      value={formData.changeOrderAmount}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-construction-500"
                      placeholder="0"
                      min="0"
                    />
                  </div>

                  <div>
                    <label htmlFor="contingency" className="block text-sm font-medium text-gray-700 mb-2">
                      Contingency Amount
                    </label>
                    <input
                      type="number"
                      id="contingency"
                      name="contingency"
                      value={formData.contingency}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-construction-500"
                      placeholder="0"
                      min="0"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="retentionPercentage" className="block text-sm font-medium text-gray-700 mb-2">
                      Retention Percentage
                    </label>
                    <input
                      type="number"
                      id="retentionPercentage"
                      name="retentionPercentage"
                      value={formData.retentionPercentage}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-construction-500"
                      placeholder="0"
                      min="0"
                      max="100"
                      step="0.1"
                    />
                  </div>

                  <div>
                    <label htmlFor="liquidatedDamages" className="block text-sm font-medium text-gray-700 mb-2">
                      Liquidated Damages (per day)
                    </label>
                    <input
                      type="number"
                      id="liquidatedDamages"
                      name="liquidatedDamages"
                      value={formData.liquidatedDamages}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-construction-500"
                      placeholder="0"
                      min="0"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Personnel Tab */}
            {activeTab === 'personnel' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Personnel</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="projectManager" className="block text-sm font-medium text-gray-700 mb-2">
                      Project Manager
                    </label>
                    <input
                      type="text"
                      id="projectManager"
                      name="projectManager"
                      value={formData.projectManager}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-construction-500"
                      placeholder="Project manager name"
                    />
                  </div>

                  <div>
                    <label htmlFor="superintendent" className="block text-sm font-medium text-gray-700 mb-2">
                      Superintendent
                    </label>
                    <input
                      type="text"
                      id="superintendent"
                      name="superintendent"
                      value={formData.superintendent}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-construction-500"
                      placeholder="Superintendent name"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="projectEngineer" className="block text-sm font-medium text-gray-700 mb-2">
                      Project Engineer
                    </label>
                    <input
                      type="text"
                      id="projectEngineer"
                      name="projectEngineer"
                      value={formData.projectEngineer}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-construction-500"
                      placeholder="Project engineer name"
                    />
                  </div>

                  <div>
                    <label htmlFor="safetyManager" className="block text-sm font-medium text-gray-700 mb-2">
                      Safety Manager
                    </label>
                    <input
                      type="text"
                      id="safetyManager"
                      name="safetyManager"
                      value={formData.safetyManager}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-construction-500"
                      placeholder="Safety manager name"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="architect" className="block text-sm font-medium text-gray-700 mb-2">
                      Architect
                    </label>
                    <input
                      type="text"
                      id="architect"
                      name="architect"
                      value={formData.architect}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-construction-500"
                      placeholder="Architect firm"
                    />
                  </div>

                  <div>
                    <label htmlFor="engineer" className="block text-sm font-medium text-gray-700 mb-2">
                      Engineer
                    </label>
                    <input
                      type="text"
                      id="engineer"
                      name="engineer"
                      value={formData.engineer}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-construction-500"
                      placeholder="Engineering firm"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Permits Tab */}
            {activeTab === 'permits' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Permits & Documentation</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="buildingPermitNumber" className="block text-sm font-medium text-gray-700 mb-2">
                      Building Permit Number
                    </label>
                    <input
                      type="text"
                      id="buildingPermitNumber"
                      name="buildingPermitNumber"
                      value={formData.buildingPermitNumber}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-construction-500"
                      placeholder="Permit number"
                    />
                  </div>

                  <div>
                    <label htmlFor="buildingPermitDate" className="block text-sm font-medium text-gray-700 mb-2">
                      Building Permit Date
                    </label>
                    <input
                      type="date"
                      id="buildingPermitDate"
                      name="buildingPermitDate"
                      value={formData.buildingPermitDate}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-construction-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="planRevision" className="block text-sm font-medium text-gray-700 mb-2">
                      Plan Revision
                    </label>
                    <input
                      type="text"
                      id="planRevision"
                      name="planRevision"
                      value={formData.planRevision}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-construction-500"
                      placeholder="Rev A, Rev B, etc."
                    />
                  </div>

                  <div>
                    <label htmlFor="specificationVersion" className="block text-sm font-medium text-gray-700 mb-2">
                      Specification Version
                    </label>
                    <input
                      type="text"
                      id="specificationVersion"
                      name="specificationVersion"
                      value={formData.specificationVersion}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-construction-500"
                      placeholder="Version number"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="bondingCompany" className="block text-sm font-medium text-gray-700 mb-2">
                      Bonding Company
                    </label>
                    <input
                      type="text"
                      id="bondingCompany"
                      name="bondingCompany"
                      value={formData.bondingCompany}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-construction-500"
                      placeholder="Bonding company name"
                    />
                  </div>

                  <div>
                    <label htmlFor="bondAmount" className="block text-sm font-medium text-gray-700 mb-2">
                      Bond Amount
                    </label>
                    <input
                      type="number"
                      id="bondAmount"
                      name="bondAmount"
                      value={formData.bondAmount}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-construction-500"
                      placeholder="0"
                      min="0"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Safety Tab */}
            {activeTab === 'safety' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Safety & Quality</h3>
                
                <div>
                  <label htmlFor="safetyRequirements" className="block text-sm font-medium text-gray-700 mb-2">
                    Safety Requirements
                  </label>
                  <textarea
                    id="safetyRequirements"
                    name="safetyRequirements"
                    value={formData.safetyRequirements}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-construction-500"
                    placeholder="List safety requirements and standards"
                  />
                </div>

                <div>
                  <label htmlFor="qualityStandards" className="block text-sm font-medium text-gray-700 mb-2">
                    Quality Standards
                  </label>
                  <textarea
                    id="qualityStandards"
                    name="qualityStandards"
                    value={formData.qualityStandards}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-construction-500"
                    placeholder="Quality control standards and requirements"
                  />
                </div>

                <div>
                  <label htmlFor="environmentalRequirements" className="block text-sm font-medium text-gray-700 mb-2">
                    Environmental Requirements
                  </label>
                  <textarea
                    id="environmentalRequirements"
                    name="environmentalRequirements"
                    value={formData.environmentalRequirements}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-construction-500"
                    placeholder="Environmental compliance and sustainability requirements"
                  />
                </div>

                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Notes
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-construction-500"
                    placeholder="Any additional notes or special considerations"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center pt-6 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              Step {activeTab === 'basic' ? '1' : activeTab === 'job' ? '2' : activeTab === 'client' ? '3' : activeTab === 'schedule' ? '4' : activeTab === 'financial' ? '5' : activeTab === 'personnel' ? '6' : activeTab === 'permits' ? '7' : '8'} of 8
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
                  <>
                    <Building2 className="w-4 h-4 mr-2" />
                    Create Project
                  </>
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
