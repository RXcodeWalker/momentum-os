import { describe, it, expect } from 'vitest'
import { applyModeBaseline } from '../../baseline/mode-baseline'
import { mergeDirectives } from '../../directives/merge-directives'
import type { AdaptationDirective } from '@/core/contracts/adaptation/directives'

function makeNoopRecorder() {
  return { record: () => {}, flush: () => undefined }
}

function makeDirective(field: string, value: number | boolean | string): AdaptationDirective {
  return { field, suggestedValue: value, reason: 'test' }
}

describe('mergeDirectives', () => {
  it('known path execution.visibleTaskLimit: value applied', () => {
    const draft = applyModeBaseline('FOCUSED', makeNoopRecorder())
    expect(draft.visibleTaskLimit).toBe(6)
    mergeDirectives(draft, [makeDirective('execution.visibleTaskLimit', 10)], makeNoopRecorder())
    expect(draft.visibleTaskLimit).toBe(10)
  })

  it('unknown path unknown.badField: silently skipped, no throw', () => {
    const draft = applyModeBaseline('FOCUSED', makeNoopRecorder())
    const before = { ...draft }
    expect(() => {
      mergeDirectives(draft, [makeDirective('unknown.badField', 99)], makeNoopRecorder())
    }).not.toThrow()
    expect(draft.visibleTaskLimit).toBe(before.visibleTaskLimit)
  })

  it('directives bypass clamping: set visibleTaskLimit=15 → output is 15 (not clamped)', () => {
    const draft = applyModeBaseline('FOCUSED', makeNoopRecorder())
    mergeDirectives(draft, [makeDirective('execution.visibleTaskLimit', 15)], makeNoopRecorder())
    expect(draft.visibleTaskLimit).toBe(15)
  })

  it('multiple directives on same field: last wins', () => {
    const draft = applyModeBaseline('FOCUSED', makeNoopRecorder())
    mergeDirectives(draft, [
      makeDirective('execution.visibleTaskLimit', 3),
      makeDirective('execution.visibleTaskLimit', 7),
    ], makeNoopRecorder())
    expect(draft.visibleTaskLimit).toBe(7)
  })

  it('boolean deepWorkProtectionEnabled=false via directive: applied', () => {
    const draft = applyModeBaseline('FOCUSED', makeNoopRecorder())
    expect(draft.deepWorkProtectionEnabled).toBe(true)
    mergeDirectives(draft, [makeDirective('environmental.deepWorkProtectionEnabled', false)], makeNoopRecorder())
    expect(draft.deepWorkProtectionEnabled).toBe(false)
  })

  it('environmental.interfaceDensity directive: applied', () => {
    const draft = applyModeBaseline('FOCUSED', makeNoopRecorder())
    mergeDirectives(draft, [makeDirective('environmental.interfaceDensity', 90)], makeNoopRecorder())
    expect(draft.interfaceDensity).toBe(90)
  })

  it('guidance.emotionalPressureLevel directive: applied', () => {
    const draft = applyModeBaseline('FOCUSED', makeNoopRecorder())
    mergeDirectives(draft, [makeDirective('guidance.emotionalPressureLevel', 5)], makeNoopRecorder())
    expect(draft.emotionalPressureLevel).toBe(5)
  })

  it('empty directives: no-op', () => {
    const draft = applyModeBaseline('FOCUSED', makeNoopRecorder())
    const before = { ...draft }
    mergeDirectives(draft, [], makeNoopRecorder())
    expect(draft.visibleTaskLimit).toBe(before.visibleTaskLimit)
    expect(draft.interfaceDensity).toBe(before.interfaceDensity)
  })

  it('records directive layer entries for applied fields', () => {
    const entries: unknown[] = []
    const recorder = {
      record: (...args: unknown[]) => entries.push(args),
      flush: () => undefined,
    }
    const draft = applyModeBaseline('FOCUSED', makeNoopRecorder())
    mergeDirectives(draft, [makeDirective('execution.visibleTaskLimit', 10)], recorder)
    const directiveEntries = (entries as unknown[][]).filter(e => e[3] === 'directive')
    expect(directiveEntries.length).toBeGreaterThan(0)
  })
})
