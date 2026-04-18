import { useCallback, useEffect } from 'react';
import { speak, playTone, useVoiceCommands } from '../core/Voice';
import { useVolumeKeys } from '../core/useVolumeKeys';
import Button from '../components/Button';

const WORKER = {
    name: 'रामलाल',
    daysPresent: 18,
    totalDays: 22,
    dailyWage: 450,
    month: 'अप्रैल',
};

const earned = WORKER.daysPresent * WORKER.dailyWage;

interface WageFlowProps {
    onBack: () => void;
}

export const WageFlow = ({ onBack }: WageFlowProps) => {
    const days = Array.from({ length: WORKER.totalDays }, (_, i) => i < WORKER.daysPresent);

    useEffect(() => {
        speak(
            `${WORKER.month} महीने में ${WORKER.daysPresent} दिन काम हुआ। कुल ${earned.toLocaleString('hi-IN')} रुपये बने हैं।`
        );
    }, []);

    const handleVoice = useCallback((cmds: string[]) => {
        if (cmds.includes('repeat')) {
            speak(`${WORKER.daysPresent} दिन। कुल ${earned.toLocaleString('hi-IN')} रुपये।`);
        } else if (cmds.includes('back')) {
            onBack();
        }
    }, [onBack]);

    useVoiceCommands(handleVoice, true);

    useVolumeKeys({
        onUp: () => {
            playTone(523, 0.15);
            speak(`${WORKER.daysPresent} दिन। कुल ${earned.toLocaleString('hi-IN')} रुपये।`);
        },
        onDown: () => {
            playTone(330, 0.15);
            onBack();
        },
    });

    return (
        <div className="flex flex-col items-center gap-5 px-4 pt-8 pb-6 min-h-screen bg-slate-900 text-white">
            <p className="text-sm text-slate-400">
                {WORKER.month} {new Date().getFullYear()}
            </p>

            <div className="w-full bg-slate-800 rounded-2xl border border-slate-700 p-7 flex flex-col items-center gap-2">
                <p className="text-sm text-slate-400">कुल कमाई</p>
                <p className="text-5xl font-medium text-green-400">
                    ₹{earned.toLocaleString('hi-IN')}
                </p>
            </div>

            <div className="grid grid-cols-7 gap-2 w-full">
                {days.map((present, i) => (
                    <div
                        key={i}
                        className={`aspect-square rounded-full ${present ? 'bg-green-400' : 'bg-slate-700'}`}
                    />
                ))}
            </div>

            <p className="text-sm text-slate-400">
                {WORKER.daysPresent} दिन उपस्थित / {WORKER.totalDays} दिन
            </p>

            <div className="flex flex-col gap-3 w-full mt-auto">
                <Button
                    label="▲ फिर सुनें"
                    variant="up"
                    onPress={() =>
                        speak(`${WORKER.daysPresent} दिन। कुल ${earned.toLocaleString('hi-IN')} रुपये।`)
                    }
                />
                <Button label="▼ वापस" variant="down" onPress={onBack} />
            </div>
        </div>
    );
};