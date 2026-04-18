import { useEffect, useState } from 'react';
import { speak, playTone } from '../core/Voice';
import { useVolumeKeys } from '../core/useVolumeKeys';
import { Button } from '../components/Button';

const AMOUNT = 800;
const RECIPIENT = { name: 'पायल', relation: 'घर', upi: '9876543210@jio' };

type Step = 'confirm' | 'sending' | 'done';

interface MoneyFlowProps {
    onBack: () => void;
}

export const MoneyFlow = ({ onBack }: MoneyFlowProps) => {
    const [step, setStep] = useState<Step>('confirm');

    useEffect(() => {
        if (step === 'confirm') {
            speak(`${RECIPIENT.name} को ₹${AMOUNT} भेजना है? पक्का करने के लिए Volume Up को देर तक दबाएं।`);
        }
        if (step === 'sending') {
            speak('भेज रहे हैं...');
            setTimeout(() => setStep('done'), 2000);
        }
        if (step === 'done') {
            playTone(660, 0.2, 'triangle');
            setTimeout(() => playTone(880, 0.3, 'triangle'), 200);
            speak(`${RECIPIENT.name} को ₹${AMOUNT} भेज दिए।`);
        }
    }, [step]);

    useVolumeKeys({
        enabled: step !== 'sending',
        onUp: () => {
            if (step === 'confirm')
                speak(`${RECIPIENT.name} को ₹${AMOUNT} भेजना है? Volume Up देर तक दबाएं।`);
            if (step === 'done') onBack();
        },
        onLongUp: () => {
            if (step === 'confirm') setStep('sending');
        },
        onDown: () => {
            playTone(330, 0.15);
            onBack();
        },
    });

    return (
        <div className="flex flex-col items-center gap-5 px-4 pt-8 pb-6 min-h-screen bg-slate-900 text-white">

            {step === 'confirm' && (
                <>
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-18 h-18 rounded-full bg-blue-700 flex items-center justify-center text-3xl font-medium w-[72px] h-[72px]">
                            {RECIPIENT.name[0]}
                        </div>
                        <p className="text-xl font-medium">{RECIPIENT.name}</p>
                        <p className="text-sm text-slate-400">{RECIPIENT.relation}</p>
                    </div>

                    <div className="w-full bg-slate-800 rounded-2xl border border-slate-700 p-7 flex flex-col items-center gap-2">
                        <p className="text-sm text-slate-400">भेजने की रकम</p>
                        <p className="text-5xl font-medium">₹{AMOUNT}</p>
                    </div>

                    <p className="text-sm text-slate-500 text-center">
                        Volume Up देर तक दबाएं — पैसे भेजें
                    </p>

                    <div className="flex flex-col gap-3 w-full mt-auto">
                        <Button
                            label="▲ पक्का करें (देर तक दबाएं)"
                            sublabel="1.5 सेकंड दबाए रखें"
                            variant="up"
                            onLongPress={() => setStep('sending')}
                        />
                        <Button label="▼ वापस" variant="down" onPress={onBack} />
                    </div>
                </>
            )}

            {step === 'sending' && (
                <div className="flex flex-col items-center justify-center flex-1 gap-5">
                    <div className="w-12 h-12 border-4 border-slate-700 border-t-green-400 rounded-full animate-spin" />
                    <p className="text-lg text-slate-400">भेज रहे हैं...</p>
                </div>
            )}

            {step === 'done' && (
                <>
                    <div className="w-[88px] h-[88px] rounded-full bg-green-900 border-2 border-green-400 flex items-center justify-center text-4xl text-green-400 mt-10">
                        ✓
                    </div>
                    <p className="text-4xl font-medium">₹{AMOUNT} भेज दिए</p>
                    <p className="text-sm text-slate-400">
                        {RECIPIENT.name} को —{' '}
                        {new Date().toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <div className="w-full mt-auto">
                        <Button label="▼ वापस" variant="down" onPress={onBack} />
                    </div>
                </>
            )}
        </div>
    );
};