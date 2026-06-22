import type { PatternTemplate } from "@/core/contracts/patterns/template";
import type { PatternEvidence } from "@/core/contracts/patterns/evidence";
import type { PatternAssociation, PatternConfounder } from "@/core/contracts/patterns/association";
import type { PatternObservation } from "@/core/contracts/patterns/evidence";

export function computeAssociation(
  observations: PatternObservation[],
  template: PatternTemplate,
  allTemplateObservations: Map<string, PatternObservation[]>,
): PatternAssociation {
  const antecedentDays = observations.filter((o) => o.antecedentPresent);
  const supportingDays = antecedentDays.filter((o) => o.consequentPresent);
  const contradictingDays = antecedentDays.filter((o) => !o.consequentPresent);
  const totalConsequent = observations.filter((o) => o.consequentPresent).length;
  const total = observations.length;

  const antecedentOccurrences = antecedentDays.length;
  const conditionalRate =
    antecedentOccurrences > 0 ? supportingDays.length / antecedentOccurrences : 0;
  const baseRate = total > 0 ? totalConsequent / total : 0;
  const lift = baseRate > 0 ? conditionalRate / baseRate : 0;
  const riskDifference = conditionalRate - baseRate;

  const magnitudes = supportingDays.map((o) => o.magnitude).filter((m): m is number => m !== null);
  const avgMagnitude =
    magnitudes.length > 0 ? magnitudes.reduce((a, b) => a + b, 0) / magnitudes.length : null;

  // Direction stability: split window in two halves
  const mid = Math.floor(observations.length / 2);
  const firstHalf = observations.slice(0, mid);
  const secondHalf = observations.slice(mid);

  function halfRiskDiff(half: PatternObservation[]): number {
    const ant = half.filter((o) => o.antecedentPresent);
    const sup = ant.filter((o) => o.consequentPresent);
    const con = half.filter((o) => o.consequentPresent);
    const cr = ant.length > 0 ? sup.length / ant.length : 0;
    const br = half.length > 0 ? con.length / half.length : 0;
    return cr - br;
  }

  const rd1 = halfRiskDiff(firstHalf);
  const rd2 = halfRiskDiff(secondHalf);
  const directionStable = Math.sign(rd1) === Math.sign(rd2) && Math.sign(rd1) !== 0;

  const meetsMinSupport = antecedentOccurrences >= template.minSupport;

  // Confounder detection
  const confounders: PatternConfounder[] = [];

  if (!meetsMinSupport) {
    confounders.push({
      kind: "SMALL_SAMPLE",
      note: `Antecedent occurred only ${antecedentOccurrences} time(s); minimum is ${template.minSupport}.`,
    });
  }

  if (Math.abs(lift - 1) < 0.25 && Math.abs(riskDifference) < 0.15) {
    confounders.push({
      kind: "WEAK_LIFT",
      note: `Lift is ${lift.toFixed(2)} — this relationship is not meaningfully stronger than chance.`,
    });
  }

  if (baseRate > 0.6) {
    confounders.push({
      kind: "HIGH_BASE_RATE",
      note: `The outcome occurs ${Math.round(baseRate * 100)}% of all days, so association has low explanatory value.`,
    });
  }

  const evidenceDays = observations.length;
  const windowDays = Math.max(1, total);
  if (evidenceDays > 0 && total > 0 && evidenceDays / windowDays < 0.4) {
    confounders.push({
      kind: "SPARSE_COVERAGE",
      note: "Less than 40% of window days have sufficient data for this pattern.",
    });
  }

  if (!directionStable && antecedentOccurrences >= template.minSupport) {
    confounders.push({
      kind: "RECENT_REVERSAL",
      note: "The relationship direction reversed between the first and second half of the observation window.",
    });
  }

  // Co-varying factor detection: does another antecedent co-occur on ≥60% of supporting days?
  for (const [otherTemplateId, otherObs] of allTemplateObservations.entries()) {
    if (otherTemplateId === template.templateId) continue;
    const otherAntMap = new Map(otherObs.map((o) => [o.date, o.antecedentPresent]));
    const coVaryCount = supportingDays.filter((o) => otherAntMap.get(o.date) === true).length;
    if (supportingDays.length > 0 && coVaryCount / supportingDays.length >= 0.6) {
      confounders.push({
        kind: "CO_VARYING_FACTOR",
        note: `Another condition (template: ${otherTemplateId}) co-occurs on ${Math.round((coVaryCount / supportingDays.length) * 100)}% of supporting days.`,
      });
      break; // one CO_VARYING_FACTOR is enough
    }
  }

  const evidence: PatternEvidence = buildEvidence(observations);

  return {
    conditionalRate,
    baseRate,
    lift,
    riskDifference,
    avgMagnitude,
    sampleSize: total,
    meetsMinSupport,
    directionStable,
    confounders,
  };
}

function buildEvidence(observations: PatternObservation[]): PatternEvidence {
  const supporting = observations.filter((o) => o.antecedentPresent && o.consequentPresent);
  const contradicting = observations.filter((o) => o.antecedentPresent && !o.consequentPresent);
  const antecedentOccurrences = observations.filter((o) => o.antecedentPresent).length;

  const confirmationDates = supporting.map((o) => o.date).sort();
  const contradictionDates = contradicting.map((o) => o.date).sort();

  // Recurrence spread: number of distinct ISO weeks with a confirmation
  const isoWeeks = new Set(confirmationDates.map(isoWeek));
  const recurrenceSpread = isoWeeks.size;

  return {
    supportingCount: supporting.length,
    contradictingCount: contradicting.length,
    antecedentOccurrences,
    totalObservations: observations.length,
    recurrenceSpread,
    observations,
    lastConfirmationDate: confirmationDates[confirmationDates.length - 1] ?? null,
    lastContradictionDate: contradictionDates[contradictionDates.length - 1] ?? null,
  };
}

function isoWeek(dateStr: string): string {
  const d = new Date(dateStr);
  const dayOfWeek = (d.getDay() + 6) % 7;
  const thursday = new Date(d);
  thursday.setDate(d.getDate() - dayOfWeek + 3);
  const jan1 = new Date(thursday.getFullYear(), 0, 1);
  const weekNum = Math.ceil(((thursday.getTime() - jan1.getTime()) / 86400000 + 1) / 7);
  return `${thursday.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

export { buildEvidence };
