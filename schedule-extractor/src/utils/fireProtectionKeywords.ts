import type { FPPhase, Confidence } from '../types'

/**
 * Fire Protection Keywords organized by phase
 * More specific to avoid catching general construction activities
 */
export const FP_KEYWORDS = {
  // Strong indicators - these alone indicate FP work
  strongCore: [
    'sprinkler', 'sprink', 'fire protection', 'fire suppression',
    'fire alarm', 'fa system', 'vesda', 'fire pump',
    'standpipe', 'fire line', 'fire main', 'fire riser',
    'nfpa', 'fire service', 'fdc', 'fire department connection',
    'wet system', 'dry system', 'deluge', 'pre-action',
    'fire hydrant', 'backflow preventer', 'backflow assembly'
  ],

  // Weak indicators - need to be combined with activity context
  weakCore: [
    'fp', 'fs', 'suppression'
  ],

  // MEP context - when combined with rough-in/overhead indicates FP
  mepContext: [
    'mep overhead', 'mep oh', 'mep rough', 'mep rough-in', 'mep roughin',
    'overhead mep', 'oh mep'
  ],

  // Ceiling work - critical for sprinkler head installation
  ceiling: [
    'ceiling close', 'ceiling close in', 'ceiling close-in',
    'drop ceiling', 'tile ceiling', 'grid ceiling', 'ceiling grid',
    't-bar', 'tbar', 'ceiling tile', 'drop tile'
  ],

  mobilization: [
    'sprinkler permit', 'fire protection permit', 'fire alarm permit',
    'fire line permit', 'underground fire', 'fp permit', 'fs permit'
  ],

  underground: [
    'fire protection underground', 'sprinkler underground', 'fire line underground',
    'underground fire', 'fire main underground', 'fire service underground',
    'fp underground', 'fp u/g', 'sprinkler u/g'
  ],

  overhead: [
    'fire protection overhead', 'fire protection oh', 'fire protection rough',
    'sprinkler overhead', 'sprinkler oh', 'sprinkler rough',
    'fp overhead', 'fp oh', 'fp rough', 'fs overhead', 'fs oh',
    'fire alarm overhead', 'fire alarm rough', 'fa rough',
    'branch line', 'fire protection piping', 'sprinkler piping'
  ],

  testing: [
    'fire protection test', 'sprinkler test', 'fire alarm test',
    'hydro test', 'hydrotest', 'hydrostatic test',
    'fire protection flush', 'sprinkler flush',
    'flow test', 'pressure test', 'air test',
    'fp test', 'fs test', 'fa test'
  ],

  inspections: [
    'fire protection inspection', 'sprinkler inspection', 'fire alarm inspection',
    'fp inspection', 'fs inspection', 'fa inspection',
    'fire marshal', 'fire marshal inspection',
    'underground fire inspection', 'rough fire inspection',
    'final fire inspection', 'sprinkler final'
  ],

  trimFinal: [
    'sprinkler head', 'head install', 'sprinkler trim',
    'fire protection trim', 'fp trim', 'escutcheon',
    'cover plate', 'sprinkler cover', 'fire alarm device',
    'smoke detector', 'heat detector'
  ],

  commissioning: [
    'fire protection commission', 'sprinkler commission', 'fire alarm commission',
    'fp commissioning', 'fa commissioning', 'fire protection startup',
    'sprinkler system startup', 'fire alarm startup'
  ]
}

/**
 * Detects if text contains fire protection keywords
 * Uses multi-level matching for better accuracy
 */
export function isFireProtectionActivity(text: string): boolean {
  const lowerText = text.toLowerCase()

  // Level 1: Strong core keywords (definite FP work)
  if (FP_KEYWORDS.strongCore.some(keyword => lowerText.includes(keyword))) {
    return true
  }

  // Level 2: MEP context keywords (MEP overhead rough-in, etc.)
  if (FP_KEYWORDS.mepContext.some(keyword => lowerText.includes(keyword))) {
    return true
  }

  // Level 3: Ceiling work (usually indicates sprinkler head installation)
  if (FP_KEYWORDS.ceiling.some(keyword => lowerText.includes(keyword))) {
    // Only if it also mentions inspection, install, or close
    if (
      lowerText.includes('inspection') ||
      lowerText.includes('install') ||
      lowerText.includes('close')
    ) {
      return true
    }
  }

  // Level 4: Weak core + activity context
  const hasWeakCore = FP_KEYWORDS.weakCore.some(keyword => lowerText.includes(keyword))
  if (hasWeakCore) {
    const hasActivityContext =
      lowerText.includes('rough') ||
      lowerText.includes('overhead') ||
      lowerText.includes('oh ') ||
      lowerText.includes('underground') ||
      lowerText.includes('u/g') ||
      lowerText.includes('test') ||
      lowerText.includes('inspection')

    if (hasActivityContext) {
      return true
    }
  }

  // Level 5: Phase-specific keywords
  const allPhaseKeywords = [
    ...FP_KEYWORDS.mobilization,
    ...FP_KEYWORDS.underground,
    ...FP_KEYWORDS.overhead,
    ...FP_KEYWORDS.testing,
    ...FP_KEYWORDS.inspections,
    ...FP_KEYWORDS.trimFinal,
    ...FP_KEYWORDS.commissioning
  ]

  return allPhaseKeywords.some(keyword => lowerText.includes(keyword))
}

/**
 * Finds all matching keywords in text
 */
export function findMatchingKeywords(text: string): string[] {
  const lowerText = text.toLowerCase()
  const matches: string[] = []

  // Check all keyword categories
  const allKeywords = [
    ...FP_KEYWORDS.strongCore,
    ...FP_KEYWORDS.weakCore,
    ...FP_KEYWORDS.mepContext,
    ...FP_KEYWORDS.ceiling
  ]

  for (const keyword of allKeywords) {
    if (lowerText.includes(keyword)) {
      matches.push(keyword)
    }
  }

  return [...new Set(matches)] // Remove duplicates
}

/**
 * Determines the phase of a fire protection activity
 */
export function detectPhase(text: string): FPPhase {
  const lowerText = text.toLowerCase()

  // Priority order: Testing > Inspections > Trim > Underground > Overhead > Commissioning > Mobilization

  if (FP_KEYWORDS.testing.some(kw => lowerText.includes(kw))) {
    return 'Testing'
  }

  if (FP_KEYWORDS.inspections.some(kw => lowerText.includes(kw))) {
    return 'Inspections'
  }

  if (FP_KEYWORDS.trimFinal.some(kw => lowerText.includes(kw))) {
    return 'Trim & Final'
  }

  // Check for ceiling work - usually trim phase
  if (FP_KEYWORDS.ceiling.some(kw => lowerText.includes(kw))) {
    return 'Trim & Final'
  }

  if (FP_KEYWORDS.underground.some(kw => lowerText.includes(kw))) {
    return 'Underground'
  }

  if (FP_KEYWORDS.overhead.some(kw => lowerText.includes(kw))) {
    return 'Overhead Rough-in'
  }

  // MEP context usually means rough-in
  if (FP_KEYWORDS.mepContext.some(kw => lowerText.includes(kw))) {
    return 'Overhead Rough-in'
  }

  if (FP_KEYWORDS.commissioning.some(kw => lowerText.includes(kw))) {
    return 'Commissioning'
  }

  if (FP_KEYWORDS.mobilization.some(kw => lowerText.includes(kw))) {
    return 'Mobilization'
  }

  // If we have strong FP keywords but no phase, guess based on common terms
  if (lowerText.includes('rough') || lowerText.includes('piping')) {
    return 'Overhead Rough-in'
  }

  if (lowerText.includes('permit') || lowerText.includes('submit')) {
    return 'Mobilization'
  }

  return 'Unknown'
}

/**
 * Calculates confidence level based on keyword matches and data completeness
 */
export function calculateConfidence(
  text: string,
  hasActivityId: boolean,
  hasDates: boolean,
  keywords: string[]
): Confidence {
  let score = 0
  const lowerText = text.toLowerCase()

  // Strong FP keywords = +3 (very confident)
  const hasStrongKeyword = FP_KEYWORDS.strongCore.some(kw => lowerText.includes(kw))
  if (hasStrongKeyword) {
    score += 3
  }

  // MEP context = +2 (confident in context)
  const hasMepContext = FP_KEYWORDS.mepContext.some(kw => lowerText.includes(kw))
  if (hasMepContext) {
    score += 2
  }

  // Multiple keywords = +1
  if (keywords.length >= 2) {
    score += 1
  }

  // Has activity ID = +1
  if (hasActivityId) {
    score += 1
  }

  // Has dates = +1
  if (hasDates) {
    score += 1
  }

  // Specific phase indicators = +1
  const hasPhaseIndicator =
    lowerText.includes('rough') ||
    lowerText.includes('underground') ||
    lowerText.includes('test') ||
    lowerText.includes('inspection') ||
    lowerText.includes('trim') ||
    lowerText.includes('ceiling')

  if (hasPhaseIndicator) {
    score += 1
  }

  if (score >= 5) return 'high'
  if (score >= 3) return 'medium'
  return 'low'
}
