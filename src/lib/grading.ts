export interface Grade {
  label: string;
  tone: 'verybad' | 'bad' | 'good' | 'verygood' | 'excellent';
}

export function gradeFor(score: number): Grade {
  if (score <= 2) return { label: 'Very Bad', tone: 'verybad' };
  if (score <= 4) return { label: 'Bad', tone: 'bad' };
  if (score <= 6) return { label: 'Good', tone: 'good' };
  if (score <= 8) return { label: 'Very Good', tone: 'verygood' };
  return { label: 'Excellent', tone: 'excellent' };
}
