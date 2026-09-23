import { useCallback, useEffect, useRef, useState } from 'react';

/* Records audio with MediaRecorder and, where the browser supports it (Chrome/Edge),
 * also runs the free built-in SpeechRecognition to show words live while speaking.
 * If live recognition isn't available (Safari, Firefox, mobile app webviews) the caller
 * sends the recorded audio to Puter for transcription instead. */

type Status = 'idle' | 'recording' | 'stopped';

export interface Recording {
  audio: Blob | null;
  liveText: string;
}

const SpeechRecognitionImpl: any =
  typeof window !== 'undefined' ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition : undefined;

export const hasLiveTranscription = Boolean(SpeechRecognitionImpl);

export function useRecorder(maxSeconds: number, onFinish: (r: Recording) => void) {
  const [status, setStatus] = useState<Status>('idle');
  const [elapsed, setElapsed] = useState(0);
  const [liveText, setLiveText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const mediaRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recogRef = useRef<any>(null);
  const timerRef = useRef<number | null>(null);
  const finalTextRef = useRef('');
  const interimRef = useRef('');
  const activeRef = useRef(false);
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;

  const cleanup = useCallback(() => {
    activeRef.current = false;
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = null;
    try {
      recogRef.current?.stop();
    } catch {
      /* already stopped */
    }
    recogRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => cleanup, [cleanup]);

  const stop = useCallback(() => {
    if (!activeRef.current) return;
    const text = (finalTextRef.current + ' ' + interimRef.current).replace(/\s+/g, ' ').trim();
    const rec = mediaRef.current;
    cleanup();
    setStatus('stopped');
    if (rec && rec.state !== 'inactive') {
      rec.onstop = () => {
        const chunks = (rec as any)._chunks as Blob[];
        const audio = chunks.length ? new Blob(chunks, { type: rec.mimeType || 'audio/webm' }) : null;
        onFinishRef.current({ audio, liveText: text });
      };
      rec.stop();
    } else {
      onFinishRef.current({ audio: null, liveText: text });
    }
  }, [cleanup]);

  const start = useCallback(async () => {
    setError(null);
    setLiveText('');
    setElapsed(0);
    finalTextRef.current = '';
    interimRef.current = '';

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setError("Granny can't hear you — please allow microphone access for this site, or type your answer below.");
      return;
    }
    streamRef.current = stream;
    activeRef.current = true;

    const rec = new MediaRecorder(stream);
    const chunks: Blob[] = [];
    (rec as any)._chunks = chunks;
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    rec.start(1000);
    mediaRef.current = rec;

    if (SpeechRecognitionImpl) {
      const startRecognition = () => {
        const r = new SpeechRecognitionImpl();
        r.lang = 'en-IN';
        r.continuous = true;
        r.interimResults = true;
        r.onresult = (e: any) => {
          let interim = '';
          for (let i = e.resultIndex; i < e.results.length; i++) {
            const res = e.results[i];
            if (res.isFinal) finalTextRef.current += ' ' + res[0].transcript;
            else interim += res[0].transcript;
          }
          interimRef.current = interim;
          setLiveText((finalTextRef.current + ' ' + interim).replace(/\s+/g, ' ').trim());
        };
        // Chrome ends recognition after a pause; keep it going while we're still recording.
        r.onend = () => {
          if (activeRef.current) {
            interimRef.current = '';
            try {
              startRecognition();
            } catch {
              /* ignore */
            }
          }
        };
        r.onerror = () => {};
        r.start();
        recogRef.current = r;
      };
      try {
        startRecognition();
      } catch {
        /* fall back to Puter transcription after recording */
      }
    }

    const startedAt = Date.now();
    timerRef.current = window.setInterval(() => {
      const s = (Date.now() - startedAt) / 1000;
      setElapsed(s);
      if (s >= maxSeconds) stop();
    }, 200);
    setStatus('recording');
  }, [maxSeconds, stop]);

  const reset = useCallback(() => {
    cleanup();
    setStatus('idle');
    setElapsed(0);
    setLiveText('');
  }, [cleanup]);

  return { status, elapsed, liveText, error, start, stop, reset };
}
