import { useRef, useState, useCallback } from 'react';

// ── Speak ──────────────────────────────────────────────
export const speak = (text: string, rate = 0.88): Promise<void> => {
    return new Promise((resolve) => {
        if (!('speechSynthesis' in window)) { resolve(); return; }
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'hi-IN';
        u.rate = rate;
        u.pitch = 1.0;
        u.onend = () => resolve();
        u.onerror = () => resolve();
        window.speechSynthesis.speak(u);
    });
};

// ── Audio context unlock (keeps volume keys captured) ──
let globalAudioCtx: AudioContext | null = null;

export const unlockAudioContext = (): boolean => {
    if (globalAudioCtx) return true;
    try {
        const AC = window.AudioContext || (window as any).webkitAudioContext;
        globalAudioCtx = new AC();
        const osc = globalAudioCtx.createOscillator();
        const gain = globalAudioCtx.createGain();
        gain.gain.value = 0.001; // silent
        osc.connect(gain);
        gain.connect(globalAudioCtx.destination);
        osc.start();
        return true;
    } catch {
        return false;
    }
};

export const playTone = (freq: number, duration = 0.15, type: OscillatorType = 'sine') => {
    if (!globalAudioCtx) return;
    try {
        const osc = globalAudioCtx.createOscillator();
        const gain = globalAudioCtx.createGain();
        osc.connect(gain);
        gain.connect(globalAudioCtx.destination);
        osc.frequency.value = freq;
        osc.type = type;
        gain.gain.setValueAtTime(0.18, globalAudioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, globalAudioCtx.currentTime + duration);
        osc.start(globalAudioCtx.currentTime);
        osc.stop(globalAudioCtx.currentTime + duration);
    } catch { }
};

// ── Voice recording hook ───────────────────────────────
export type RecordingState = 'idle' | 'recording' | 'done' | 'error';

export const useVoiceRecord = () => {
    const mediaRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const [state, setState] = useState<RecordingState>('idle');
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

    const startRecording = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            chunksRef.current = [];
            recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
            recorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                setAudioBlob(blob);
                setState('done');
                stream.getTracks().forEach((t) => t.stop());
            };
            recorder.start();
            mediaRef.current = recorder;
            setState('recording');
        } catch {
            setState('error');
        }
    }, []);

    const stopRecording = useCallback(() => {
        if (mediaRef.current && mediaRef.current.state === 'recording') {
            mediaRef.current.stop();
        }
    }, []);

    const reset = useCallback(() => {
        setState('idle');
        setAudioBlob(null);
        chunksRef.current = [];
    }, []);

    return { state, audioBlob, startRecording, stopRecording, reset };
};