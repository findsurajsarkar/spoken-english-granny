import { useCallback, useEffect, useRef, useState } from 'react';

/* Records the learner's voice with MediaRecorder; the caller then transcribes the audio with Puter.
 *
 * Why not rely on the browser's live SpeechRecognition? On Android (Chrome, and the Android app,
 * which runs on Chrome) it takes over the microphone, so the recording comes out silent, and it
 * also quietly "fixes" grammar, hiding the very mistakes Granny should catch. So:
 *  - the recording is always the source of truth (transcribed afterwards),
 *  - live text is only shown as a preview on desktop browsers, where both can share the mic,
 *  - a sound-level meter shows the learner that Granny can hear them. */

type Status = 'idle' | 'recording' | 'stopped';

export interface Recording {
  audio: Blob | null;
  liveText: string;
  /** True when the microphone picked up (almost) no sound. */
  silent: boolean;
  seconds: number;
}

const SpeechRecognitionImpl: any =
  typeof window !== 'undefined' ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition : undefined;

const isMobile = typeof navigator !== 'undefined' && /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent);

/** Live preview text while speaking (desktop Chrome/Edge only). */
export const hasLiveTranscription = Boolean(SpeechRecognitionImpl) && !isMobile;

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === 'undefined') return undefined;
  return ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'].find((t) => MediaRecorder.isTypeSupported?.(t));
}

export function micErrorMessage(err: unknown): string {
  const name = (err as { name?: string })?.name;
  if (name === 'NotAllowedError' || name === 'SecurityError')
    return 'Granny needs your microphone. Allow microphone access for this app (tap the 🔒 or ⓘ next to the address, or check your phone settings), then try again.';
  if (name === 'NotFoundError') return "No microphone was found on this device. You can type your answer instead.";
  if (name === 'NotReadableError') return 'Another app is using the microphone. Close it and try again.';
  return "Granny can't use the microphone right now. You can type your answer instead.";
}

export function useRecorder(maxSeconds: number, onFinish: (r: Recording) => void) {
  const [status, setStatus] = useState<Status>('idle');
  const [elapsed, setElapsed] = useState(0);
  const [liveText, setLiveText] = useState('');
  const [level, setLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);
  const peakRef = useRef(0);
  const recogRef = useRef<any>(null);
  const timerRef = useRef<number | null>(null);
  const startedRef = useRef(0);
  const finalTextRef = useRef('');
  const interimRef = useRef('');
  const activeRef = useRef(false);
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;

  const cleanup = useCallback(() => {
    activeRef.current = false;
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = null;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    try {
      recogRef.current?.stop();
    } catch {
      /* already stopped */
    }
    recogRef.current = null;
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setLevel(0);
  }, []);

  useEffect(() => cleanup, [cleanup]);

  const stop = useCallback(() => {
    if (!activeRef.current) return;
    const text = (finalTextRef.current + ' ' + interimRef.current).replace(/\s+/g, ' ').trim();
    const seconds = (Date.now() - startedRef.current) / 1000;
    const silent = peakRef.current < 0.04;
    const rec = mediaRef.current;
    cleanup();
    setStatus('stopped');
    const finish = () => {
      const chunks = chunksRef.current;
      const audio = chunks.length ? new Blob(chunks, { type: rec?.mimeType || chunks[0].type || 'audio/webm' }) : null;
      onFinishRef.current({ audio, liveText: text, silent, seconds });
    };
    if (rec && rec.state !== 'inactive') {
      rec.onstop = finish;
      rec.stop();
    } else finish();
  }, [cleanup]);

  const start = useCallback(async () => {
    setError(null);
    setLiveText('');
    setElapsed(0);
    finalTextRef.current = '';
    interimRef.current = '';
    chunksRef.current = [];
    peakRef.current = 0;

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setError("This browser can't record audio. Please type your answer, or open Granny in Chrome.");
      return;
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
    } catch (e) {
      setError(micErrorMessage(e));
      return;
    }
    streamRef.current = stream;
    activeRef.current = true;

    const mimeType = pickMimeType();
    const rec = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
    rec.ondataavailable = (e) => {
      if (e.data.size) chunksRef.current.push(e.data);
    };
    rec.start(500);
    mediaRef.current = rec;

    // Sound-level meter, so the learner can see Granny is hearing them.
    try {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx: AudioContext = new Ctx();
      audioCtxRef.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      ctx.createMediaStreamSource(stream).connect(analyser);
      const data = new Uint8Array(analyser.fftSize);
      let last = 0;
      const tick = (now: number) => {
        if (!activeRef.current) return;
        analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
          const v = (data[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.min(1, Math.sqrt(sum / data.length) * 4);
        peakRef.current = Math.max(peakRef.current, rms);
        if (now - last > 80) {
          setLevel(rms);
          last = now;
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch {
      peakRef.current = 1; // no meter available; don't warn about silence
    }

    // Live preview text on desktop only (see note at the top).
    if (hasLiveTranscription) {
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
        /* preview is optional */
      }
    }

    startedRef.current = Date.now();
    timerRef.current = window.setInterval(() => {
      const s = (Date.now() - startedRef.current) / 1000;
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

  return { status, elapsed, liveText, level, error, start, stop, reset };
}
