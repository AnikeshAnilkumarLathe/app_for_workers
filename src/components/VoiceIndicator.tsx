interface VoiceIndicatorProps {
    active: boolean;
    label?: string;
}

export const VoiceIndicator = ({
    active,
    label = 'रिकॉर्ड हो रहा है...',
}: VoiceIndicatorProps) => {
    return (
        <div className="flex flex-col items-center gap-4 py-6">
            <div className="relative w-20 h-20">
                {active && (
                    <>
                        <div className="absolute inset-0 -m-4 rounded-full border-2 border-red-400/40 animate-ping" />
                        <div className="absolute inset-0 -m-2 rounded-full border-2 border-red-400/60 animate-ping [animation-delay:300ms]" />
                    </>
                )}
                <div
                    className={`
            relative z-10 w-20 h-20 rounded-full flex items-center
            justify-center text-[32px] transition-colors duration-300
            ${active ? 'bg-red-600' : 'bg-slate-700'}
          `}
                >
                    🎙️
                </div>
            </div>
            {active && (
                <p className="text-red-400 text-base font-medium">{label}</p>
            )}
        </div>
    );
};