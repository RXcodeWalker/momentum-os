MOMENTUM OS — ENGINE CONTRACTS v1
Behavioral Intelligence Layer Specification
This document defines the canonical engine contracts for Momentum OS.
These contracts are not frontend models.
They are the behavioral operating system interfaces that govern:
	• state interpretation
	• task intelligence
	• intervention orchestration
	• adaptation logic
	• trajectory regulation
	• recovery balancing
	• execution sequencing
	• behavioral trust boundaries
This is the layer that prevents the product from degenerating into:
	• aesthetic productivity theater
	• fake AI insight
	• glorified task management
	• engagement optimization disguised as self-improvement
The system exists to regulate:
	the relationship between ambition, cognition, recovery, and meaningful execution.
NOT:
	maximize activity.
Built from the principles established in the state engine, task intelligence, intervention matrix, and daily flow specifications.

1. CORE ENGINE PHILOSOPHY
The engine must optimize for:
	• sustainable capability expansion
	• meaningful advancement
	• behavioral honesty
	• cognitive stability
	• intentional execution
	• adaptive pacing
	• long-term resilience growth
The engine must NOT optimize for:
	• streak preservation
	• compulsive engagement
	• raw completion count
	• dopamine reinforcement
	• endless optimization
	• fake “high performance”
	• emotional dependency
The engine interprets:
	probabilistic behavioral patterns
NOT:
	psychological truth.

2. ENGINE ARCHITECTURE OVERVIEW
type BehavioralEngine = {
  stateInterpreter: StateInterpreter
  trajectoryAnalyzer: TrajectoryAnalyzer
  taskIntelligenceEngine: TaskIntelligenceEngine
  interventionOrchestrator: InterventionOrchestrator
  adaptationEngine: AdaptationEngine
  sequencingEngine: SequencingEngine
  recoveryRegulator: RecoveryRegulator
  reentryEngine: ReentryEngine
}

3. CORE ENUM CONTRACTS
User Modes
type UserMode =
  | "RECOVERY"
  | "STABILIZING"
  | "FOCUSED"
  | "EXPANDING"
These are:
	• temporary environments
	• adaptive operational conditions
NOT:
	• identities
	• labels
	• personality types

Trajectory Types
type UserTrajectory =
  | "EXPANDING"
  | "STABLE"
  | "FRAGILE"
  | "CONTRACTING"
Trajectory represents:
	• long-term behavioral direction
Mode represents:
	• current operational condition
A user may be:
	• in RECOVERY mode
	• while still maintaining an EXPANDING trajectory
That distinction is critical.

Intervention Levels
type InterventionLevel =
  | 0 // silent adaptation
  | 1 // soft guidance
  | 2 // active interruption
  | 3 // structural intervention

Task Categories
type TaskCategory =
  | "MAINTENANCE"
  | "RECOVERY"
  | "GROWTH"
  | "ADVANCEMENT"
  | "SUPPORT"
These represent:
	• systemic contribution
NOT:
	• moral worth

4. CORE USER STATE CONTRACT
This is the canonical behavioral state object.
type UserState = {
  recoveryDebt: Scalar
  cognitiveStrain: Scalar
  executionStability: Scalar
  emotionalFriction: Scalar
  momentumIntegrity: Scalar
  resilienceCapacity: Scalar
overwhelmLevel: Scalar
  fragmentationLevel: Scalar
  recoveryCapacity: Scalar
  meaningfulEngagement: Scalar
  deepWorkContinuity: Scalar
  behavioralVolatility: Scalar
currentMode: UserMode
  currentTrajectory: UserTrajectory
overloadRisk: RiskLevel
  burnoutRisk: RiskLevel
  avoidanceRisk: RiskLevel
  collapseRisk: RiskLevel
adaptationReadiness: Scalar
  expansionReadiness: Scalar
consistencyTrend: TrendDirection
  recoveryTrend: TrendDirection
  engagementTrend: TrendDirection
stateConfidence: number
lastUpdatedAt: Timestamp
}

5. PRIMITIVE ENGINE TYPES
type Scalar = number // normalized 0–100

type Timestamp = string
type TrendDirection =
  | "RISING"
  | "STABLE"
  | "DECLINING"
type RiskLevel =
  | "LOW"
  | "MODERATE"
  | "HIGH"
  | "CRITICAL"
type ConfidenceBand =
  | "LOW"
  | "MEDIUM"
  | "HIGH"

6. STATE DIMENSION CONTRACTS
Recovery Debt
type RecoveryDebtModel = {
  sleepQuality: number
  sleepConsistency: number
  sustainedIntensity: number
  recoveryBehaviorQuality: number
  exhaustionAccumulation: number
}
Represents:
	• accumulated restoration deficit
High recovery debt reduces:
	• cognitive adaptability
	• emotional regulation
	• sustainable advancement capacity

Cognitive Strain
type CognitiveStrainModel = {
  taskSwitchingRate: number
  ambiguityExposure: number
  interruptionDensity: number
  activeCommitmentLoad: number
  deepWorkDegradation: number
}
Represents:
	• overload and mental fragmentation

Execution Stability
type ExecutionStabilityModel = {
  meaningfulCompletionIntegrity: number
  rhythmConsistency: number
  followThroughReliability: number
  pacingStability: number
  volatilityResistance: number
}
Represents:
	• sustainable execution quality over time
NOT:
	• productivity quantity

Emotional Friction
type EmotionalFrictionModel = {
  initiationResistance: number
  avoidancePressure: number
  perfectionismPressure: number
  overwhelmWeight: number
  uncertaintyResistance: number
}
Represents:
	• resistance toward meaningful engagement

7. TASK CONTRACTS
Canonical Task Interface
type Task = {
  id: string
title: string
  description?: string
category: TaskCategory
meaningfulness: number
  cognitiveLoad: number
  emotionalResistance: number
  ambiguity: number
  reversibilityRisk: number
  recoveryCost: number
  fragmentationRisk: number
momentumContribution: number
  recoveryCompatibility: number
  deepWorkCompatibility: number
timeHorizon: TimeHorizon
  leverageWeight: number
executionQuality?: number
  initiationDelay?: number
  repeatedDeferralCount: number
stateCompatibility: StateCompatibility
estimatedDuration?: number
createdAt: Timestamp
  updatedAt: Timestamp
}

Time Horizon
type TimeHorizon =
  | "IMMEDIATE"
  | "MEDIUM"
  | "LONG"
Long horizon tasks often create:
	• higher resistance
	• higher ambiguity
	• greater future compounding

State Compatibility
type StateCompatibility = {
  RECOVERY: CompatibilityBand
  STABILIZING: CompatibilityBand
  FOCUSED: CompatibilityBand
  EXPANDING: CompatibilityBand
}
type CompatibilityBand =
  | "HARMFUL"
  | "FRAGILE"
  | "COMPATIBLE"
  | "OPTIMAL"
A task appropriate in EXPANDING mode may become:
	• destructive in RECOVERY mode
This prevents:
	• contextless productivity logic

8. TASK INTELLIGENCE OUTPUTS
Execution Weight
type ExecutionWeight = {
  meaningfulnessWeight: number
  executionQualityWeight: number
  momentumContributionWeight: number
  goalAlignmentWeight: number
  recoveryCompatibilityWeight: number
finalExecutionWeight: number
}

Resistance Weight
type ResistanceWeight = {
  emotionalResistanceWeight: number
  ambiguityWeight: number
  reversibilityWeight: number
  initiationDelayWeight: number
finalResistanceWeight: number
}

Recovery Burden
type RecoveryBurden = {
  cognitiveBurden: number
  depletionBurden: number
  fragmentationBurden: number
totalBurdenScore: number
}
This directly influences:
	• pacing
	• sequencing
	• adaptation compression
	• intervention sensitivity

9. TASK SEQUENCING CONTRACTS
type SequencingDecision = {
  recommendedPrimaryTask?: Task
  recommendedSecondaryTask?: Task
suppressedTasks: Task[]
  compressedTasks: Task[]
sequencingReasoning: string[]
expectedRecoveryImpact: number
  expectedMomentumImpact: number
recommendedFocusWindow?: number
sequencingConfidence: number
}
The sequencing engine prioritizes:
	• behavioral sustainability
	• meaningful movement
	• cognitive coherence
NOT:
	• maximum throughput

10. INTERVENTION CONTRACTS
Canonical Intervention Interface
type Intervention = {
  id: string
type: InterventionType
  level: InterventionLevel
triggerReasoning: string[]
emotionalGoal: string
  behavioralObjective: string
interventionMessage?: string
uiAdaptations: UIAdaptation[]
  executionAdaptations: ExecutionAdaptation[]
suppressionEligible: boolean
cooldownDurationHours: number
generatedAt: Timestamp
}

Intervention Types
type InterventionType =
  | "OVERLOAD"
  | "BURNOUT_PREVENTION"
  | "AVOIDANCE_INTERRUPTION"
  | "MOMENTUM_EXPANSION"
  | "DEEP_WORK_PROTECTION"
  | "RECOVERY_ENFORCEMENT"
  | "RESTART_ASSISTANCE"
  | "FRAGMENTATION_REDUCTION"
  | "CAPABILITY_CONTRACTION"

11. INTERVENTION TRIGGER CONTRACTS
type InterventionTrigger = {
  triggerType: InterventionType
requiredSignals: BehavioralSignal[]
  minimumConfidence: number
escalationThreshold?: number
suppressionRules: SuppressionRule[]
cooldownPolicy: CooldownPolicy
}

Behavioral Signals
type BehavioralSignal =
  | "RISING_FRAGMENTATION"
  | "DECLINING_EXECUTION_QUALITY"
  | "RECOVERY_COLLAPSE"
  | "AVOIDANCE_CLUSTERING"
  | "MEANINGFULNESS_DEFERRAL"
  | "OVERCOMMITMENT_EXPANSION"
  | "DEEP_WORK_DEGRADATION"
  | "VOLATILITY_ACCELERATION"
  | "PLANNING_ESCAPE"
  | "PACING_INSTABILITY"

12. ADAPTATION ENGINE CONTRACTS
Canonical Adaptation Output
type AdaptationOutput = {
  environmental: EnvironmentalAdaptation
  execution: ExecutionAdaptation
  guidance: GuidanceAdaptation
adaptationReasoning: string[]
adaptationIntensity: number
generatedFromState: UserState
}

13. ENVIRONMENTAL ADAPTATION CONTRACT
type EnvironmentalAdaptation = {
  interfaceDensity: number
  spacingIntensity: number
  visualNoiseLevel: number
  motionIntensity: number
  pacingFeel: number
hierarchySharpness: number
  contrastStrength: number
visibleComplexity: number
deepWorkProtectionEnabled: boolean
dashboardCompressionLevel: number
}
This governs:
	• emotional regulation through interface
One of the biggest risks in your product:
	treating UI as decoration instead of behavioral infrastructure.
This contract prevents that.

14. EXECUTION ADAPTATION CONTRACT
type ExecutionAdaptation = {
  visibleTaskLimit: number
recommendedChallengeLevel: number
workloadCompressionRatio: number
pacingRecommendation: PacingRecommendation
deepWorkExpectation: number
recoveryWeighting: number
advancementWeighting: number
focusProtectionStrength: number
}

Pacing Recommendation
type PacingRecommendation =
  | "REDUCE_LOAD"
  | "MAINTAIN_RHYTHM"
  | "PROTECT_CONTINUITY"
  | "INCREASE_CHALLENGE"
  | "COMPRESS_SCOPE"

15. GUIDANCE ADAPTATION CONTRACT
type GuidanceAdaptation = {
  messagingTone: MessagingTone
interventionFrequency: number
reflectionDepth: number
strategicGuidanceWeight: number
emotionalPressureLevel: number
clarityOrientation: number
}

Messaging Tone
type MessagingTone =
  | "CALM"
  | "STEADY"
  | "FOCUSED"
  | "CHALLENGING"
  | "STABILIZING"
  | "OBSERVATIONAL"

16. DAILY FLOW OUTPUT CONTRACTS
Morning Calibration Output
type MorningCalibrationOutput = {
  interpretedState: UserState
recommendedPrimaryFocus?: Task
  recommendedSecondaryFocus?: Task
orientationMessage: string
workloadRecommendation: number
adaptationOutput: AdaptationOutput
intervention?: Intervention
}

Midday Regulation Output
type MiddayRegulationOutput = {
  driftDetected: boolean
fragmentationLevel: number
deepWorkIntegrity: number
recalibrationNeeded: boolean
recommendedIntervention?: Intervention
environmentAdjustment?: EnvironmentalAdaptation
}

Evening Reflection Output
type EveningReflectionOutput = {
  executionIntegrity: number
meaningfulProgressQuality: number
recoveryImpact: number
behavioralInsights: BehavioralInsight[]
tomorrowOrientation?: string
updatedTrajectory: UserTrajectory
}

17. BEHAVIORAL INSIGHT CONTRACTS
type BehavioralInsight = {
  observation: string
confidence: ConfidenceBand
supportingSignals: BehavioralSignal[]
interventionEligible: boolean
}
IMPORTANT:
Insights must remain:
	• interpretable
	• challengeable
	• probabilistic
NEVER:
	• authoritative psychological claims

18. RE-ENTRY ENGINE CONTRACTS
type ReentryProtocol = {
  backlogCompressionEnabled: boolean
visibleScopeReduction: number
restartFrictionFactors: RestartFriction[]
recommendedReentryTask?: Task
recoveryPriorityWeight: number
rhythmRebuildIntensity: number
}

Restart Friction Factors
type RestartFriction =
  | "OVERWHELM"
  | "SHAME"
  | "UNCERTAINTY"
  | "EXHAUSTION"
  | "AVOIDANCE"
  | "COGNITIVE_CHAOS"

19. STATE TRANSITION CONTRACTS
type StateTransition = {
  from: UserMode
  to: UserMode
confidence: number
supportingFactors: string[]
sustainedSignalDurationDays: number
reversible: boolean
}
Transitions must require:
	• sustained signals
	• multi-factor confirmation
	• behavioral consistency
This prevents:
	• reactive state thrashing
	• fake intelligence
	• emotional instability caused by the product

20. TRUST BOUNDARY CONTRACTS
Forbidden Behaviors
type ForbiddenEngineBehavior =
  | "FAKE_CERTAINTY"
  | "PSYCHOLOGICAL_DIAGNOSIS"
  | "SHAME_MANIPULATION"
  | "COMPULSIVE_ENGAGEMENT_OPTIMIZATION"
  | "PRODUCTIVITY_MORALIZATION"
  | "FABRICATED_CAUSALITY"
  | "FAKE_AI_LANGUAGE"
  | "IDENTITY_LABELING"

Trust Layer
type TrustBoundary = {
  interpretabilityRequired: boolean
probabilisticLanguageRequired: boolean
psychologicalClaimsForbidden: boolean
emotionalManipulationForbidden: boolean
addictionOptimizationForbidden: boolean
interventionRestraintRequired: boolean
}

21. ENGINE OUTPUT PIPELINE
This is the actual operational flow.
type BehavioralPipeline = {
  inputCollection: DailyInputs
stateInterpretation: UserState
trajectoryAnalysis: UserTrajectory
taskEvaluation: TaskEvaluation[]
sequencingDecision: SequencingDecision
interventionEvaluation: Intervention[]
adaptationGeneration: AdaptationOutput
uiProjection: UIProjection
}

22. DAILY INPUT CONTRACTS
type DailyInputs = {
  recoveryInputs: RecoveryInputs
  emotionalInputs: EmotionalInputs
  executionInputs: ExecutionInputs
  behavioralInputs: BehavioralInputs
}

Recovery Inputs
type RecoveryInputs = {
  sleepQuality: number
  physicalEnergy: number
  mentalClarity: number
}

Emotional Inputs
type EmotionalInputs = {
  overwhelm: number
  emotionalResistance: number
  stressPressure: number
}

Execution Inputs
type ExecutionInputs = {
  meaningfulAdvancementQuality: number
  deepWorkContinuity: number
  executionIntegrity: number
}

Behavioral Inputs
type BehavioralInputs = {
  fragmentationLevel: number
  distractionPatterns: number
  avoidancePressure: number
  pacingQuality: number
}

23. FINAL ARCHITECTURAL PRINCIPLE
Momentum OS is NOT:
	• a productivity app
	• a motivation engine
	• a habit tracker
	• a gamified planner
It is:
	a behavioral regulation system for sustainable capability expansion.
That distinction changes:
	• the engine
	• the interfaces
	• the adaptation model
	• the interventions
	• the UI philosophy
	• the emotional architecture
	• the trust model
	• the entire product direction
Most productivity systems attempt to:
	• maximize output.
This system attempts to:
	• regulate execution honestly,
	• preserve meaningful momentum,
	• reduce self-deception,
	• and expand human capability without collapse.

