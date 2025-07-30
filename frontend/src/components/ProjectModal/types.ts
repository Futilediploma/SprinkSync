export interface FormData {
  // Basic Information
  name: string
  description: string
  location: string
  budget: string
  startDate: string
  endDate: string
  status: string
  
  // Job Information
  jobNumber: string
  jobName: string
  contractNumber: string
  contractAmount: string
  changeOrderAmount: string
  totalContractAmount: string
  
  // Client Information
  clientName: string
  clientContact: string
  clientPhone: string
  clientEmail: string
  clientAddress: string
  
  // Project Details
  projectType: string
  projectScope: string
  buildingType: string
  squareFootage: string
  numberOfFloors: string
  constructionType: string
  
  // Personnel
  projectManager: string
  superintendent: string
  projectEngineer: string
  safetyManager: string
  qualityManager: string
  
  // Dates and Schedule
  awardDate: string
  noticeToProceeed: string
  originalCompletionDate: string
  revisedCompletionDate: string
  substantialCompletionDate: string
  finalCompletionDate: string
  
  // Permits and Approvals
  buildingPermitNumber: string
  buildingPermitDate: string
  occupancyPermitDate: string
  certificateOfOccupancy: string
  
  // Financial Information
  originalBudget: string
  approvedBudget: string
  currentBudget: string
  costToDate: string
  projectedFinalCost: string
  contingency: string
  retentionPercentage: string
  liquidatedDamages: string
  
  // Subcontractors and Vendors
  generalContractor: string
  architect: string
  engineer: string
  majorSubcontractors: string
  keyVendors: string
  
  // Insurance and Bonding
  bondingCompany: string
  bondAmount: string
  insuranceCarrier: string
  policyNumber: string
  
  // Project Requirements
  warrantyPeriod: string
  milestones: string
  
  // Safety and Quality
  safetyRequirements: string
  qualityStandards: string
  environmentalRequirements: string
  
  // Documents and Specifications
  planRevision: string
  specificationVersion: string
  addendaNumbers: string
  
  // Additional Information
  notes: string
  specialRequirements: string
  riskFactors: string
  opportunities: string
}
