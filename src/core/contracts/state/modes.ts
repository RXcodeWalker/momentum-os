/** Temporary operational condition — not identity. */
export type UserMode = 'RECOVERY' | 'STABILIZING' | 'FOCUSED' | 'EXPANDING'

/** Long-term behavioral direction — independent of current mode. */
export type UserTrajectory = 'EXPANDING' | 'STABLE' | 'FRAGILE' | 'CONTRACTING'

