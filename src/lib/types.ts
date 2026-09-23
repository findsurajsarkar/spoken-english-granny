export type Level = 'beginner' | 'intermediate' | 'advanced';
export type ExplainLang = 'english' | 'hindi' | 'hinglish';

export interface Topic {
  title: string;
  prompt: string;
  promptHindi?: string;
  hints: string[];
  /** Speaking time limit in seconds, decided by the AI for this topic. */
  seconds: number;
  level: Level;
}

export interface Mistake {
  wrong: string;
  right: string;
  why: string;
  kind: string;
}

export interface Analysis {
  score: number;
  sentenceLevel: string;
  mistakes: Mistake[];
  correctedText: string;
  remark: string;
  strengths: string[];
  tip: string;
}

export interface Turn {
  who: 'granny' | 'me';
  text: string;
}

export interface Attempt {
  id: string;
  createdAt: string;
  topic: Topic;
  transcript: string;
  analysis: Analysis;
  lang: ExplainLang;
  /** 'talk' attempts come from conversation mode and keep the whole chat. */
  mode?: 'topic' | 'talk';
  scenarioId?: string;
  conversation?: Turn[];
}

/** Lifetime counters (history is trimmed after 60 days, these are not). */
export interface Stats {
  sessions: number;
  talks: number;
  words: number;
  best: number;
  mostWords: number;
  levels: Level[];
  interviewBest: number;
  earlyBird: boolean;
  nightOwl: boolean;
}

export interface Settings {
  level: Level;
  lang: ExplainLang;
}
