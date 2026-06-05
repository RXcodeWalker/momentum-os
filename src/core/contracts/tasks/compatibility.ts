import type { UserMode } from '../state/modes'

export type CompatibilityBand = 'HARMFUL' | 'FRAGILE' | 'COMPATIBLE' | 'OPTIMAL'

export type StateCompatibility = Record<UserMode, CompatibilityBand>

