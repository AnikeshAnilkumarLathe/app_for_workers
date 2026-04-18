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
let currentUtteranceId = 0;
export let globalActiveRecognition: any = null; // 🔥 Used to kill mic when TTS starts

export const speak = (text: string, rate = 0.88): Promise<void> => {
    return new Promise((resolve) => {
        currentUtteranceId++;
        const id = currentUtteranceId;

        window.speechSynthesis.cancel();
        isSpeaking = true;
        
        // 🔥 Immediately abort recognition so the mic doesn't hear the speaker!
        if (globalActiveRecognition) {
            try { globalActiveRecognition.abort(); } catch (_) {}
        }

        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'hi-IN';
        u.rate = rate;
        u.onend = () => {
            if (currentUtteranceId === id) isSpeaking = false;
            resolve();
        };
        u.onerror = () => {
            if (currentUtteranceId === id) isSpeaking = false;
            resolve();
        };
        window.speechSynthesis.speak(u);
    });
};

// ── Voice Command Normalization ──────────────────────
export type VoiceCommand = string[];

const normalise = (transcript: string): VoiceCommand => {
    const clean = transcript.toLowerCase().trim();
    const matches: string[] = [];
    
    // -- Global App Navigation --
    if (clean.includes('वेतन') || clean.includes('पर्ची') || /(^|\s)(wage|salary|vetan|parchi|kitna)(?=\s|$)/.test(clean)) matches.push('wage');
    if (clean.includes('पैसे') || clean.includes('भेजें') || clean.includes('भेजे') || /(^|\s)(paise|bheje|send|money|bhejna)(?=\s|$)/.test(clean)) matches.push('money');
    if (clean.includes('शिकायत') || clean.includes('darj') || /(^|\s)(shikayat|complaint|darj)(?=\s|$)/.test(clean)) matches.push('grievance');
    
    // -- General Actions --
    if (clean.includes('हाँ') || clean.includes('हां') || clean.includes('पक्का') || clean.includes('भेजो') || clean.includes('भेज') || clean.includes('pakka') || /(^|\s)(ha|haan|yes|sahi|pukka|pakka|confirm|bhejo|bhej|kare)(?=\s|$)/.test(clean)) matches.push('yes');
    if (clean.includes('नहीं') || clean.includes('ना') || clean.includes('रद्द') || clean.includes('cancel') || /(^|\s)(na|nahi|no|cancel|radd)(?=\s|$)/.test(clean)) matches.push('no');
    if (clean.includes('वापस') || clean.includes('पीछे') || clean.includes('जाएं') || clean.includes('मेनू') || clean.includes('होम') || clean.includes('jaye') || clean.includes('menu') || clean.includes('home') || clean.includes('wapas') || clean.includes('vapas') || /(^|\s)(back|piche|wapas|vapas|jaye|jaaye|home|menu)(?=\s|$)/.test(clean)) matches.push('back');
    if (clean.includes('फिर') || clean.includes('सुने') || /(^|\s)(phir|sune|repeat|again|dobara)(?=\s|$)/.test(clean)) matches.push('repeat');

    // -- Specific Grievance Options --
    if (clean.includes('पैसा') || clean.includes('मिला') || /(^|\s)(paisa|mila|pagaar)(?=\s|$)/.test(clean)) matches.push('tag_pay');
    if (clean.includes('गाली') || clean.includes('गलौज') || /(^|\s)(gali|galoch|gaali|abuse)(?=\s|$)/.test(clean)) matches.push('tag_abuse');
    if (clean.includes('असुरक्षित') || clean.includes('खतरा') || /(^|\s)(asurakshit|khatra|safety|unsafe)(?=\s|$)/.test(clean)) matches.push('tag_safety');
    if (clean.includes('ओवरटाइम') || clean.includes('जबरन') || /(^|\s)(overtime|zabardasti|force)(?=\s|$)/.test(clean)) matches.push('tag_overtime');

    // -- Raw numbers fallback --
    if (/(^|\s)(1|ek|one|एक|वन)(?=\s|$)/.test(clean)) matches.push('1');
    if (/(^|\s)(2|do|two|दो|दोन|टू)(?=\s|$)/.test(clean)) matches.push('2');
    if (/(^|\s)(3|teen|three|tin|तीन|थ्री)(?=\s|$)/.test(clean)) matches.push('3');
    if (/(^|\s)(4|char|four|चार)(?=\s|$)/.test(clean)) matches.push('4');
    
    return matches.length > 0 ? matches : ['unknown'];
};

// ── Stable Voice Hook ────────────────────────────────
// onCommand is stored in a ref so the recognition session never restarts
// just because the parent re-renders or changes step state.
export const useVoiceCommands = (onCommand: (cmd: VoiceCommand) => void, enabled = true) => {
    const onCommandRef = useRef(onCommand);
    const isActiveRef = useRef(enabled);
    const recognitionRef = useRef<any>(null);
    const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const timeoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isListeningRef = useRef(false);
    const isStartingRef = useRef(false);
    const lastStartAttemptRef = useRef<number>(0);

    // Keep the callback current without triggering effect re-runs
    useEffect(() => {
        onCommandRef.current = onCommand;
    }, [onCommand]);

    useEffect(() => {
        isActiveRef.current = enabled;

        const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

        if (!SR || !enabled) {
            try { recognitionRef.current?.abort(); } catch (_) { }
            recognitionRef.current = null;
            isListeningRef.current = false;
            isStartingRef.current = false;
            return;
        }

        const startRecognition = () => {
            if (!isActiveRef.current) return;
            if (isListeningRef.current || isStartingRef.current) return;

            // Wait for TTS to finish before listening, prevents mic picking up speaker output
            if (isSpeaking || window.speechSynthesis.speaking) {
                if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
                restartTimerRef.current = setTimeout(startRecognition, 300);
                return;
            }

            console.log('[Speech] Starting recognition...');
            isStartingRef.current = true;
            lastStartAttemptRef.current = Date.now();

            if (recognitionRef.current) {
                try { recognitionRef.current.abort(); } catch (e) {}
                recognitionRef.current = null;
            }

            const recognition = new SR();
            recognitionRef.current = recognition;
            globalActiveRecognition = recognition; // Set global reference

            recognition.lang = 'hi-IN';
            recognition.continuous = false;
            recognition.interimResults = true;
            recognition.maxAlternatives = 3;

            const resetTimeout = () => {
                if (timeoutTimerRef.current) clearTimeout(timeoutTimerRef.current);
                if (isActiveRef.current) {
                    timeoutTimerRef.current = setTimeout(() => {
                        console.log('[Speech] Timeout: No input detected for 7s. Aborting & Restarting.');
                        try { recognition.abort(); } catch (_) { }
                        
                        isListeningRef.current = false;
                        isStartingRef.current = false;
                        if (isActiveRef.current) {
                            if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
                            restartTimerRef.current = setTimeout(startRecognition, 350);
                        }
                    }, 7000);
                }
            };

            recognition.onstart = () => {
                console.log('[Speech] onstart: Mic is active');
                isStartingRef.current = false;
                isListeningRef.current = true;
                resetTimeout();
            };

            recognition.onspeechstart = () => {
                console.log('[Speech] onspeechstart: Detected voice input...');
                resetTimeout();
            };

            recognition.onresult = (e: any) => {
                resetTimeout();
                
                // 🔥 Double-check: Ignore any input if TTS is speaking
                if (isSpeaking || window.speechSynthesis.speaking) {
                    console.log('[Speech] Ignoring result: Device is currently speaking.');
                    try { recognition.abort(); } catch (_) {}
                    return;
                }

                for (let i = e.resultIndex; i < e.results.length; i++) {
                    for (let j = 0; j < e.results[i].length; j++) {
                        let transcript = e.results[i][j].transcript.trim().toLowerCase();
                        console.log(`[Speech] Raw Transcript: "${transcript}"`);
                        
                        // Replace punctuation with spaces
                        transcript = transcript.replace(/[,.-]+/g, ' ');

                        // Advanced normalization
                        transcript = transcript
                            .replace(/(^|\s)(1|one|ek|एक|वन)(?=\s|$)/gi, ' 1 ')
                            .replace(/(^|\s)(2|two|do|don|दो|दोन|टू)(?=\s|$)/gi, ' 2 ')
                            .replace(/(^|\s)(3|three|teen|tin|तीन|थ्री)(?=\s|$)/gi, ' 3 ');

                        console.log(`[Speech] Normalized Transcript: "${transcript}"`);

                        const cmds = normalise(transcript);
                        if (!cmds.includes('unknown')) {
                            console.log(`[Speech] ✨ Command matched: ${cmds.join(', ')}`);
                            vibrate([100, 50, 100]);
                            onCommandRef.current(cmds);
                            try { recognition.abort(); } catch (_) { }
                            return;
                        } else {
                            console.log(`[Speech] ❌ No command matched for: "${transcript}"`);
                        }
                    }
                }
            };

            recognition.onend = () => {
                console.log('[Speech] onend: Recognition ended');
                isListeningRef.current = false;
                isStartingRef.current = false;
                if (timeoutTimerRef.current) clearTimeout(timeoutTimerRef.current);

                if (isActiveRef.current) {
                    if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
                    restartTimerRef.current = setTimeout(startRecognition, 150);
                }
            };

            recognition.onerror = (e: any) => {
                console.warn(`[Speech] onerror: ${e.error}`);
                if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
                    console.error('[Speech] Permission denied. Disabling voice commands.');
                    isActiveRef.current = false;
                    return;
                }
                
                try { recognition.abort(); } catch (_) { }

                isListeningRef.current = false;
                isStartingRef.current = false;
                if (isActiveRef.current) {
                    if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
                    restartTimerRef.current = setTimeout(startRecognition, 500);
                }
            };

            try {
                recognition.start();
            } catch (_) {
                console.error('[Speech] Error calling start()');
                isStartingRef.current = false;
                isListeningRef.current = false;
                if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
                restartTimerRef.current = setTimeout(startRecognition, 500);
            }
        };

        startRecognition();

        // 🔥 WATCHDOG: Browser can silently drop mic access or stall start() after long idle periods
        const watchdogTimer = setInterval(() => {
            if (!isActiveRef.current || isSpeaking || window.speechSynthesis.speaking) return;

            const now = Date.now();
            const timeSinceStart = now - lastStartAttemptRef.current;

            if (isStartingRef.current && timeSinceStart > 5000) {
                console.warn('[Speech] Watchdog: Mic stuck starting for 5s. Force restarting.');
                isStartingRef.current = false;
                isListeningRef.current = false;
                try { recognitionRef.current?.abort(); } catch (_) {}
                if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
                startRecognition();
            } else if (!isListeningRef.current && !isStartingRef.current) {
                console.warn('[Speech] Watchdog: Mic dropped silently. Restarting.');
                if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
                startRecognition();
            }
        }, 2500);

        return () => {
            isActiveRef.current = false;
            isListeningRef.current = false;
            isStartingRef.current = false;
            if (globalActiveRecognition === recognitionRef.current) {
                globalActiveRecognition = null;
            }
            if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
            if (timeoutTimerRef.current) clearTimeout(timeoutTimerRef.current);
            clearInterval(watchdogTimer);
            if (recognitionRef.current) {
                try { recognitionRef.current.abort(); } catch (_) { }
                recognitionRef.current = null;
            }
        };
    }, [enabled]); // Only depends on enabled
};

// Audio Context Logic
let globalAudioCtx: AudioContext | null = null;
export const unlockAudioContext = () => {
    if (globalAudioCtx) return true;
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    globalAudioCtx = new AC();
    return true;
};
