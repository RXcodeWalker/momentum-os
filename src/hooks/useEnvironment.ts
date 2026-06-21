import { useApp } from '@/lib/store'
import type { CommittedEnvironmentSnapshot } from '@/engine/environment'

export function useEnvironment(): CommittedEnvironmentSnapshot {
  return useApp((s) => s.committedEnvironment)
}
