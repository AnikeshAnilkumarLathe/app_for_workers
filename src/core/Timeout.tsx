import { useEffect, useRef, useState } from 'react';

interface LongPressProgressProps {
    active: boolean;
    duration?: number;
    onComplete?: () => void;
}

// Progress bar that fills during a long press
export const LongPressProgress = ({
    active,
    duration = 1500,
    onComplete,
}: LongPressProgressProps) => {
    const [pct, setPct] = useState(0);
    const startRef = useRef<number | null>(null);
    const rafRef = useRef<number | null>(null);

    useEffect(() => {
        if (active) {
            startRef.current = Date.now();
            const tick = () => {
                const elapsed = Date.now() - (startRef.current ?? Date.now());
                const p = Math.min((elapsed / duration) * 100, 100);
                setPct(p);
                if (p < 100) {
                    rafRef.current = requestAnimationFrame(tick);
                } else {
                    onComplete?.();
                }
            };
            rafRef.current = requestAnimationFrame(tick);
        } else {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            setPct(0);
        }
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [active, duration, onComplete]);

    if (!active && pct === 0) return null;

    return (
        <div style={{
            width: '100%',
            height: '4px',
            background: 'rgba(255,255,255,0.15)',
            borderRadius: '2px',
            overflow: 'hidden',
            margin: '12px 0',
        }}>
            <div style={{
                width: `${pct}%`,
                height: '100%',
                background: '#facc15',
                borderRadius: '2px',
                transition: 'width 0.05s linear',
            }} />
        </div>
    );
};