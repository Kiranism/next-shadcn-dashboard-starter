"use client";

import { useState } from "react";

type Message = {
  sender: string;
  text: string;
};

type ChatAsideProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function ChatAside({ isOpen, onClose }: ChatAsideProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");

  const sendMessage = () => {
    const text = inputText.trim();
    if (!text) return;

    setMessages((prev) => [...prev, { sender: "You", text }]);
    setInputText("");
  };

  const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (event) => {
    if (event.key === "Enter") {
      sendMessage();
    }
  };

  return (
    <>
      {isOpen ? (
        <button
          type="button"
          aria-label="Close chat backdrop"
          onClick={onClose}
          className="fixed inset-0 z-20 cursor-default bg-slate-950/25 backdrop-blur-[2px] md:bg-transparent md:backdrop-blur-0"
        />
      ) : null}

      <aside
        className={`${
          isOpen
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-4 opacity-0"
        } fixed inset-x-3 bottom-3 top-[22dvh] z-30 flex flex-col overflow-hidden rounded-[30px] border border-white/45 bg-slate-950/88 text-white shadow-[0_30px_90px_rgba(15,23,42,0.36)] backdrop-blur-2xl transition-all duration-300 md:inset-y-5 md:right-5 md:left-auto md:w-[min(440px,calc(100vw-2.5rem))] md:top-5 md:bottom-5`}
        aria-hidden={!isOpen}
      >
        <div className="flex items-start justify-between gap-3 border-b border-white/10 px-4 py-4">
          <div className="min-w-0">
            <div className="mb-2 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-300">
                Trip Assistant
              </span>
            </div>
            <h3 className="text-lg font-semibold text-white">
              Route help, place ideas, quick planning
            </h3>
            <p className="mt-1 text-sm text-slate-300">
              Ask for the best route, a stay nearby, or a shorter trip view.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full border border-white/10 bg-white/8 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/14"
          >
            Close
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4">
          <div className="space-y-3">
            {messages.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-white/12 bg-white/5 px-4 py-4 text-sm text-slate-300">
                Start with a destination or ask for a route recommendation.
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={`${message.sender}-${index}`}
                  className={`flex ${message.sender === "You" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-[22px] px-4 py-3 text-sm leading-relaxed shadow-sm ${
                      message.sender === "You"
                        ? "bg-amber-400 text-slate-950"
                        : "bg-white/10 text-white"
                    }`}
                  >
                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.22em] opacity-75">
                      {message.sender}
                    </p>
                    <p>{message.text}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="border-t border-white/10 bg-slate-950/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="flex gap-2 rounded-[24px] border border-white/10 bg-white/6 p-2 shadow-inner shadow-slate-950/20">
            <input
              type="text"
              value={inputText}
              onChange={(event) => setInputText(event.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Ask about routes, hotels, or timing"
              className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none"
            />
            <button
              type="button"
              onClick={sendMessage}
              className="rounded-[18px] bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:brightness-105"
            >
              Send
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
