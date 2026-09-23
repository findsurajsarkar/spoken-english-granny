import type { Badge } from './badges';
import { checkEnglish } from './granny';
import { saveAttempt } from './storage';
import type { Attempt, ExplainLang, Topic, Turn } from './types';

interface CheckInput {
  topic: Topic;
  transcript: string;
  lang: ExplainLang;
  mode?: 'topic' | 'talk';
  scenarioId?: string;
  conversation?: Turn[];
}

/** Asks Granny to check the English, saves the attempt and returns it with any new badges. */
export async function checkAndSave(input: CheckInput): Promise<{ attempt: Attempt; badges: Badge[] }> {
  const analysis = await checkEnglish(input.topic, input.transcript, input.lang);
  const attempt: Attempt = {
    id: crypto.randomUUID?.() ?? String(Date.now()),
    createdAt: new Date().toISOString(),
    topic: input.topic,
    transcript: input.transcript,
    analysis,
    lang: input.lang,
    mode: input.mode ?? 'topic',
    scenarioId: input.scenarioId,
    conversation: input.conversation,
  };
  const badges = saveAttempt(attempt);
  return { attempt, badges };
}
