import * as pdfjsLib from 'pdfjs-dist'
import type { FireProtectionActivity } from '../types'
import {
  isFireProtectionActivity,
  findMatchingKeywords,
  detectPhase,
  calculateConfidence
} from './fireProtectionKeywords'
import { parseDate } from './dateParser'
import { checkLLMHealth, enhanceActivities } from './llmService'

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString()

interface TextItem {
  str: string
  x: number
  y: number
  width: number
}

/**
 * Main PDF parser - extracts fire protection activities from construction schedules
 * Enhanced with LLM intelligence for better accuracy
 */
export async function parsePDF(file: File, useLLM: boolean = true): Promise<FireProtectionActivity[]> {
  console.log('📄 Starting PDF parsing:', file.name)

  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

  console.log(`📊 PDF loaded: ${pdf.numPages} pages`)

  const activities: FireProtectionActivity[] = []

  // Extract text from each page
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum)
    const textContent = await page.getTextContent()

    // Group text items by Y coordinate (rows)
    const rows = groupItemsByRow(textContent.items)

    console.log(`Page ${pageNum}: Found ${rows.length} rows`)

    // Parse each row
    for (const row of rows) {
      const rowText = row.map(item => item.str).join(' ').trim()

      // Skip empty or very short rows
      if (rowText.length < 5) continue

      // Check if this row contains fire protection keywords
      if (isFireProtectionActivity(rowText)) {
        const activity = parseActivity(row, rowText)
        if (activity) {
          activities.push(activity)
        }
      }
    }
  }

  console.log(`✅ Extracted ${activities.length} fire protection activities (keyword-based)`)

  // Enhance with LLM if available and requested
  if (useLLM && activities.length > 0) {
    try {
      const llmAvailable = await checkLLMHealth()
      
      if (llmAvailable) {
        console.log('🤖 Enhancing activities with LLM intelligence...')
        const enhanced = await enhanceActivities(activities)
        
        // Merge LLM results with existing activities
        const mergedActivities = enhanced.activities.map((llmActivity, index) => ({
          ...activities[index],
          ...llmActivity
        }))

        console.log(`✨ LLM enhancement complete: ${enhanced.fire_protection_count}/${enhanced.total} confirmed FP activities`)
        return mergedActivities
      } else {
        console.log('ℹ️ LLM backend not available, using keyword-based parsing only')
      }
    } catch (error) {
      console.warn('⚠️ LLM enhancement failed, using keyword-based results:', error)
    }
  }

  return activities
}

/**
 * Groups text items into rows based on Y coordinate
 */
function groupItemsByRow(items: any[]): TextItem[][] {
  const rows = new Map<number, TextItem[]>()

  for (const item of items) {
    if (!('str' in item) || !item.str.trim()) continue

    const textItem: TextItem = {
      str: item.str.trim(),
      x: item.transform[4],
      y: item.transform[5],
      width: item.width || 0
    }

    // Round Y coordinate to group items in same row (within 2 units)
    const roundedY = Math.round(textItem.y / 2) * 2

    if (!rows.has(roundedY)) {
      rows.set(roundedY, [])
    }
    rows.get(roundedY)!.push(textItem)
  }

  // Sort rows top to bottom, and items within rows left to right
  return Array.from(rows.values())
    .map(row => row.sort((a, b) => a.x - b.x))
    .sort((a, b) => b[0].y - a[0].y)
}

/**
 * Parses a single activity from a row of text items
 */
function parseActivity(row: TextItem[], rowText: string): FireProtectionActivity | null {
  // Extract activity ID (common patterns: numbers, letter-number combos)
  const activityId = extractActivityId(rowText)

  // Find matching keywords
  const keywords = findMatchingKeywords(rowText)

  // Detect phase
  const phase = detectPhase(rowText)

  // Extract dates
  const { startDate, finishDate, duration } = extractDates(row)

  // Extract clean activity name (remove ID and clean up)
  const name = extractActivityName(rowText, activityId)

  // Calculate confidence
  const confidence = calculateConfidence(
    rowText,
    !!activityId,
    !!(startDate || finishDate),
    keywords
  )

  return {
    name,
    activityId,
    phase,
    startDate,
    finishDate,
    duration,
    confidence,
    keywords,
    rawText: rowText
  }
}

/**
 * Extracts activity ID from text
 */
function extractActivityId(text: string): string | undefined {
  // Common patterns:
  // - A1234, ID-123, 1.2.3, etc.
  const patterns = [
    /\b([A-Z]{1,3}[\d]{2,})\b/i, // A1234, FP123
    /\b([\d]{1,5})\b(?=\s)/,      // 1234 (followed by space)
    /\b([\d]+\.[\d]+(?:\.[\d]+)?)\b/ // 1.2.3
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      return match[1]
    }
  }

  return undefined
}

/**
 * Extracts clean activity name
 */
function extractActivityName(text: string, activityId?: string): string {
  let name = text

  // Remove activity ID if found
  if (activityId) {
    name = name.replace(activityId, '').trim()
  }

  // Remove leading/trailing special characters
  name = name.replace(/^[:\-\.\,\s]+|[:\-\.\,\s]+$/g, '')

  // Clean up multiple spaces
  name = name.replace(/\s+/g, ' ')

  return name
}

/**
 * Extracts dates and duration from row
 */
function extractDates(row: TextItem[]): {
  startDate?: string
  finishDate?: string
  duration?: number
} {
  const dates: Date[] = []

  // Check each text item for dates
  for (const item of row) {
    const date = parseDate(item.str)
    if (date) {
      dates.push(date)
    }
  }

  // Also check combined text for date patterns
  const fullText = row.map(r => r.str).join(' ')
  const additionalDates = extractDatesFromText(fullText)
  dates.push(...additionalDates)

  // Sort dates chronologically
  dates.sort((a, b) => a.getTime() - b.getTime())

  // Remove duplicates
  const uniqueDates = dates.filter((date, index, self) =>
    index === self.findIndex(d => d.getTime() === date.getTime())
  )

  const result: {
    startDate?: string
    finishDate?: string
    duration?: number
  } = {}

  if (uniqueDates.length >= 1) {
    result.startDate = formatDate(uniqueDates[0])
  }

  if (uniqueDates.length >= 2) {
    result.finishDate = formatDate(uniqueDates[1])

    // Calculate duration in days
    const diffTime = uniqueDates[1].getTime() - uniqueDates[0].getTime()
    result.duration = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  return result
}

/**
 * Extracts dates from text using regex patterns
 */
function extractDatesFromText(text: string): Date[] {
  const dates: Date[] = []

  // Pattern: 01-Jul-24, 08-Apr-27
  const pattern = /\b(\d{1,2})-([A-Za-z]{3})-(\d{2,4})\b/g
  let match

  while ((match = pattern.exec(text)) !== null) {
    const date = parseDate(match[0])
    if (date) {
      dates.push(date)
    }
  }

  return dates
}

/**
 * Formats date as MM/DD/YYYY
 */
function formatDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const year = date.getFullYear()
  return `${month}/${day}/${year}`
}
