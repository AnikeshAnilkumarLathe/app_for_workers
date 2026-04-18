import { useRef, useState } from 'react';
import { playTone } from '../core/Voice';

interface ButtonProps {
    label: string;
    sublabel?: string;
    onPress?: () => void;
    onLongPress?: () => void;
    longPressDuration?: number;
    variant?: 'up' | 'down' | 'neutral';
    disabled?: boolean;
}

export const Button = ({
    label,
    sublabel,
    onPress,
    onLongPress,
    longPressDuration = 1500,
    variant = 'neutral',
    disabled = false,
}: ButtonProps) => {
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const firedRef = useRef(false);
    const [pct, setPct] = useState(0);
    const [pressing, setPressing] = useState(false);
    const startRef = useRef<number>(0);
    const rafRef = useRef<number | null>(null);

    const variantClass = {
        up: 'bg-green-900 border-green-400 text-white',
        down: 'bg-red-900 border-red-400 text-white',
        neutral: 'bg-slate-800 border-slate-500 text-white',
    }[variant];

    const startPress = () => {
        if (disabled) return;
        firedRef.current = false;
        setPressing(true);
        startRef.current = Date.now();

        if (onLongPress) {
            const tick = () => {
                const elapsed = Date.now() - startRef.current;
                const p = Math.min((elapsed / longPressDuration) * 100, 100);
                setPct(p);
                if (p < 100) rafRef.current = requestAnimationFrame(tick);
            };
            rafRef.current = requestAnimationFrame(tick);

            timerRef.current = setTimeout(() => {
                firedRef.current = true;
                setPressing(false);
                setPct(0);
                if (rafRef.current) cancelAnimationFrame(rafRef.current);
                playTone(660, 0.3, 'triangle');
                onLongPress();
            }, longPressDuration);
        }
    };

    const endPress = () => {
        if (disabled) return;
        if (timerRef.current) clearTimeout(timerRef.current);
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        setPressing(false);
        setPct(0);
        if (!firedRef.current) {
            playTone(variant === 'up' ? 523 : 330, 0.15);
            onPress?.();
        }
    };

    return (
        <button
            onPointerDown={startPress}
            onPointerUp={endPress}
            onPointerLeave={endPress}
            disabled={disabled}
            className={`
        relative w-full min-h-20 rounded-2xl border-2
        flex flex-col items-center justify-center gap-1
        px-4 py-4 overflow-hidden select-none
        text-[22px] font-medium
        disabled:opacity-40 disabled:cursor-not-allowed
        ${variantClass}
      `}
        >
            {pressing && onLongPress && (
                <div
                    className="absolute bottom-0 left-0 h-1 bg-yellow-400 transition-all duration-75"
                    style={{ width: `${pct}%` }}
                />
            )}
            <span>{label}</span>
            {sublabel && (
                <span className="text-[13px] font-normal opacity-70">{sublabel}</span>
            )}
        </button>
    );
};