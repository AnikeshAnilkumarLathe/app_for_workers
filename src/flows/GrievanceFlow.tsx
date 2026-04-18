import { useEffect, useState } from 'react';
import { speak, playTone, useVoiceRecord } from '../core/Voice';
import { useVolumeKeys } from '../core/useVolumeKeys';
import { Button } from '../components/Button';
import { VoiceIndicator } from '../components/VoiceIndicator';

type Step = 'intro' | 'recording' | 'review' | 'submitted';

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
    const [selectedTag, setSelectedTag] = useState<string | null>(null);
    const [complaintId] = useState(() => Math.floor(1000 + Math.random() * 9000));
    const { startRecording, stopRecording, reset } = useVoiceRecord();

    useEffect(() => {
        if (step === 'intro')
            speak('शिकायत दर्ज करने के लिए Volume Up दबाएं। यह गोपनीय रहेगी।');
        if (step === 'recording') {
            speak('बोलिए। बंद करने के लिए Volume Up फिर दबाएं।');
            startRecording();
        }
        if (step === 'review')
            speak('आपकी शिकायत रिकॉर्ड हो गई। भेजने के लिए Volume Up देर तक दबाएं।');
        if (step === 'submitted') {
            playTone(660, 0.2, 'triangle');
            setTimeout(() => playTone(880, 0.3, 'triangle'), 200);
            speak(`शिकायत नंबर ${complaintId} दर्ज हो गई। कल तक जवाब मिलेगा।`);
        }
    }, [step]);

    useVolumeKeys({
        onUp: () => {
            if (step === 'intro') { setStep('recording'); return; }
            if (step === 'recording') { stopRecording(); setStep('review'); return; }
            if (step === 'submitted') { onBack(); }
        },
        onLongUp: () => {
            if (step === 'review') setStep('submitted');
        },
        onDown: () => {
            playTone(330, 0.15);
            if (step === 'recording') { stopRecording(); reset(); setStep('intro'); return; }
            if (step === 'review') { reset(); setStep('intro'); return; }
            onBack();
        },
    });

    return (
        <div className="flex flex-col items-center gap-5 px-4 pt-8 pb-6 min-h-screen bg-slate-900 text-white">

            {step === 'intro' && (
                <>
                    <div className="w-[72px] h-[72px] rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-4xl">
                        📋
                    </div>
                    <p className="text-2xl font-medium text-center">शिकायत दर्ज करें</p>
                    <p className="text-sm text-slate-500 text-center">
                        🔒 यह गोपनीय रहेगी — ठेकेदार को नहीं दिखेगा
                    </p>

                    <div className="grid grid-cols-2 gap-3 w-full">
                        {TAGS.map(tag => (
                            <button
                                key={tag.id}
                                onClick={() => setSelectedTag(tag.id)}
                                className={`
                  py-4 px-3 rounded-xl text-sm text-slate-200
                  border transition-colors duration-150 font-[inherit]
                  ${selectedTag === tag.id
                                        ? 'bg-blue-800 border-blue-400'
                                        : 'bg-slate-800 border-slate-700'}
                `}
                            >
                                {tag.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex flex-col gap-3 w-full mt-auto">
                        <Button label="▲ शुरू करें — बोलें" variant="up" onPress={() => setStep('recording')} />
                        <Button label="▼ वापस" variant="down" onPress={onBack} />
                    </div>
                </>
            )}

            {step === 'recording' && (
                <>
                    <p className="text-2xl font-medium">बोलिए...</p>
                    <VoiceIndicator active={true} label="रिकॉर्ड हो रहा है" />
                    <p className="text-sm text-slate-400 text-center">
                        जो हुआ वो बताएं। अपनी भाषा में।
                    </p>
                    <div className="flex flex-col gap-3 w-full mt-auto">
                        <Button
                            label="▲ रोकें और सुरक्षित करें"
                            variant="up"
                            onPress={() => { stopRecording(); setStep('review'); }}
                        />
                        <Button
                            label="▼ रद्द करें"
                            variant="down"
                            onPress={() => { stopRecording(); reset(); setStep('intro'); }}
                        />
                    </div>
                </>
            )}

            {step === 'review' && (
                <>
                    <VoiceIndicator active={false} />
                    <p className="text-2xl font-medium">रिकॉर्ड हो गई</p>
                    <p className="text-sm text-slate-400 text-center">
                        भेजने के लिए Volume Up देर तक दबाएं
                    </p>
                    <div className="w-full bg-slate-800 rounded-xl border border-slate-700 p-4 flex flex-col gap-2">
                        <p className="text-sm text-slate-400">🔒 सीधे श्रम विभाग को जाएगी</p>
                        {selectedTag && (
                            <p className="text-sm text-slate-200">
                                श्रेणी: {TAGS.find(t => t.id === selectedTag)?.label}
                            </p>
                        )}
                    </div>
                    <div className="flex flex-col gap-3 w-full mt-auto">
                        <Button
                            label="▲ भेजें (देर तक दबाएं)"
                            sublabel="1.5 सेकंड दबाए रखें"
                            variant="up"
                            onLongPress={() => setStep('submitted')}
                        />
                        <Button
                            label="▼ फिर से रिकॉर्ड करें"
                            variant="down"
                            onPress={() => { reset(); setStep('intro'); }}
                        />
                    </div>
                </>
            )}

            {step === 'submitted' && (
                <>
                    <div className="w-[88px] h-[88px] rounded-full bg-green-900 border-2 border-green-400 flex items-center justify-center text-4xl text-green-400 mt-6">
                        ✓
                    </div>
                    <p className="text-2xl font-medium text-center">शिकायत दर्ज हो गई</p>
                    <div className="bg-slate-800 rounded-2xl border border-slate-700 px-10 py-5 flex flex-col items-center gap-1">
                        <p className="text-3xl font-medium text-blue-400">#{complaintId}</p>
                        <p className="text-sm text-slate-400">कल तक जवाब मिलेगा</p>
                    </div>
                    <p className="text-sm text-slate-500 text-center">
                        🔒 ठेकेदार को नहीं दिखेगा
                    </p>
                    <div className="w-full mt-auto">
                        <Button label="▼ मुख्य पृष्ठ" variant="down" onPress={onBack} />
                    </div>
                </>
            )}
        </div>
    );
};