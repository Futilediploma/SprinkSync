/**
 * Date parsing utilities for construction schedules
 * Handles various date formats commonly found in PDFs
 */

const MONTH_MAP: Record<string, number> = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11
}

/**
 * Parses date from string in various formats
 * Supports:
 * - 01-Jul-24
 * - 08-Apr-27
 * - 12/24/2024
 * - 2024-12-24
 */
export function parseDate(dateStr: string): Date | null {
  if (!dateStr || typeof dateStr !== 'string') return null

  const cleaned = dateStr.trim()

  // Pattern 1: DD-MMM-YY or DD-MMM-YYYY (e.g., "01-Jul-24")
  const ganttMatch = cleaned.match(/(\d{1,2})-([A-Za-z]{3})-(\d{2,4})/)
  if (ganttMatch) {
    return parseGanttDate(ganttMatch)
  }

  // Pattern 2: MM/DD/YYYY
  const slashMatch = cleaned.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/)
  if (slashMatch) {
    return parseSlashDate(slashMatch)
  }

  // Pattern 3: YYYY-MM-DD (ISO)
  const isoMatch = cleaned.match(/(\d{4})-(\d{1,2})-(\d{1,2})/)
  if (isoMatch) {
    return parseISODate(isoMatch)
  }

  return null
}

/**
 * Parses Gantt-style dates: DD-MMM-YY
 */
function parseGanttDate(match: RegExpMatchArray): Date | null {
  try {
    const day = parseInt(match[1], 10)
    const monthStr = match[2].toLowerCase()
    let year = parseInt(match[3], 10)

    // Handle 2-digit years
    if (year < 100) {
      year += year < 50 ? 2000 : 1900
    }

    const month = MONTH_MAP[monthStr]
    if (month === undefined) return null

    const date = new Date(year, month, day)

    // Validate date
    if (isNaN(date.getTime())) return null

    return date
  } catch {
    return null
  }
}

/**
 * Parses slash format: MM/DD/YYYY
 */
function parseSlashDate(match: RegExpMatchArray): Date | null {
  try {
    const month = parseInt(match[1], 10) - 1 // JS months are 0-indexed
    const day = parseInt(match[2], 10)
    let year = parseInt(match[3], 10)

    // Handle 2-digit years
    if (year < 100) {
      year += year < 50 ? 2000 : 1900
    }

    const date = new Date(year, month, day)

    // Validate date
    if (isNaN(date.getTime())) return null

    return date
  } catch {
    return null
  }
}

/**
 * Parses ISO format: YYYY-MM-DD
 */
function parseISODate(match: RegExpMatchArray): Date | null {
  try {
    const year = parseInt(match[1], 10)
    const month = parseInt(match[2], 10) - 1
    const day = parseInt(match[3], 10)

    const date = new Date(year, month, day)

    // Validate date
    if (isNaN(date.getTime())) return null

    return date
  } catch {
    return null
  }
}
