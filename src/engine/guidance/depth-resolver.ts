import type { Scalar } from "@/core/contracts/primitives";
import type {
  ReflectionDepthDirective,
  ReflectionDepthLevel,
} from "@/core/contracts/guidance/depth";
import { DEPTH_THRESHOLDS } from "./config";

function resolveLevel(depth: Scalar): ReflectionDepthLevel {
  if (depth <= DEPTH_THRESHOLDS.MINIMAL_MAX) return "minimal";
  if (depth <= DEPTH_THRESHOLDS.STANDARD_MAX) return "standard";
  if (depth <= DEPTH_THRESHOLDS.DEEP_MAX) return "deep";
  return "full";
}

export function resolveDepth(
  reflectionDepth: Scalar,
  reasoning: string[],
): ReflectionDepthDirective {
  const level = resolveLevel(reflectionDepth);

  const directive = DEPTH_DIRECTIVES[level];
  reasoning.push(
    `Reflection depth resolved to ${level.toUpperCase()} from reflectionDepth=${reflectionDepth}.`,
  );

  return directive;
}

const DEPTH_DIRECTIVES: Record<ReflectionDepthLevel, ReflectionDepthDirective> = {
  minimal: {
    level: "minimal",
    maxPrompts: 2,
    requireOpenEnded: false,
    includePatternQuestion: false,
    includeForwardQuestion: false,
    includeEmotionalCheck: false,
    suppressedPromptCodes: ["pattern", "forward", "emotional", "open"],
  },
  standard: {
    level: "standard",
    maxPrompts: 3,
    requireOpenEnded: true,
    includePatternQuestion: false,
    includeForwardQuestion: false,
    includeEmotionalCheck: false,
    suppressedPromptCodes: ["pattern", "forward", "emotional"],
  },
  deep: {
    level: "deep",
    maxPrompts: 4,
    requireOpenEnded: true,
    includePatternQuestion: true,
    includeForwardQuestion: true,
    includeEmotionalCheck: false,
    suppressedPromptCodes: ["emotional"],
  },
  full: {
    level: "full",
    maxPrompts: 5,
    requireOpenEnded: true,
    includePatternQuestion: true,
    includeForwardQuestion: true,
    includeEmotionalCheck: true,
    suppressedPromptCodes: [],
  },
};
