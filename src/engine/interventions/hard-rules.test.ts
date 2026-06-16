import { describe, expect, it } from 'vitest'
import { applyHardRules } from './suppression/hard-rules'
import type { InterventionCandidate } from './types/internal'
import type { UserState } from '@/core/contracts/state/user-state'
import type { InterventionAuditRecord } from '@/core/contracts/interventions/audit'
import type { ReentryProtocol } from '@/core/contracts/reentry/protocol'
import { makeUserState } from '@/testing/fixtures/task-intelligence'

const NOW = Date.now()

function makeCandidate(type: InterventionCandidate['type']): InterventionCandidate {
  return { type, matchedSignals: ['RECOVERY_COLLAPSE'], minSignalDuration: 3, evidenceScore: 75 }
}

function makeAuditRecord(
  type: InterventionAuditRecord['type'],
  level: 0 | 1 | 2 | 3,
  hoursAgo: number,
): InterventionAuditRecord {
  return {
    interventionId: `test-${type}-${hoursAgo}`,
    type,
    level,
    firedAt: new Date(NOW - hoursAgo * 60 * 60 * 1000).toISOString(),
    flowPhase: 'morning',
    cooldownDurationHours: 24,
  }
}

// ---------------------------------------------------------------------------
// frictionCeiling
// ---------------------------------------------------------------------------

describe('hard rule: frictionCeiling', () => {
  const highFrictionState = makeUserState('FOCUSED', { emotionalFriction: 90 })

  it('suppresses T2 (OVERLOAD) when emotionalFriction > 85', () => {
    const verdicts = applyHardRules([makeCandidate('OVERLOAD')], highFrictionState, [], undefined, NOW)
    expect(verdicts[0].suppressed).toBe(true)
    expect(verdicts[0].rule).toBe('FRICTION_CEILING')
  })

  it('suppresses T3 (AVOIDANCE_INTERRUPTION) when emotionalFriction > 85', () => {
    const verdicts = applyHardRules([makeCandidate('AVOIDANCE_INTERRUPTION')], highFrictionState, [], undefined, NOW)
    expect(verdicts[0].suppressed).toBe(true)
  })

  it('does NOT suppress T0 (BURNOUT_PREVENTION) at friction=90 — C-2 regression guard', () => {
    const verdicts = applyHardRules([makeCandidate('BURNOUT_PREVENTION')], highFrictionState, [], undefined, NOW)
    expect(verdicts[0].suppressed).toBe(false)
  })

  it('does NOT suppress T1 (RECOVERY_ENFORCEMENT) at friction=90 — C-2 regression guard', () => {
    const verdicts = applyHardRules([makeCandidate('RECOVERY_ENFORCEMENT')], highFrictionState, [], undefined, NOW)
    expect(verdicts[0].suppressed).toBe(false)
  })

  it('does not suppress any type at friction=84 (below ceiling)', () => {
    const normalState = makeUserState('FOCUSED', { emotionalFriction: 84 })
    for (const type of ['BURNOUT_PREVENTION', 'OVERLOAD', 'AVOIDANCE_INTERRUPTION'] as const) {
      const verdicts = applyHardRules([makeCandidate(type)], normalState, [], undefined, NOW)
      expect(verdicts[0].suppressed).toBe(false)
    }
  })
})

// ---------------------------------------------------------------------------
// level2Fatigue
// ---------------------------------------------------------------------------

describe('hard rule: level2Fatigue', () => {
  const normalState = makeUserState('FOCUSED')
  const twoRecentL2: InterventionAuditRecord[] = [
    makeAuditRecord('OVERLOAD', 2, 10),
    makeAuditRecord('FRAGMENTATION_REDUCTION', 2, 20),
  ]

  it('suppresses T2 (OVERLOAD) when 2 level-2 interventions fired in 48h', () => {
    const verdicts = applyHardRules([makeCandidate('OVERLOAD')], normalState, twoRecentL2, undefined, NOW)
    expect(verdicts[0].suppressed).toBe(true)
    expect(verdicts[0].rule).toBe('RECENT_LEVEL2_FATIGUE')
  })

  it('does NOT suppress T0 (BURNOUT_PREVENTION) with 2 recent L2 records — C-3 regression guard', () => {
    const verdicts = applyHardRules([makeCandidate('BURNOUT_PREVENTION')], normalState, twoRecentL2, undefined, NOW)
    expect(verdicts[0].suppressed).toBe(false)
  })

  it('does NOT suppress T1 (RECOVERY_ENFORCEMENT) with 2 recent L2 records — C-3 regression guard', () => {
    const verdicts = applyHardRules([makeCandidate('RECOVERY_ENFORCEMENT')], normalState, twoRecentL2, undefined, NOW)
    expect(verdicts[0].suppressed).toBe(false)
  })

  it('does not suppress when only 1 level-2 record exists', () => {
    const oneRecord = [makeAuditRecord('OVERLOAD', 2, 10)]
    const verdicts = applyHardRules([makeCandidate('OVERLOAD')], normalState, oneRecord, undefined, NOW)
    expect(verdicts[0].suppressed).toBe(false)
  })

  it('does not suppress when level-2 records are older than 48h', () => {
    const oldRecords = [
      makeAuditRecord('OVERLOAD', 2, 50),
      makeAuditRecord('FRAGMENTATION_REDUCTION', 2, 60),
    ]
    const verdicts = applyHardRules([makeCandidate('OVERLOAD')], normalState, oldRecords, undefined, NOW)
    expect(verdicts[0].suppressed).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// reentryLock
// ---------------------------------------------------------------------------

describe('hard rule: reentryLock', () => {
  const normalState = makeUserState('RECOVERY')
  const reentry: ReentryProtocol = {
    currentStage: 'ASSESSMENT',
    backlogCompressionEnabled: true,
    visibleScopeReduction: 70,
    restartFrictionFactors: ['OVERWHELM'],
    recoveryPriorityWeight: 80,
    rhythmRebuildIntensity: 40,
  }

  it('suppresses non-RESTART_ASSISTANCE candidates during ASSESSMENT stage', () => {
    const verdicts = applyHardRules([makeCandidate('OVERLOAD')], normalState, [], reentry, NOW)
    expect(verdicts[0].suppressed).toBe(true)
    expect(verdicts[0].rule).toBe('REENTRY_LOCK')
  })

  it('allows RESTART_ASSISTANCE through during ASSESSMENT stage', () => {
    const verdicts = applyHardRules([makeCandidate('RESTART_ASSISTANCE')], normalState, [], reentry, NOW)
    expect(verdicts[0].suppressed).toBe(false)
  })

  it('does not lock during RHYTHM_REBUILD stage', () => {
    const lateReentry: ReentryProtocol = { ...reentry, currentStage: 'RHYTHM_REBUILD' }
    const verdicts = applyHardRules([makeCandidate('OVERLOAD')], normalState, [], lateReentry, NOW)
    expect(verdicts[0].suppressed).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// C-1: mutation safety — verify hard rules never return shared state
// ---------------------------------------------------------------------------

describe('hard rules: output isolation (C-1 regression guard)', () => {
  it('returns fresh verdict arrays on each call', () => {
    const state = makeUserState('FOCUSED')
    const result1 = applyHardRules([makeCandidate('OVERLOAD')], state, [], undefined, NOW)
    const result2 = applyHardRules([makeCandidate('OVERLOAD')], state, [], undefined, NOW)
    result1[0].rule = 'MUTATED'
    expect(result2[0].rule).toBe('')
  })
})
