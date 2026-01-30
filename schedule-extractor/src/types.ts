/**
 * Fire Protection Activity Phases
 * Standardized phases for fire protection work
 */
export type FPPhase =
  | 'Mobilization'
  | 'Underground'
  | 'Overhead Rough-in'
  | 'Testing'
  | 'Inspections'
  | 'Trim & Final'
  | 'Commissioning'
  | 'Unknown'

/**
 * Confidence level for parsed data
 */
export type Confidence = 'high' | 'medium' | 'low'

/**
 * Parsed Fire Protection Activity
 */
export interface FireProtectionActivity {
  name: string
  activityId?: string
  phase: FPPhase
  startDate?: string
  finishDate?: string
  duration?: number
  confidence: Confidence
  keywords: string[]
  rawText: string
  // LLM-enhanced fields
  llm_classification?: boolean
  llm_confidence?: number
  llm_category?: string
  llm_reasoning?: string
  llm_suggestion?: string
  llm_phase?: string
  showReasoning?: boolean
}

