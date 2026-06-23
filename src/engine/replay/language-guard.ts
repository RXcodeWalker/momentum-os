import type { ReplaySection } from "@/core/contracts/replay/result";
import type { TrustViolation } from "@/core/contracts/replay/result";

// Causal replacements — never imply causation
const CAUSAL_REPLACEMENTS: [RegExp, string][] = [
  [/\bcaused\b/gi, "coincided with"],
  [/\bbecause\b/gi, "in contexts where"],
  [/\bled to\b/gi, "preceded"],
  [/\bresulted in\b/gi, "was followed by"],
  [/\bmakes you\b/gi, "tends to appear before"],
  [/\bdue to\b/gi, "in patterns where"],
  [/\btriggered by\b/gi, "observed alongside"],
  [/\bdrove\b/gi, "appeared before"],
  [/\bcreated\b/gi, "preceded"],
  [/\bproduced\b/gi, "was followed by"],
];

// Diagnostic labels — strip by returning empty string (handled by stripping surrounding sentence)
const DIAGNOSTIC_PATTERN =
  /\b(burned out|depressed|have burnout|clinically|diagnosis|diagnose|medical|disorder|syndrome)\b/gi;

// Deterministic prediction replacements
const PREDICTION_REPLACEMENTS: [RegExp, string][] = [
  [/\byou will\b/gi, "patterns suggest"],
  [/\bexpect to\b/gi, "patterns have tended toward"],
  [/\bguaranteed\b/gi, "commonly observed"],
  [/\balways\b/gi, "has often"],
  [/\bnever\b/gi, "has rarely"],
];

// Formula leak detection
const FORMULA_PATTERN = /\b(weight\s*=|coefficient|0\.\d{2,}|recoveryDebt\s*[=<>]|×|\bscore\s*=)/i;

export type LanguageGuardResult = {
  text: string;
  violations: TrustViolation[];
  causalGuardFired: boolean;
  diagnosticGuardFired: boolean;
  formulaGuardFired: boolean;
};

export function guardText(text: string, section: ReplaySection): LanguageGuardResult {
  let result = text;
  const violations: TrustViolation[] = [];
  let causalGuardFired = false;
  let diagnosticGuardFired = false;
  let formulaGuardFired = false;

  for (const [pattern, replacement] of CAUSAL_REPLACEMENTS) {
    if (pattern.test(result)) {
      causalGuardFired = true;
      violations.push({ section, rule: "causal", correction: `replaced with "${replacement}"` });
      result = result.replace(pattern, replacement);
    }
  }

  if (DIAGNOSTIC_PATTERN.test(result)) {
    diagnosticGuardFired = true;
    violations.push({ section, rule: "diagnostic", correction: "diagnostic label stripped" });
    result = result.replace(DIAGNOSTIC_PATTERN, "");
    if (import.meta.env.DEV) {
      console.error(
        `[ReplayLanguageGuard] Diagnostic label found and stripped in section "${section}": "${text}"`,
      );
    }
  }

  for (const [pattern, replacement] of PREDICTION_REPLACEMENTS) {
    if (pattern.test(result)) {
      violations.push({
        section,
        rule: "prediction",
        correction: `replaced with "${replacement}"`,
      });
      result = result.replace(pattern, replacement);
    }
  }

  if (FORMULA_PATTERN.test(result)) {
    formulaGuardFired = true;
    violations.push({ section, rule: "formula", correction: "formula expression stripped" });
    result = result.replace(FORMULA_PATTERN, "");
    if (import.meta.env.DEV) {
      console.error(
        `[ReplayLanguageGuard] Formula leak found and stripped in section "${section}": "${text}"`,
      );
    }
  }

  return {
    text: result.trim(),
    violations,
    causalGuardFired,
    diagnosticGuardFired,
    formulaGuardFired,
  };
}

export function guardAllText(texts: Array<{ text: string; section: ReplaySection }>): {
  results: LanguageGuardResult[];
  violations: TrustViolation[];
  causalGuardFired: boolean;
  diagnosticGuardFired: boolean;
  formulaGuardFired: boolean;
} {
  const results = texts.map(({ text, section }) => guardText(text, section));
  return {
    results,
    violations: results.flatMap((r) => r.violations),
    causalGuardFired: results.some((r) => r.causalGuardFired),
    diagnosticGuardFired: results.some((r) => r.diagnosticGuardFired),
    formulaGuardFired: results.some((r) => r.formulaGuardFired),
  };
}
