import type { ToneVocabulary } from "./tone-system/vocabulary";
import type { MessagingTone } from "@/core/contracts/adaptation/guidance";

const STABILIZING_VOCAB: ToneVocabulary = {
  tone: "STABILIZING",
  pressureCap: 20,
  heroHeadlines: [
    "Smaller surface. Faster reset.",
    "One thing. That's the plan.",
    "Steady over fast.",
    "Less scope. More finish.",
  ],
  heroSubtitles: [
    "No measurement pressure today. One step forward is enough.",
    "The goal is to stop the slide — nothing more.",
    "Recalibrate. Not review.",
  ],
  morningInsights: [
    "Momentum comes back in small increments.",
    "A minimal day that finishes is better than an ambitious day that stalls.",
    "Reducing scope isn't failure — it's recalibration.",
  ],
  morningEncouragements: [
    "Pick one thing. Just one.",
    "You don't need a great day. You need a complete one.",
    "Showing up counts.",
  ],
  checkInOpenQuestions: [
    "What felt possible today, even slightly?",
    "What's one small thing that moved forward?",
    "What would a lighter version of this work look like?",
  ],
  checkInPatternQuestions: [
    "What keeps the load manageable on days like this?",
    "What worked in the past when you felt this stretched?",
  ],
  checkInForwardQuestions: [
    "What's the smallest useful thing for tomorrow?",
    "What can you remove from tomorrow's list?",
  ],
  interventionPhrasePrefix: "A small adjustment: ",
  forbiddenPhrases: ["should have", "missed", "only", "behind", "goal"],
};

const CALM_VOCAB: ToneVocabulary = {
  tone: "CALM",
  pressureCap: 0,
  heroHeadlines: [
    "Rest is work.",
    "Nothing is urgent.",
    "Presence first.",
    "Today is about recovery.",
  ],
  heroSubtitles: [
    "The system is watching. You just need to be present.",
    "No output required today.",
    "Stillness is a valid response.",
  ],
  morningInsights: [
    "Recovery is not lost time — it's investment.",
    "The pattern always comes back when the baseline is restored.",
    "There's nothing to fix right now. Just be here.",
  ],
  morningEncouragements: [
    "You're doing the right thing by slowing down.",
    "This is recovery mode. It's working.",
    "Rest restores what effort cannot.",
  ],
  checkInOpenQuestions: [
    "How does your body feel right now?",
    "What did rest feel like today?",
    "What was the quietest part of your day?",
  ],
  checkInPatternQuestions: [
    "What signals told you to slow down?",
    "What has helped in the past when everything felt like too much?",
  ],
  checkInForwardQuestions: [
    "What would tomorrow look like if you gave yourself full permission to recover?",
    "What's one boundary you could protect tomorrow?",
  ],
  interventionPhrasePrefix: "Gently: ",
  forbiddenPhrases: ["productivity", "tasks", "performance", "goal", "score"],
};

const STEADY_VOCAB: ToneVocabulary = {
  tone: "STEADY",
  pressureCap: 40,
  heroHeadlines: [
    "Consistency is compounding.",
    "The rhythm holds.",
    "Reliable beats remarkable.",
    "The foundation is solid.",
  ],
  heroSubtitles: [
    "Keep the cadence. Nothing flashy — just reliable.",
    "This is what building looks like.",
    "Steady work is the most underrated kind.",
  ],
  morningInsights: [
    "Sustained consistency outperforms occasional intensity.",
    "The baseline is healthy. Work from there.",
    "A solid day today amplifies every day after.",
  ],
  morningEncouragements: [
    "Carry the rhythm forward.",
    "Keep doing exactly this.",
    "Steady and reliable. That's the goal.",
  ],
  checkInOpenQuestions: [
    "What did you finish that felt solid?",
    "Where did the work flow without friction?",
    "What's one thing you'd repeat tomorrow?",
  ],
  checkInPatternQuestions: [
    "What's been consistent across the past few days?",
    "What habits are holding the rhythm?",
  ],
  checkInForwardQuestions: [
    "What does tomorrow look like if you keep this pace?",
    "What's one thing worth protecting in tomorrow's schedule?",
  ],
  interventionPhrasePrefix: "Worth noting: ",
  forbiddenPhrases: ["maximize", "crush", "peak"],
};

const FOCUSED_VOCAB: ToneVocabulary = {
  tone: "FOCUSED",
  pressureCap: 60,
  heroHeadlines: [
    "Protect the depth window.",
    "Three tasks. Executed well.",
    "Depth over breadth.",
    "Single thread. Full focus.",
  ],
  heroSubtitles: [
    "Everything else waits. Depth before breadth.",
    "Your best work requires protection.",
    "Fewer commitments. Deeper execution.",
  ],
  morningInsights: [
    "Focus compounds fastest when protected from interruption.",
    "Your depth window is your highest-leverage resource.",
    "Three well-executed tasks beat ten started and stalled.",
  ],
  morningEncouragements: [
    "Guard the deep work block.",
    "Execute on what matters first.",
    "Depth is the skill — protect it.",
  ],
  checkInOpenQuestions: [
    "What did you finish that mattered? What slowed you down?",
    "Where did depth happen today — and where did it get interrupted?",
    "What task got your full attention?",
  ],
  checkInPatternQuestions: [
    "Which task took longer than expected, and why?",
    "What fragmented your focus today?",
    "Where did the context-switching cost you?",
  ],
  checkInForwardQuestions: [
    "What's the one thing tomorrow needs?",
    "Which task deserves your best two hours?",
    "What should you block out to protect focus tomorrow?",
  ],
  interventionPhrasePrefix: "Focus check: ",
  forbiddenPhrases: ["relax", "easy", "skip"],
};

const CHALLENGING_VOCAB: ToneVocabulary = {
  tone: "CHALLENGING",
  pressureCap: 75,
  heroHeadlines: [
    "Your window is open.",
    "Capacity is higher than last week.",
    "This is the stretch window.",
    "Push the ceiling a little.",
  ],
  heroSubtitles: [
    "This is the week to stretch. Protect sleep — push work.",
    "You've earned the room to expand. Use it.",
    "Higher capacity, higher standard.",
  ],
  morningInsights: [
    "Your recent baseline supports a harder target today.",
    "Expansion windows are rare — they're worth using.",
    "The data says you've got more in reserve. Act accordingly.",
  ],
  morningEncouragements: [
    "Take the harder version of this.",
    "You have more capacity than your default plan assumes.",
    "Stretch today. Recover deliberately.",
  ],
  checkInOpenQuestions: [
    "What stretched you today? Did you leave capacity unused?",
    "Where did you push past your usual ceiling?",
    "What would the harder version of today have looked like?",
  ],
  checkInPatternQuestions: [
    "Where did you hold back that you didn't need to?",
    "What stopped you from going further?",
    "What pattern is limiting your output right now?",
  ],
  checkInForwardQuestions: [
    "What's a harder version of tomorrow's plan?",
    "What would you attempt if you assumed you had more capacity?",
    "What's the highest-leverage thing you've been avoiding?",
  ],
  interventionPhrasePrefix: "Raise the bar: ",
  forbiddenPhrases: ["rest", "reduce", "recovery"],
};

const OBSERVATIONAL_VOCAB: ToneVocabulary = {
  tone: "OBSERVATIONAL",
  pressureCap: 20,
  heroHeadlines: [
    "Something shifted this week.",
    "The data is forming a picture.",
    "Observation mode active.",
    "Patterns are emerging.",
  ],
  heroSubtitles: [
    "Observation mode. No prescriptions — just noticing patterns.",
    "The system is gathering signal. No action required yet.",
    "Watch before changing.",
  ],
  morningInsights: [
    "The pattern isn't clear yet — and that's fine.",
    "Not every week needs a diagnosis. Some need observation.",
    "The signals are mixed. Stay curious, not reactive.",
  ],
  morningEncouragements: [
    "Just notice what happens today.",
    "No pressure to optimize — just observe.",
    "Information is the output for now.",
  ],
  checkInOpenQuestions: [
    "What does this week feel like from the inside?",
    "What's different about today compared to last week?",
    "What are you noticing that you haven't put into words yet?",
  ],
  checkInPatternQuestions: [
    "What's been consistent across the last few days that you haven't tracked before?",
    "What feels like a new variable in your work right now?",
  ],
  checkInForwardQuestions: [
    "What would be worth paying attention to tomorrow?",
    "What experiment would tell you something useful?",
  ],
  interventionPhrasePrefix: "Something to notice: ",
  forbiddenPhrases: ["you need to", "you should", "fix", "problem"],
};

export const TONE_VOCABULARY: Record<MessagingTone, ToneVocabulary> = {
  STABILIZING: STABILIZING_VOCAB,
  CALM: CALM_VOCAB,
  STEADY: STEADY_VOCAB,
  FOCUSED: FOCUSED_VOCAB,
  CHALLENGING: CHALLENGING_VOCAB,
  OBSERVATIONAL: OBSERVATIONAL_VOCAB,
};

/** Depth scalar thresholds */
export const DEPTH_THRESHOLDS = {
  MINIMAL_MAX: 30,
  STANDARD_MAX: 60,
  DEEP_MAX: 80,
} as const;

/** Frequency scalar thresholds */
export const FREQUENCY_THRESHOLDS = {
  LOW_MAX: 30,
  MODERATE_MAX: 60,
  HIGH_MAX: 80,
} as const;
