import React, { createContext, useContext, useState, useEffect } from 'react'

interface Project {
  id: number
  name: string
  description?: string
  status?: string
  budget?: number
  progress?: number
  startDate?: string
  endDate?: string
  location?: string
  
  // Job Information
  jobNumber?: string
  jobName?: string
  contractNumber?: string
  contractAmount?: number
  changeOrderAmount?: number
  totalContractAmount?: number
  
  // Client Information
  clientName?: string
  clientContact?: string
  clientPhone?: string
  clientEmail?: string
  clientAddress?: string
  
  // Project Details
  projectType?: string
  projectScope?: string
  buildingType?: string
  squareFootage?: number
  numberOfFloors?: number
  constructionType?: string
  
  // Dates and Schedule
  awardDate?: string
  noticeToProceeed?: string
  originalCompletionDate?: string
  revisedCompletionDate?: string
  substantialCompletionDate?: string
  finalCompletionDate?: string
  
  // Financial Information
  originalBudget?: number
  approvedBudget?: number
  currentBudget?: number
  costToDate?: number
  projectedFinalCost?: number
  contingency?: number
  
  // Personnel
  projectManager?: string
  superintendent?: string
  projectEngineer?: string
  safetyManager?: string
  qualityManager?: string
  
  // Subcontractors and Vendors
  generalContractor?: string
  architect?: string
  engineer?: string
  majorSubcontractors?: string[]
  keyVendors?: string[]
  
  // Permits and Approvals
  buildingPermitNumber?: string
  buildingPermitDate?: string
  occupancyPermitDate?: string
  certificateOfOccupancy?: string
  
  // Insurance and Bonding
  bondingCompany?: string
  bondAmount?: number
  insuranceCarrier?: string
  policyNumber?: string
  
  // Project Requirements
  retentionPercentage?: number
  warrantyPeriod?: string
  liquidatedDamages?: number
  milestones?: string[]
  
  // Safety and Quality
  safetyRequirements?: string[]
  qualityStandards?: string[]
  environmentalRequirements?: string[]
  
  // Documents and Specifications
  planRevision?: string
  specificationVersion?: string
  addendaNumbers?: string[]
  
  // Additional Information
  notes?: string
  specialRequirements?: string
  riskFactors?: string[]
  opportunities?: string[]
}

interface ProjectContextType {
  currentProject: Project | null
  setCurrentProject: (project: Project | null) => void
  isProjectSelected: boolean
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined)

export const useProject = () => {
  const context = useContext(ProjectContext)
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider')
  }
  return context
}

interface ProjectProviderProps {
  children: React.ReactNode
}

export const ProjectProvider: React.FC<ProjectProviderProps> = ({ children }) => {
  const [currentProject, setCurrentProject] = useState<Project | null>(null)

  // Load project from localStorage on mount
  useEffect(() => {
    const savedProject = localStorage.getItem('currentProject')
    if (savedProject) {
      try {
        setCurrentProject(JSON.parse(savedProject))
      } catch (error) {
        console.error('Failed to parse saved project:', error)
        localStorage.removeItem('currentProject')
      }
    }
  }, [])

  // Save project to localStorage when it changes
  useEffect(() => {
    if (currentProject) {
      localStorage.setItem('currentProject', JSON.stringify(currentProject))
    } else {
      localStorage.removeItem('currentProject')
    }
  }, [currentProject])

  const isProjectSelected = currentProject !== null

  const value: ProjectContextType = {
    currentProject,
    setCurrentProject,
    isProjectSelected,
  }

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  )
}
