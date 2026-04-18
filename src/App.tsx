import React, { useState, useEffect, useCallback } from 'react';
import {
    speak,
    unlockAudioContext,
    playTone,
    useVoiceCommands,
    vibrate,
    type VoiceCommand
} from './core/Voice';

import { useVolumeKeys } from './core/useVolumeKeys';
import { VirtualVolumeControls } from './components/VirtualVolumeControls';
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

    // ✅ Navigation
    const navigateTo = useCallback((id: Screen) => {
        vibrate([100, 50, 100]);
        playTone(523, 0.15);
        setScreen(id);
    }, []);

    // ✅ Voice commands
    const handleCommand = useCallback((cmd: VoiceCommand) => {
        if (cmd === '1' || cmd === '2' || cmd === '3') {
            const index = Number(cmd) - 1;
            navigateTo(HOME_ITEMS[index].id as Screen);
        } else if (cmd === 'वापस') {
            setScreen('home');
            speak('मुख्य मेनू पर वापस आ गए');
        }
    }, [navigateTo]);

    useVoiceCommands(handleCommand, unlocked && screen === 'home');

    // ✅ 🔥 FIX: First interaction (mobile audio unlock)
    useEffect(() => {
        const handleFirstInteraction = async () => {
            const ok = unlockAudioContext();

            if (ok) {
                playTone(440, 0.1); // activate audio
                await speak('शुरू करने के लिए नीचे वाला बटन दबाएं');
            }

            window.removeEventListener('pointerdown', handleFirstInteraction);
        };

        window.addEventListener('pointerdown', handleFirstInteraction);

        return () => {
            window.removeEventListener('pointerdown', handleFirstInteraction);
        };
    }, []);

    // ✅ Unlock system
    const unlock = async () => {
        const ok = unlockAudioContext();

        if (ok) {
            setUnlocked(true);
            playTone(440, 0.2);
            vibrate(200);

            await speak('नमस्ते मजदूर साथी। आपके लिए तीन विकल्प हैं।');
            await speak('एक: वेतन पर्ची। दो: पैसे भेजें। तीन: शिकायत।');
            await speak('बदलने के लिए नीचे वाला बटन। चुनने के लिए ऊपर वाला बटन।');
        }
    };

    // ✅ Speak selection
    useEffect(() => {
        if (unlocked && screen === 'home') {
            const item = HOME_ITEMS[selected];
            speak(`विकल्प ${selected + 1}: ${item.label}। ${item.sub}`);
        }
    }, [selected, unlocked, screen]);

    // ✅ Hardware keys (if supported)
    useVolumeKeys({
        enabled: unlocked && screen === 'home',
        onUp: () => navigateTo(HOME_ITEMS[selected].id as Screen),
        onDown: () => {
            playTone(330, 0.1);
            vibrate(50);
            setSelected((prev) => (prev + 1) % HOME_ITEMS.length);
        },
    });

    // ── Routing ───────────────────────────────
    if (screen === 'wage') return <WageFlow onBack={() => setScreen('home')} />;
    if (screen === 'money') return <MoneyFlow onBack={() => setScreen('home')} />;
    if (screen === 'grievance') return <GrievanceFlow onBack={() => setScreen('home')} />;

    // ── UI ───────────────────────────────────
    return (
        <div className="flex flex-col items-center px-4 pt-12 pb-6 min-h-screen bg-slate-950 text-white gap-6 relative">

            {!unlocked ? (
                <div className="flex flex-col items-center justify-center flex-1 gap-8 text-center">

                    <div className="w-32 h-32 bg-blue-600 rounded-full animate-pulse flex items-center justify-center">
                        <span className="text-5xl">👂</span>
                    </div>

                    <div>
                        <p className="text-4xl font-bold mb-2">मजदूर साथी</p>
                        <p className="text-slate-400">शुरू करने के लिए नीचे बटन दबाएं</p>
                    </div>

                    {/* ✅ Virtual unlock button */}
                    <VirtualVolumeControls
                        onDown={unlock}
                    />

                </div>
            ) : (
                <>
                    <header className="text-center mb-4">
                        <p className="text-4xl font-black text-blue-500">मजदूर साथी आपकी सेवा में</p>
                        <p className="text-slate-500 font-medium">वॉल्यूम बटन का प्रयोग करें</p>
                    </header>

                    <div className="flex flex-col gap-4 w-full max-w-md">
                        {HOME_ITEMS.map((item, i) => (
                            <div
                                key={item.id}
                                onClick={() => navigateTo(item.id as Screen)}
                                className={`
                                    flex items-center gap-6 p-8 rounded-[40px] transition-all
                                    border-[6px] cursor-pointer
                                    ${i === selected
                                        ? 'bg-blue-600 border-white scale-105 shadow-xl'
                                        : 'bg-slate-900 border-slate-800 opacity-60'}
                                `}
                            >
                                <span className="text-5xl">{item.icon}</span>

                                <div>
                                    <p className="text-3xl font-bold">{item.label}</p>
                                    <p className={`text-lg ${i === selected ? 'text-blue-100' : 'text-slate-500'}`}>
                                        {item.sub}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <footer className="mt-auto p-4 bg-slate-900/50 rounded-2xl border border-slate-800 text-center">
                        <p className="text-slate-400">
                            बोलें: <span className="text-white font-bold">"1, 2, 3"</span> या{" "}
                            <span className="text-white font-bold text-lg">"वापस"</span>
                        </p>
                    </footer>

                    {/* ✅ Virtual controls */}
                    <VirtualVolumeControls
                        onUp={() => navigateTo(HOME_ITEMS[selected].id as Screen)}
                        onDown={() => {
                            playTone(330, 0.1);
                            vibrate(50);
                            setSelected((prev) => (prev + 1) % HOME_ITEMS.length);
                        }}
                    />
                </>
            )}
        </div>
    );
}