type BotIconProps = {
  isChatOpen: boolean;
  onToggle: () => void;
};

export default function BotIcon({ isChatOpen, onToggle }: BotIconProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`${isChatOpen ? "hidden" : "fixed"} bottom-4 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full border border-white/20 bg-gradient-to-br from-amber-400 to-orange-600 text-white shadow-[0_18px_40px_rgba(249,115,22,0.34)] transition hover:scale-105 hover:brightness-105 md:bottom-5 md:right-5`}
      aria-label="Toggle chat panel"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="h-6 w-6"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8 10h8M8 14h5m-8 7 3.6-2.4a2 2 0 0 1 1.1-.3H18a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H6a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3h.3a2 2 0 0 1 1.1.3L11 21"
        />
      </svg>
    </button>
  );
}
