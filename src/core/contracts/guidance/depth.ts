export type ReflectionDepthLevel = 'minimal' | 'standard' | 'deep' | 'full'

export type ReflectionDepthDirective = {
  level: ReflectionDepthLevel
  maxPrompts: number
  requireOpenEnded: boolean
  includePatternQuestion: boolean
  includeForwardQuestion: boolean
  includeEmotionalCheck: boolean
  suppressedPromptCodes: string[]
}
