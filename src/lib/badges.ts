import type { Stats } from './types';

export interface Badge {
  id: string;
  emoji: string;
  name: string;
  desc: string;
  /** Returns progress 0..1 (1 = earned). */
  progress: (s: Stats, longestStreak: number) => number;
}

const ratio = (v: number, goal: number) => Math.min(1, v / goal);

export const BADGES: Badge[] = [
  { id: 'first-words', emoji: '🌱', name: 'First Words', desc: 'Finish your first practice', progress: (s) => ratio(s.sessions, 1) },
  { id: 'streak-3', emoji: '🔥', name: 'Warming Up', desc: 'Practise 3 days in a row', progress: (_, l) => ratio(l, 3) },
  { id: 'streak-7', emoji: '🌟', name: 'One Full Week', desc: 'Practise 7 days in a row', progress: (_, l) => ratio(l, 7) },
  { id: 'streak-30', emoji: '🏆', name: 'Month of Courage', desc: 'Practise 30 days in a row', progress: (_, l) => ratio(l, 30) },
  { id: 'good', emoji: '👍', name: 'Getting There', desc: 'Score 5 or more', progress: (s) => ratio(s.best, 5) },
  { id: 'very-good', emoji: '💫', name: 'Very Good!', desc: 'Score 7 or more', progress: (s) => ratio(s.best, 7) },
  { id: 'excellent', emoji: '👑', name: "Granny's Pride", desc: 'Score 9 or more', progress: (s) => ratio(s.best, 9) },
  { id: 'chatterbox', emoji: '💬', name: 'Chatterbox', desc: 'Finish your first conversation', progress: (s) => ratio(s.talks, 1) },
  { id: 'talk-10', emoji: '🗣️', name: 'Smooth Talker', desc: 'Finish 10 conversations', progress: (s) => ratio(s.talks, 10) },
  { id: 'interview', emoji: '💼', name: 'Interview Ready', desc: 'Score 7+ in a job interview', progress: (s) => ratio(s.interviewBest, 7) },
  { id: 'explorer', emoji: '🧭', name: 'Explorer', desc: 'Try all three levels', progress: (s) => ratio(s.levels.length, 3) },
  { id: 'regular', emoji: '📚', name: 'Regular Student', desc: 'Finish 25 practices', progress: (s) => ratio(s.sessions, 25) },
  { id: 'century', emoji: '💯', name: 'Century', desc: 'Finish 100 practices', progress: (s) => ratio(s.sessions, 100) },
  { id: 'big-speech', emoji: '🎤', name: 'Big Speech', desc: 'Say 150+ words in one practice', progress: (s) => ratio(s.mostWords, 150) },
  { id: 'words-1000', emoji: '📝', name: '1,000 Words', desc: 'Speak 1,000 words in total', progress: (s) => ratio(s.words, 1000) },
  { id: 'early-bird', emoji: '🌅', name: 'Early Bird', desc: 'Practise before 8 am', progress: (s) => (s.earlyBird ? 1 : 0) },
  { id: 'night-owl', emoji: '🦉', name: 'Night Owl', desc: 'Practise after 10 pm', progress: (s) => (s.nightOwl ? 1 : 0) },
];
