import type { ConfidenceBand, TrendDirection } from '../primitives'
import type { ReplayEntry } from './entry'
import type { ReplayWindowScope } from './window'

export type WindowSummary = {
  avgExecutionScore: number
  momentumDirection: TrendDirection
  evidenceDays: number
  scopeLabel: string
}

export type ReplayNarrative = {
  windowScope: ReplayWindowScope
  entries: ReplayEntry[]
  windowSummary: WindowSummary
  confidence: ConfidenceBand
  suppressed: boolean
  suppressionReason: string | null
}
