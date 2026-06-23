import { describe, it, expect } from "vitest";
import { applyModeBaseline } from "../../baseline/mode-baseline";
import { MODE_ENV_BASELINES, MODE_EXEC_BASELINES, MODE_GUIDANCE_BASELINES } from "../../config";

function makeNoopRecorder() {
  return { record: () => {}, flush: () => undefined };
}

describe("applyModeBaseline", () => {
  it("RECOVERY: populates all 23 draft fields", () => {
    const draft = applyModeBaseline("RECOVERY", makeNoopRecorder());
    // Environmental (10)
    expect(draft.interfaceDensity).toBeDefined();
    expect(draft.spacingIntensity).toBeDefined();
    expect(draft.visualNoiseLevel).toBeDefined();
    expect(draft.motionIntensity).toBeDefined();
    expect(draft.pacingFeel).toBeDefined();
    expect(draft.hierarchySharpness).toBeDefined();
    expect(draft.contrastStrength).toBeDefined();
    expect(draft.visibleComplexity).toBeDefined();
    expect(typeof draft.deepWorkProtectionEnabled).toBe("boolean");
    expect(draft.dashboardCompressionLevel).toBeDefined();
    // Execution (8)
    expect(draft.visibleTaskLimit).toBeDefined();
    expect(draft.recommendedChallengeLevel).toBeDefined();
    expect(draft.workloadCompressionRatio).toBeDefined();
    expect(draft.pacingRecommendation).toBeDefined();
    expect(draft.deepWorkExpectation).toBeDefined();
    expect(draft.recoveryWeighting).toBeDefined();
    expect(draft.advancementWeighting).toBeDefined();
    expect(draft.focusProtectionStrength).toBeDefined();
    // Guidance (5)
    expect(draft.interventionFrequency).toBeDefined();
    expect(draft.reflectionDepth).toBeDefined();
    expect(draft.strategicGuidanceWeight).toBeDefined();
    expect(draft.emotionalPressureLevel).toBeDefined();
    expect(draft.clarityOrientation).toBeDefined();
  });

  it("RECOVERY: visibleTaskLimit=2, interfaceDensity=30, deepWorkProtectionEnabled=true", () => {
    const draft = applyModeBaseline("RECOVERY", makeNoopRecorder());
    expect(draft.visibleTaskLimit).toBe(2);
    expect(draft.interfaceDensity).toBe(30);
    expect(draft.deepWorkProtectionEnabled).toBe(true);
  });

  it("EXPANDING: visibleTaskLimit=8, interfaceDensity=85, deepWorkProtectionEnabled=false", () => {
    const draft = applyModeBaseline("EXPANDING", makeNoopRecorder());
    expect(draft.visibleTaskLimit).toBe(8);
    expect(draft.interfaceDensity).toBe(85);
    expect(draft.deepWorkProtectionEnabled).toBe(false);
  });

  it("FOCUSED baseline matches MODE_*_BASELINES.FOCUSED exactly", () => {
    const draft = applyModeBaseline("FOCUSED", makeNoopRecorder());
    const envRef = MODE_ENV_BASELINES.FOCUSED;
    const execRef = MODE_EXEC_BASELINES.FOCUSED;
    const guidRef = MODE_GUIDANCE_BASELINES.FOCUSED;

    expect(draft.interfaceDensity).toBe(envRef.interfaceDensity);
    expect(draft.spacingIntensity).toBe(envRef.spacingIntensity);
    expect(draft.visualNoiseLevel).toBe(envRef.visualNoiseLevel);
    expect(draft.deepWorkProtectionEnabled).toBe(envRef.deepWorkProtectionEnabled);
    expect(draft.visibleTaskLimit).toBe(execRef.visibleTaskLimit);
    expect(draft.recoveryWeighting).toBe(execRef.recoveryWeighting);
    expect(draft.advancementWeighting).toBe(execRef.advancementWeighting);
    expect(draft.interventionFrequency).toBe(guidRef.interventionFrequency);
    expect(draft.emotionalPressureLevel).toBe(guidRef.emotionalPressureLevel);
  });

  it("STABILIZING baseline matches MODE_*_BASELINES.STABILIZING exactly", () => {
    const draft = applyModeBaseline("STABILIZING", makeNoopRecorder());
    const envRef = MODE_ENV_BASELINES.STABILIZING;
    const execRef = MODE_EXEC_BASELINES.STABILIZING;
    expect(draft.interfaceDensity).toBe(envRef.interfaceDensity);
    expect(draft.visibleTaskLimit).toBe(execRef.visibleTaskLimit);
  });

  it("records baseline entries for all modes", () => {
    const entries: unknown[] = [];
    const recorder = {
      record: (...args: unknown[]) => entries.push(args),
      flush: () => undefined,
    };
    applyModeBaseline("FOCUSED", recorder);
    expect(entries.length).toBeGreaterThan(0);
    // All entries should have layer = 'baseline'
    for (const e of entries as unknown[][]) {
      expect(e[3]).toBe("baseline");
    }
  });

  it("deepWorkProtectionEnabled: RECOVERY=true, STABILIZING=false, FOCUSED=true, EXPANDING=false", () => {
    expect(applyModeBaseline("RECOVERY", makeNoopRecorder()).deepWorkProtectionEnabled).toBe(true);
    expect(applyModeBaseline("STABILIZING", makeNoopRecorder()).deepWorkProtectionEnabled).toBe(
      false,
    );
    expect(applyModeBaseline("FOCUSED", makeNoopRecorder()).deepWorkProtectionEnabled).toBe(true);
    expect(applyModeBaseline("EXPANDING", makeNoopRecorder()).deepWorkProtectionEnabled).toBe(
      false,
    );
  });
});
