import { useState, useEffect } from 'react';
import {
    speak,
    unlockAudioContext,
    playTone,
    useVoiceCommands,
    type VoiceCommand
} from './core/Voice';
import { useVolumeKeys } from './core/useVolumeKeys';
import { WageFlow } from './flows/WageFlow';
import { MoneyFlow } from './flows/MoneyFlow';
import { GrievanceFlow } from './flows/GrievanceFlow';

type Screen = 'home' | 'wage' | 'money' | 'grievance';

const HOME_ITEMS = [
    { id: 'wage', label: 'वेतन पर्ची', icon: '📄', sub: 'आज कितना बना' },
    { id: 'money', label: 'पैसे भेजें', icon: '💸', sub: '₹800 घर भेजें' },
    { id: 'grievance', label: 'शिकायत', icon: '📋', sub: 'गोपनीय रहेगी' },
] as const;

export default function App() {
    const [screen, setScreen] = useState<Screen>('home');
    const [unlocked, setUnlocked] = useState(false);
    const [selected, setSelected] = useState(0);

    // ✅ FIXED: Voice command mapping (now matches UI order)
    const handleCommand = (cmd: VoiceCommand) => {
        if (cmd === '1' || cmd === '2' || cmd === '3') {
            const index = Number(cmd) - 1;
            const item = HOME_ITEMS[index];

            if (item) {
                playTone(523, 0.15);
                setScreen(item.id as Screen);
            }
        }
    };

    useVoiceCommands(handleCommand, unlocked && screen === 'home');

    const unlock = () => {
        const ok = unlockAudioContext();
        if (ok) {
            setUnlocked(true);
            playTone(440, 0.2);

            // Queue 1: Greeting
            speak('नमस्ते मजदूर साथी। आपके लिए तीन विकल्प हैं।');

            speak('एक: वेतन पर्ची। दो: पैसे भेजें। तीन: शिकायत।');

            // Queue 3: Instructions for physical buttons
            speak('बदलने के लिए आवाज़ घटाने वाला बटन दबाएं। चुनने के लिए आवाज़ बढ़ाने वाला बटन।');
        }
    };

    // ✅ Improved voice feedback (label + context)
    useEffect(() => {
        if (unlocked && screen === 'home') {
            const item = HOME_ITEMS[selected];
            // Example: "Option 2: Paise Bhein. Ghar 800 rupaye bhejein"
            speak(`विकल्प ${selected + 1}: ${item.label}। ${item.sub}`);
        }
    }, [selected, unlocked, screen]);

    useVolumeKeys({
        enabled: unlocked && screen === 'home',
        onUp: () => {
            playTone(523, 0.15);
            setScreen(HOME_ITEMS[selected].id as Screen);
        },
        onDown: () => {
            playTone(330, 0.15);
            setSelected((prev) => (prev + 1) % HOME_ITEMS.length);
        },
    });

    // ── Navigation ───────────────────────────────
    if (screen === 'wage') return <WageFlow onBack={() => setScreen('home')} />;
    if (screen === 'money') return <MoneyFlow onBack={() => setScreen('home')} />;
    if (screen === 'grievance') return <GrievanceFlow onBack={() => setScreen('home')} />;

    // ── UI ──────────────────────────────────────
    return (
        <div className="flex flex-col items-center px-4 pt-12 pb-6 min-h-screen bg-slate-900 text-white gap-6">
            {!unlocked ? (
                <div className="flex flex-col items-center justify-center flex-1 gap-5">
                    <p className="text-3xl font-medium">मजदूर साथी</p>
                    <p className="text-sm text-slate-500">शुरू करने के लिए दबाएं</p>

                    <button
                        onClick={unlock}
                        className="bg-blue-700 text-white rounded-2xl px-12 py-5 text-xl font-medium min-h-[72px]"
                    >
                        शुरू करें
                    </button>
                </div>
            ) : (
                <>
                    <p className="text-3xl font-medium">मजदूर साथी</p>
                    <p className="text-xs text-slate-500">
                        ▼ बदलें · ▲ खोलें · बोलें: “1, 2, 3”
                    </p>

                    <div className="flex flex-col gap-3 w-full">
                        {HOME_ITEMS.map((item, i) => (
                            <div
                                key={item.id}
                                onClick={() => {
                                    setSelected(i);
                                    setScreen(item.id as Screen);
                                }}
                                className={`
                                    flex items-center gap-4 p-5 rounded-2xl min-h-[80px]
                                    border-2 cursor-pointer transition-colors duration-150
                                    ${i === selected
                                        ? 'bg-blue-900/40 border-blue-400'
                                        : 'bg-slate-800 border-slate-700'}
                                `}
                            >
                                <span className="text-3xl flex-shrink-0">{item.icon}</span>

                                <div>
                                    <p className="text-xl font-medium">{item.label}</p>
                                    <p className="text-sm text-slate-400">{item.sub}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}