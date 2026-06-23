import type { MessagingTone } from "@/core/contracts/adaptation/guidance";

export type ToneVocabulary = {
  tone: MessagingTone;
  pressureCap: number;
  heroHeadlines: string[];
  heroSubtitles: string[];
  morningInsights: string[];
  morningEncouragements: string[];
  checkInOpenQuestions: string[];
  checkInPatternQuestions: string[];
  checkInForwardQuestions: string[];
  interventionPhrasePrefix: string;
  forbiddenPhrases: string[];
};
