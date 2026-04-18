interface Props {
    onUp?: () => void;
    onDown?: () => void;
    onLongUp?: () => void;
    onLongDown?: () => void;
}

export const VirtualVolumeControls = ({
    onUp,
    onDown,
    onLongUp,
    onLongDown,
}: Props) => {
    return (
        <div className="fixed bottom-6 right-4 flex flex-col gap-4 z-50">

            {/* 🔼 Volume Up */}
            <button
                onClick={onUp}
                onMouseDown={(e) => {
                    const timer = setTimeout(() => {
                        onLongUp?.();
                    }, 800);

                    const clear = () => clearTimeout(timer);
                    e.currentTarget.onmouseup = clear;
                    e.currentTarget.onmouseleave = clear;
                }}
                className="w-16 h-16 rounded-full bg-green-600 text-white text-2xl shadow-lg active:scale-95"
            >
                ▲
            </button>

            {/* 🔽 Volume Down */}
            <button
                onClick={onDown}
                onMouseDown={(e) => {
                    const timer = setTimeout(() => {
                        onLongDown?.();
                    }, 800);

                    const clear = () => clearTimeout(timer);
                    e.currentTarget.onmouseup = clear;
                    e.currentTarget.onmouseleave = clear;
                }}
                className="w-16 h-16 rounded-full bg-red-600 text-white text-2xl shadow-lg active:scale-95"
            >
                ▼
            </button>
        </div>
    );
};