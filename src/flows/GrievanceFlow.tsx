import { useEffect, useState, useCallback } from 'react';
import {
    speak,
    playTone,
    vibrate,
    useVoiceCommands,
    type VoiceCommand
} from '../core/Voice';

import { VirtualVolumeControls } from '../components/VirtualVolumeControls';
import Button from '../components/Button';

type Step = 'intro' | 'review' | 'submitted';

const TAGS = [
    { id: 'pay', label: 'पैसा नहीं मिला' },
    { id: 'abuse', label: 'गाली-गलौज' },
    { id: 'safety', label: 'असुरक्षित काम' },
    { id: 'overtime', label: 'जबरन ओवरटाइम' },
];

interface GrievanceFlowProps {
    onBack: () => void;
}

export const GrievanceFlow = ({ onBack }: GrievanceFlowProps) => {
    const [step, setStep] = useState<Step>('intro');
    const [tagIndex, setTagIndex] = useState(0);
    const [complaintId] = useState(() =>
        Math.floor(1000 + Math.random() * 9000)
    );

    const selectedTag = TAGS[tagIndex];

    // 🔊 Step-based audio
    useEffect(() => {
        if (step === 'intro') {
            vibrate(100);
            speak('शिकायत दर्ज करें। नीचे से बदलें। ऊपर से चुनें।');
        }

        if (step === 'review') {
            vibrate(200);
            speak(`आपने चुना: ${selectedTag.label}`);
        }

        if (step === 'submitted') {
            vibrate([50, 50, 400]);
            playTone(880, 0.4);
            speak(`शिकायत नंबर ${complaintId} दर्ज हो गई`);
        }
    }, [step, selectedTag.label, complaintId]);

    // ✅ STATE-DRIVEN SPEECH (MAIN FIX)
    useEffect(() => {
        if (step === 'intro') {
            speak(`विकल्प ${tagIndex + 1}: ${TAGS[tagIndex].label}`);
        }
    }, [tagIndex, step]);

    // 🎤 Voice commands
    const handleVoice = useCallback(
        (cmd: VoiceCommand) => {
            if (cmd === 'वापस') {
                onBack();
                return;
            }

            if (cmd === '1') {
                setStep('review');
                return;
            }

            if (cmd === 'हाँ' && step === 'review') {
                setStep('submitted');
            }
        },
        [step, onBack]
    );

    useVoiceCommands(handleVoice, true);

    return (
        <div className="relative flex flex-col items-center gap-6 px-6 pt-12 pb-24 min-h-screen bg-slate-950 text-white">

            {/* ── INTRO ── */}
            {step === 'intro' && (
                <>
                    <div className="w-24 h-24 rounded-full bg-slate-900 border-4 border-slate-800 flex items-center justify-center text-5xl">
                        📋
                    </div>

                    <p className="text-3xl font-bold">शिकायत दर्ज करें</p>

                    <div className="grid grid-cols-2 gap-4 w-full">
                        {TAGS.map((tag, i) => (
                            <div
                                key={tag.id}
                                className={`
                                    py-6 rounded-3xl text-center text-lg font-bold border-4
                                    ${tagIndex === i
                                        ? 'bg-blue-600 border-white scale-105'
                                        : 'bg-slate-800 border-slate-700 opacity-60'}
                                `}
                            >
                                {tag.label}
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* ── REVIEW ── */}
            {step === 'review' && (
                <>
                    <div className="text-5xl">✔️</div>

                    <p className="text-2xl">भेजने के लिए तैयार</p>

                    <p className="text-xl">{selectedTag.label}</p>

                    <div className="w-full mt-auto">
                        <Button
                            label="▲ पक्का भेजें"
                            sublabel="Hold"
                            variant="up"
                            onLongPress={() => setStep('submitted')}
                        />
                        <Button
                            label="▼ पीछे जाएं"
                            variant="down"
                            onPress={() => setStep('intro')}
                        />
                    </div>
                </>
            )}

            {/* ── SUBMITTED ── */}
            {step === 'submitted' && (
                <div className="flex flex-col items-center gap-6">
                    <div className="text-6xl text-green-500">✓</div>

                    <p className="text-xl">शिकायत नंबर</p>
                    <p className="text-4xl text-blue-400">#{complaintId}</p>

                    <Button label="▼ होम" variant="down" onPress={onBack} />
                </div>
            )}

            {/* 🔥 Virtual Volume Controls */}
            <VirtualVolumeControls
                onUp={() => {
                    if (step === 'intro') {
                        setStep('review');
                        return;
                    }

                    if (step === 'submitted') {
                        onBack();
                    }
                }}
                onDown={() => {
                    if (step === 'intro') {
                        setTagIndex((prev) => (prev + 1) % TAGS.length);
                        return;
                    }

                    if (step === 'review') {
                        setStep('intro');
                        return;
                    }

                    onBack();
                }}
                onLongUp={() => {
                    if (step === 'review') {
                        setStep('submitted');
                    }
                }}
                onLongDown={onBack}
            />
        </div>
    );
};