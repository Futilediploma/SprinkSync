/**
 * LLM Service for intelligent activity classification
 * Connects to local Ollama backend
 */

const API_BASE_URL = 'http://localhost:3001/api'

export interface LLMClassification {
  is_fire_protection: boolean
  confidence: number
  category: 'underground' | 'rough_in' | 'equipment' | 'testing' | 'inspection' | 'trim_final' | 'commissioning' | 'unknown'
  reasoning: string
  suggestion: string
  phase?: string
  error?: string
}

export interface LLMEnhancedActivity {
  name: string
  activityId?: string
  phase: string
  startDate?: string
  finishDate?: string
  duration?: number
  confidence: string
  keywords: string[]
  rawText: string
  llm_classification?: boolean
  llm_confidence?: number
  llm_category?: string
  llm_reasoning?: string
  llm_suggestion?: string
  llm_phase?: string
}

/**
 * Check if LLM backend is available
 */
export async function checkLLMHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000) // 5 second timeout
    })

    if (!response.ok) return false

    const data = await response.json()
    return data.status === 'ok' && data.ollama_connected && data.model_available
  } catch (error) {
    console.warn('LLM backend not available:', error)
    return false
  }
}

/**
 * Classify a single activity using LLM
 */
export async function classifyActivity(
  activity: string,
  context: string[] = [],
  projectType: string = 'commercial'
): Promise<LLMClassification> {
  try {
    const response = await fetch(`${API_BASE_URL}/classify-activity`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        activity,
        context,
        projectType
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('LLM classification error:', error)
    throw error
  }
}

/**
 * Classify multiple activities in batch
 */
export async function classifyBatch(
  activities: string[] | Array<{ activity: string, context?: string[] }>,
  projectType: string = 'commercial'
): Promise<Array<LLMClassification & { activity: string }>> {
  try {
    const response = await fetch(`${API_BASE_URL}/classify-batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        activities,
        projectType
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data.results
  } catch (error) {
    console.error('LLM batch classification error:', error)
    throw error
  }
}

/**
 * Enhance existing parsed activities with LLM intelligence
 */
export async function enhanceActivities(
  activities: Array<{ name: string, [key: string]: any }>,
  projectType: string = 'commercial'
): Promise<{
  activities: LLMEnhancedActivity[]
  total: number
  fire_protection_count: number
}> {
  const BATCH_SIZE = 100 // Process 100 activities at a time (5 concurrent per backend batch)
  const allEnhanced: LLMEnhancedActivity[] = []

  try {
    // Process in batches to avoid payload size issues
    for (let i = 0; i < activities.length; i += BATCH_SIZE) {
      const batch = activities.slice(i, i + BATCH_SIZE)
      const batchNum = Math.floor(i / BATCH_SIZE) + 1
      const totalBatches = Math.ceil(activities.length / BATCH_SIZE)
      
      console.log(`Processing batch ${batchNum}/${totalBatches} (${batch.length} activities)...`)

      const response = await fetch(`${API_BASE_URL}/enhance-activities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          activities: batch,
          projectType
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      allEnhanced.push(...data.activities)
    }

    const fpCount = allEnhanced.filter(a => a.llm_classification).length

    return {
      activities: allEnhanced,
      total: allEnhanced.length,
      fire_protection_count: fpCount
    }
  } catch (error) {
    console.error('LLM enhancement error:', error)
    throw error
  }
}

/**
 * Submit correction to backend for learning
 */
export async function submitCorrection(
  activity: string,
  context: string[],
  wasFireProtection: boolean,
  shouldBeFireProtection: boolean,
  userNote: string = ''
): Promise<void> {
  try {
    // Send to local backend (always)
    const response = await fetch(`${API_BASE_URL}/learn-correction`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        activity,
        context,
        wasFireProtection,
        shouldBeFireProtection,
        userNote
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    console.log('Correction submitted successfully')

    // Optionally send anonymous feedback to cloud (if user opted in)
    const telemetryEnabled = localStorage.getItem('sprinksync_telemetry_enabled') === 'true'
    if (telemetryEnabled) {
      try {
        await fetch('https://api.sprinksync.com/v1/feedback', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'X-App-Version': '1.0.0'
          },
          body: JSON.stringify({
            type: 'correction',
            activity_text: activity,
            ai_classification: wasFireProtection,
            correct_classification: shouldBeFireProtection,
            context: context.slice(0, 2), // Only first 2 for privacy
            note: userNote,
            timestamp: new Date().toISOString()
          }),
          signal: AbortSignal.timeout(3000)
        }).catch(() => {
          // Silently fail - telemetry should never break UX
        })
      } catch {
        // Ignore telemetry errors
      }
    }
  } catch (error) {
    console.error('Error submitting correction:', error)
    throw error
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  keys: number
  stats: any
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/cache-stats`, {
      method: 'GET'
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error getting cache stats:', error)
    throw error
  }
}

/**
 * Clear the LLM response cache
 */
export async function clearCache(): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/cache-clear`, {
      method: 'POST'
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    console.log('Cache cleared successfully')
  } catch (error) {
    console.error('Error clearing cache:', error)
    throw error
  }
}
