import { useEffect } from 'react';

interface VolumeKeyOptions {
    onUp?: () => void;
    onDown?: () => void;
    onLongUp?: () => void;
    onLongDown?: () => void;
    longPressDuration?: number;
    enabled?: boolean;
}

export const useVolumeKeys = ({
    onUp,
    onDown,
    onLongUp,
    onLongDown,
    longPressDuration = 1500,
    enabled = true,
}: VolumeKeyOptions) => {
    useEffect(() => {
        if (!enabled) return;

        let upTimer: ReturnType<typeof setTimeout> | null = null;
        let downTimer: ReturnType<typeof setTimeout> | null = null;
        let upFired = false;
        let downFired = false;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'AudioVolumeUp' || e.key === 'VolumeUp') {
                e.preventDefault();
                if (upFired) return;
                upTimer = setTimeout(() => {
                    upFired = true;
                    onLongUp?.();
                }, longPressDuration);
            }
            if (e.key === 'AudioVolumeDown' || e.key === 'VolumeDown') {
                e.preventDefault();
                if (downFired) return;
                downTimer = setTimeout(() => {
                    downFired = true;
                    onLongDown?.();
                }, longPressDuration);
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.key === 'AudioVolumeUp' || e.key === 'VolumeUp') {
                e.preventDefault();
                if (upTimer) clearTimeout(upTimer);
                if (!upFired) onUp?.();
                upFired = false;
            }
            if (e.key === 'AudioVolumeDown' || e.key === 'VolumeDown') {
                e.preventDefault();
                if (downTimer) clearTimeout(downTimer);
                if (!downFired) onDown?.();
                downFired = false;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            if (upTimer) clearTimeout(upTimer);
            if (downTimer) clearTimeout(downTimer);
        };
    }, [onUp, onDown, onLongUp, onLongDown, longPressDuration, enabled]);
};