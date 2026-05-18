import { Phone, Users, Tv, Bell, Coffee, Brain, Zap, Clock, Battery } from "lucide-react";

export const MOODS = ["Drained", "Flat", "Steady", "Sharp", "Locked in"];

export const DISTRACTIONS = [
  { id: "phone", label: "Phone", icon: Phone },
  { id: "social", label: "Social media", icon: Users },
  { id: "video", label: "Video", icon: Tv },
  { id: "noise", label: "Notifications", icon: Bell },
  { id: "snacks", label: "Snacking", icon: Coffee },
  { id: "thoughts", label: "Wandering mind", icon: Brain },
  { id: "fatigue", label: "Fatigue", icon: Battery },
  { id: "meetings", label: "Meetings", icon: Clock },
];

export const CHECK_IN_MESSAGES = {
  high: "You're reinforcing the identity of someone who follows through. That compounds.",
  mid: "Solid effort logged. Consistency across weeks builds resilience.",
  low: "One honest day — even a hard one — is more valuable than ten performed days.",
};

export const CHECK_IN_PLACEHOLDERS = {
  reflection: "What's the one thing you're avoiding telling yourself about today?",
  tomorrowFocus: "The one task that makes tomorrow a win.",
};

export const CHECK_IN_DEFAULTS = {
  focus: 7,
  mood: 2,
  energy: 60,
  sleep: 6.5,
  honesty: 8,
  distractions: ["phone"],
};

export const CHECK_IN_TITLES = {
  burnout: "Gentle check-in.",
  recovery: "Recovery check-in.",
  default: "Tonight's check-in.",
};

export const CHECK_IN_SUBTITLES = {
  burnout: "No pressure. The system adjusts.",
  default: "Two minutes of honesty beats an hour of planning.",
};

export const CHECK_IN_RESULTS = {
  recovery: {
    title: "We're easing the load.",
    subtitle: "Recovery mode is active. Tomorrow's plan is reduced automatically.",
  },
  strong: {
    title: "Strong session logged.",
    subtitle: "We logged the honest signal. Tomorrow calibrates to it.",
  },
  improving: {
    title: "Score is climbing.",
    subtitle: "We logged the honest signal. Tomorrow calibrates to it.",
  },
  mixed: {
    title: "Mixed signal — it's fine.",
    subtitle: "A down day is data, not failure. The system accounts for it.",
  },
};
