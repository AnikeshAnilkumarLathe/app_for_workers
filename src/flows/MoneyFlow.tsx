import { useEffect, useState, useCallback } from 'react';
import { speak, playTone, useVoiceCommands, vibrate } from '../core/Voice';
import { useVolumeKeys } from '../core/useVolumeKeys';
import Button from '../components/Button';

const AMOUNT = 800;
const RECIPIENT = { name: 'घर', relation: 'घर', upi: '9876543210@jio' };

type Step = 'confirm' | 'sending' | 'done';

interface MoneyFlowProps {
    onBack: () => void;
}

export const MoneyFlow = ({ onBack }: MoneyFlowProps) => {
    const [step, setStep] = useState<Step>('confirm');

    // ✅ FIXED: Robust Audio/Haptic Feedback Loop
    useEffect(() => {
        if (step === 'confirm') {
            vibrate(100);
            speak(`${RECIPIENT.name} को ₹${AMOUNT} भेजना है? पक्का करने के लिए ऊपर वाला बटन दबाकर रखें।`);
        }
        if (step === 'sending') {
            vibrate([200, 100, 200]); // Intentionality pulse
            speak('भेज रहे हैं...');

            // Artificial delay to simulate processing & allow feedback to play
            const timer = setTimeout(() => setStep('done'), 2500);
            return () => clearTimeout(timer);
        }
        if (step === 'done') {
            vibrate([50, 30, 50, 30, 300]); // Success pattern
            playTone(660, 0.2);
            setTimeout(() => playTone(880, 0.4), 150);
            speak(`${RECIPIENT.name} को ₹${AMOUNT} सफलतापूर्वक भेज दिए गए हैं।`);
        }
    }, [step]);

    // ✅ FIXED: Voice Command Integration (Fail-safe)
    const handleVoice = useCallback((cmd: string) => {
        if (step === 'confirm' && (cmd === 'हाँ' || cmd === 'yes')) {
            // We don't trigger 'sending' immediately for safety. 
            // We guide the user to the physical button to ensure intent.
            speak("ठीक है। अब पक्का करने के लिए ऊपर वाला बटन दबाकर रखें।");
            vibrate(300);
        }
        if (cmd === 'वापस' || cmd === 'back') {
            onBack();
        }
    }, [step, onBack]);

    useVoiceCommands(handleVoice, step !== 'sending');

    // ✅ FIXED: Hardware Interaction Logic
    useVolumeKeys({
        onUp: () => {
            if (step === 'confirm') {
                playTone(440, 0.1);
                speak("भेजने के लिए बटन को दबाकर रखें।");
            }
            if (step === 'done') {
                onBack();
            }
        },

        onDown: () => {
            if (step !== 'sending') {
                playTone(330, 0.15);
                onBack();
            }
        },
    });
    return (
        <div className="flex flex-col items-center gap-5 px-6 pt-12 pb-8 min-h-screen bg-slate-950 text-white">
            {step === 'confirm' && (
                <>
                    <div className="flex flex-col items-center gap-4 mt-4">
                        <div className="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center text-5xl shadow-lg shadow-blue-900/20">
                            {RECIPIENT.name[0]}
                        </div>
                        <div className="text-center">
                            <p className="text-3xl font-bold">{RECIPIENT.name}</p>
                            <p className="text-xl text-slate-400">{RECIPIENT.relation}</p>
                        </div>
                    </div>

                    <div className="w-full bg-slate-900 rounded-4xl border-4 border-slate-800 p-10 flex flex-col items-center gap-2 my-4">
                        <p className="text-lg text-slate-500 font-medium">भेजने की रकम</p>
                        <p className="text-7xl font-black text-blue-400">₹{AMOUNT}</p>
                    </div>

                    <div className="flex flex-col gap-4 w-full mt-auto">
                        <div className="p-4 bg-blue-900/20 border-2 border-dashed border-blue-500/50 rounded-2xl text-center">
                            <p className="text-blue-300 font-medium italic">बोलें "हाँ" या बटन दबाएं</p>
                        </div>
                        <Button
                            label="▲ पक्का करें (दबाए रखें)"
                            sublabel="Hold for 1.5 seconds"
                            variant="up"
                            onLongPress={() => setStep('sending')}
                        />
                        <Button label="▼ रद्द करें (वापस)" variant="down" onPress={onBack} />
                    </div>
                </>
            )}

            {step === 'sending' && (
                <div className="flex flex-col items-center justify-center flex-1 gap-8">
                    <div className="relative">
                        <div className="w-24 h-24 border-8 border-slate-800 border-t-blue-500 rounded-full animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center text-2xl">💸</div>
                    </div>
                    <p className="text-3xl font-bold animate-pulse">पैसे भेज रहे हैं...</p>
                </div>
            )}

            {step === 'done' && (
                <div className="flex flex-col items-center justify-center flex-1 w-full gap-6">
                    <div className="w-32 h-32 rounded-full bg-green-500/10 border-4 border-green-500 flex items-center justify-center text-6xl text-green-500 mb-4 animate-bounce">
                        ✓
                    </div>
                    <div className="text-center">
                        <p className="text-5xl font-black mb-2">₹{AMOUNT}</p>
                        <p className="text-2xl text-green-400 font-bold uppercase tracking-widest">सफल रहा</p>
                    </div>
                    <p className="text-slate-400 text-lg">
                        {RECIPIENT.name} को प्राप्त हुए
                    </p>
                    <div className="w-full mt-10">
                        <Button label="▼ मुख्य मेनू" variant="down" onPress={onBack} />
                    </div>
                </div>
            )}
        </div>
    );
};