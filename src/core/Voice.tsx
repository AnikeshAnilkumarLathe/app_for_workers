import { useRef, useEffect } from 'react';

// ── Audio Feedback (Haptic & Tones) ──────────────────
export const vibrate = (pattern: number | number[]) => {
    if ("vibrate" in navigator) navigator.vibrate(pattern);
};

export const playTone = (freq: number, duration = 0.15) => {
    if (!globalAudioCtx) return;
    const osc = globalAudioCtx.createOscillator();
    const gain = globalAudioCtx.createGain();
    osc.connect(gain);
    gain.connect(globalAudioCtx.destination);
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.1, globalAudioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, globalAudioCtx.currentTime + duration);
    osc.start();
    osc.stop(globalAudioCtx.currentTime + duration);
};

// ── TTS Engine ───────────────────────────────────────
let isSpeaking = false;

export const speak = (text: string, rate = 0.88): Promise<void> => {
    return new Promise((resolve) => {
        window.speechSynthesis.cancel();
        isSpeaking = true;
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'hi-IN';
        u.rate = rate;
        u.onend = () => {
            isSpeaking = false;
            resolve();
        };
        u.onerror = () => {
            isSpeaking = false;
            resolve();
        };
        window.speechSynthesis.speak(u);
    });
};

// ── Voice Command Normalization ──────────────────────
export type VoiceCommand = '1' | '2' | '3' | 'हाँ' | 'नहीं' | 'वापस' | 'unknown';

const normalise = (transcript: string): VoiceCommand => {
    const clean = transcript.toLowerCase().trim();
    if (/\b(1|ek|one|एक)\b/.test(clean)) return '1';
    if (/\b(2|do|two|दो)\b/.test(clean)) return '2';
    if (/\b(3|teen|three|तीन)\b/.test(clean)) return '3';
    if (/\b(ha|haan|yes|sahi|हाँ|हां)\b/.test(clean)) return 'हाँ';
    if (/\b(na|nahi|no|cancel|नहीं)\b/.test(clean)) return 'नहीं';
    if (/\b(back|piche|wapas|वापस)\b/.test(clean)) return 'वापस';
    return 'unknown';
};

// ── Stable Voice Hook ────────────────────────────────
// onCommand is stored in a ref so the recognition session never restarts
// just because the parent re-renders or changes step state.
export const useVoiceCommands = (onCommand: (cmd: VoiceCommand) => void, enabled = true) => {
    const onCommandRef = useRef(onCommand);
    const isActiveRef = useRef(enabled);
    const recognitionRef = useRef<any>(null);
    const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Keep the callback current without triggering effect re-runs
    useEffect(() => {
        onCommandRef.current = onCommand;
    }, [onCommand]);

    useEffect(() => {
        isActiveRef.current = enabled;

        const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

        if (!SR || !enabled) {
            if (recognitionRef.current) {
                try { recognitionRef.current.stop(); } catch (_) { }
                recognitionRef.current = null;
            }
            return;
        }

        const startRecognition = () => {
            if (!isActiveRef.current) return;

            // Wait for TTS to finish before listening, prevents mic picking up speaker output
            if (isSpeaking) {
                restartTimerRef.current = setTimeout(startRecognition, 300);
                return;
            }

            const recognition = new SR();
            recognition.lang = 'hi-IN';
            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.maxAlternatives = 3;

            recognition.onresult = (e: any) => {
                for (let i = 0; i < e.results[0].length; i++) {
                    const transcript = e.results[0][i].transcript;
                    const cmd = normalise(transcript);
                    if (cmd !== 'unknown') {
                        vibrate([100, 50, 100]);
                        onCommandRef.current(cmd);
                        return;
                    }
                }
            };

            recognition.onend = () => {
                if (isActiveRef.current) {
                    restartTimerRef.current = setTimeout(startRecognition, 150);
                }
            };

            recognition.onerror = (e: any) => {
                if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
                    isActiveRef.current = false;
                    return;
                }
                if (isActiveRef.current) {
                    restartTimerRef.current = setTimeout(startRecognition, 500);
                }
            };

            try {
                recognition.start();
                recognitionRef.current = recognition;
            } catch (_) {
                restartTimerRef.current = setTimeout(startRecognition, 500);
            }
        };

        startRecognition();

        return () => {
            isActiveRef.current = false;
            if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
            if (recognitionRef.current) {
                try { recognitionRef.current.stop(); } catch (_) { }
                recognitionRef.current = null;
            }
        };
    }, [enabled]); // Only depends on enabled — NOT onCommand
};

// Audio Context Logic
let globalAudioCtx: AudioContext | null = null;
export const unlockAudioContext = () => {
    if (globalAudioCtx) return true;
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    globalAudioCtx = new AC();
    return true;
};
