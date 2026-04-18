import { playTone, vibrate } from '../core/Voice';

interface Props {
    onUp: () => void;
    onDown: () => void;
    disabled?: boolean;
}

export const useVolumeKeys = ({ onUp, onDown, disabled }: Props) => {
    return (
        <div className="fixed bottom-6 right-6 flex flex-col gap-4 z-50">

            {/* UP */}
            <button
                disabled={disabled}
                onClick={() => {
                    if (disabled) return;
                    vibrate([100, 50, 100]);
                    playTone(523, 0.15);
                    onUp();
                }}
                className={`w-20 h-20 rounded-full 
                    ${disabled ? 'bg-green-900 opacity-40' : 'bg-green-600 active:bg-green-700'} 
                    flex items-center justify-center text-3xl shadow-2xl 
                    active:scale-95 transition-transform`}
            >
                ▲
            </button>

            {/* DOWN */}
            <button
                disabled={disabled}
                onClick={() => {
                    if (disabled) return;
                    playTone(330, 0.1);
                    vibrate(50);
                    onDown();
                }}
                className={`w-20 h-20 rounded-full 
                    ${disabled ? 'bg-red-900 opacity-40' : 'bg-red-600 active:bg-red-700'} 
                    flex items-center justify-center text-3xl shadow-2xl 
                    active:scale-95 transition-transform`}
            >
                ▼
            </button>
        </div>
    );
};