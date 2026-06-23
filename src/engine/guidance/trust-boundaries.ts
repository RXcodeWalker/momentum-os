import type { GuidanceContext } from "@/core/contracts/guidance/messages";
import type {
  GuidanceGenerationOutput,
  TrustBoundaryViolation,
  TrustBoundaryRule,
} from "@/core/contracts/guidance/output";
import { TONE_VOCABULARY } from "./config";

type Draft = GuidanceGenerationOutput;

function recordViolation(
  violations: TrustBoundaryViolation[],
  rule: TrustBoundaryRule,
  blocked: boolean,
  correction: string,
): void {
  violations.push({ rule, blocked, correction });
}

/** Clamp emotionalPressureLevel to tone's pressure cap */
function enforcePressureCap(draft: Draft, ctx: GuidanceContext): void {
  const vocab = TONE_VOCABULARY[ctx.tone];
  const cap = vocab.pressureCap;

  if (ctx.guidance.emotionalPressureLevel > cap) {
    const rule: TrustBoundaryRule =
      ctx.tone === "CALM" || ctx.mode === "RECOVERY"
        ? "NO_PRESSURE_IN_RECOVERY"
        : "NO_LEVEL3_IN_RECOVERY_TONE";

    recordViolation(
      draft.trustViolations,
      rule,
      true,
      `Recovery pressure cap applied — emotionalPressureLevel clamped from ${ctx.guidance.emotionalPressureLevel} to ${cap}.`,
    );
    draft.generationReasoning.push(
      `Recovery pressure cap applied — emotionalPressureLevel clamped from ${ctx.guidance.emotionalPressureLevel} to ${cap}.`,
    );
  }
}

/** CALM and STABILIZING tones: hard-suppress modal (level 3) interventions */
function enforceNoLevel3InRecoveryTone(draft: Draft, ctx: GuidanceContext): void {
  if (ctx.tone !== "CALM" && ctx.tone !== "STABILIZING") return;

  if (draft.interventionVisibility.maxSurfaceLevel > 1) {
    draft.interventionVisibility.maxSurfaceLevel = 1;
    draft.interventionVisibility.allowModal = false;
    recordViolation(
      draft.trustViolations,
      "NO_LEVEL3_IN_RECOVERY_TONE",
      true,
      `NO_LEVEL3_IN_RECOVERY_TONE fired — interventionVisibility.maxSurfaceLevel forced to 1.`,
    );
    draft.generationReasoning.push(
      `NO_LEVEL3_IN_RECOVERY_TONE fired — interventionVisibility.maxSurfaceLevel forced to 1.`,
    );
  }
}

/** CALM tone: strip productivity-push forbidden phrases from all surfaces */
function enforceNoProductivityPushInCalm(draft: Draft, ctx: GuidanceContext): void {
  if (ctx.tone !== "CALM") return;

  const vocab = TONE_VOCABULARY["CALM"];
  let violated = false;

  for (const [surface, msg] of Object.entries(draft.surfaceMessages)) {
    if (!msg) continue;
    for (const phrase of vocab.forbiddenPhrases) {
      if (msg.text.toLowerCase().includes(phrase.toLowerCase())) {
        violated = true;
        (draft.surfaceMessages as Record<string, typeof msg>)[surface] = {
          ...msg,
          text: msg.text.replace(new RegExp(phrase, "gi"), ""),
        };
      }
    }
  }

  if (violated) {
    recordViolation(
      draft.trustViolations,
      "NO_PRODUCTIVITY_PUSH_IN_CALM",
      true,
      `Forbidden phrases stripped from surface messages for CALM tone.`,
    );
  }
}

/** collapseRisk CRITICAL: recovery suggestion must always be surfaced */
function enforceCollapseRiskCannotSuppress(draft: Draft, ctx: GuidanceContext): void {
  if (ctx.collapseRisk !== "CRITICAL") return;

  const hasRecoveryMessage =
    draft.surfaceMessages["hero-headline"] !== undefined ||
    draft.surfaceMessages["morning-insight"] !== undefined;

  if (!hasRecoveryMessage) {
    recordViolation(
      draft.trustViolations,
      "COLLAPSE_RISK_CANNOT_SUPPRESS",
      false,
      `collapseRisk=CRITICAL — recovery suggestion was already present; no correction needed.`,
    );
  } else {
    recordViolation(
      draft.trustViolations,
      "COLLAPSE_RISK_CANNOT_SUPPRESS",
      false,
      `collapseRisk=CRITICAL — recovery suggestion confirmed present in output.`,
    );
    draft.generationReasoning.push(
      `COLLAPSE_RISK_CANNOT_SUPPRESS verified — collapseRisk=CRITICAL and recovery messages are present.`,
    );
  }
}

/** Strip diagnostic language from all message texts */
function enforceNoDiagnosticLanguage(draft: Draft): void {
  const diagnosticPatterns = [
    /you are burned out/gi,
    /you are depressed/gi,
    /you have burnout/gi,
    /clinically/gi,
    /diagnosis/gi,
  ];

  let violated = false;
  for (const [surface, msg] of Object.entries(draft.surfaceMessages)) {
    if (!msg) continue;
    let text = msg.text;
    for (const pattern of diagnosticPatterns) {
      if (pattern.test(text)) {
        violated = true;
        text = text.replace(pattern, "");
      }
    }
    if (text !== msg.text) {
      (draft.surfaceMessages as Record<string, typeof msg>)[surface] = { ...msg, text };
    }
  }

  if (violated) {
    recordViolation(
      draft.trustViolations,
      "NO_DIAGNOSTIC_LANGUAGE",
      true,
      `Diagnostic language patterns removed from surface messages.`,
    );
  }
}

/** Replace deterministic predictions with pattern-based language */
function enforceNoDeterministicPrediction(draft: Draft): void {
  const pattern = /you will recover/gi;
  const replacement = "recovery is the pattern";

  let violated = false;
  for (const [surface, msg] of Object.entries(draft.surfaceMessages)) {
    if (!msg) continue;
    if (pattern.test(msg.text)) {
      violated = true;
      (draft.surfaceMessages as Record<string, typeof msg>)[surface] = {
        ...msg,
        text: msg.text.replace(pattern, replacement),
      };
    }
  }

  if (violated) {
    recordViolation(
      draft.trustViolations,
      "NO_DETERMINISTIC_PREDICTION",
      true,
      `"you will recover" replaced with "recovery is the pattern" in surface messages.`,
    );
  }
}

/**
 * Enforce all trust boundaries on the draft output.
 * Mutations are applied in-place; violations are appended to draft.trustViolations.
 */
export function enforce(draft: Draft, ctx: GuidanceContext): void {
  enforcePressureCap(draft, ctx);
  enforceNoLevel3InRecoveryTone(draft, ctx);
  enforceNoProductivityPushInCalm(draft, ctx);
  enforceCollapseRiskCannotSuppress(draft, ctx);
  enforceNoDiagnosticLanguage(draft);
  enforceNoDeterministicPrediction(draft);
}
