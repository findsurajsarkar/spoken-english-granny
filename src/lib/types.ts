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

export interface Attempt {
  id: string;
  createdAt: string;
  topic: Topic;
  transcript: string;
  analysis: Analysis;
  lang: ExplainLang;
}

export interface Settings {
  level: Level;
  lang: ExplainLang;
}
