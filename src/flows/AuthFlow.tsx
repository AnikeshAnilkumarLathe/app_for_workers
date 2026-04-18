import { useEffect, useState } from 'react';
import { speak, playTone, vibrate } from '../core/Voice';

interface AuthFlowProps {
    onSuccess: () => void;
}

export const AuthFlow = ({ onSuccess }: AuthFlowProps) => {
    const [step, setStep] = useState<'scanning' | 'success'>('scanning');

    useEffect(() => {
        if (step === 'scanning') {
            vibrate(100);
            speak('पहचान के लिए फोन के सामने देखें');

            // Simulate 3.5 seconds of Face ID scanning
            const timer = setTimeout(() => {
                setStep('success');
            }, 3500);
            return () => clearTimeout(timer);
        }

        if (step === 'success') {
            vibrate([50, 50, 200]);
            playTone(880, 0.4);
            speak('पहचान सफल हुई। नमस्ते।');

            // Wait for the success message to play before navigating to home
            const timer = setTimeout(() => {
                onSuccess();
            }, 3500);
            return () => clearTimeout(timer);
        }
    }, [step, onSuccess]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white p-6 relative overflow-hidden">

            {step === 'scanning' && (
                <div className="flex flex-col items-center gap-10">
                    <p className="text-3xl font-bold text-center">चेहरा स्कैन कर रहे हैं...</p>

                    {/* Face scanning animation wrapper */}
                    <div className="relative w-64 h-64 border-4 border-dashed border-blue-500/50 rounded-3xl flex items-center justify-center overflow-hidden bg-blue-950/20">
                        {/* Scanning Line */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-blue-400 shadow-[0_0_20px_5px_rgba(96,165,250,0.5)] animate-[scan_2s_ease-in-out_infinite_alternate]" />

                        <span className="text-8xl opacity-80">👤</span>
                    </div>

                    <p className="text-slate-400 text-lg animate-pulse">फोन को चेहरे के सामने रखें</p>
                </div>
            )}

            {step === 'success' && (
                <div className="flex flex-col items-center gap-8 animate-in fade-in zoom-in duration-500">
                    <div className="w-40 h-40 rounded-full bg-green-500/20 border-4 border-green-500 flex items-center justify-center">
                        <span className="text-7xl text-green-500">✓</span>
                    </div>

                    <div className="text-center">
                        <p className="text-4xl font-bold text-green-400 mb-2">पहचान सफल!</p>
                        <p className="text-2xl text-white">नमस्ते </p>
                    </div>
                </div>
            )}

            {/* CSS animation for the scanning line */}
            <style>{`
                @keyframes scan {
                    0% { transform: translateY(0); }
                    100% { transform: translateY(256px); }
                }
            `}</style>
        </div>
    );
};
