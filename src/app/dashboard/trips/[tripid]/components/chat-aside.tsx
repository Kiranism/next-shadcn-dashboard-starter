"use client";

import { useState } from "react";
import { Place } from "./map";

type Message = {
  sender: "You" | "Assistant";
  text: string;
};

type PendingAction = {
  action_type: "update" | "delete" | "add" | "none";
  summary: string;
  operations: Array<{
    target_name: string;
    action: "update" | "delete" | "add";
    name?: string;
    city?: string;
    category?: string;
    day?: string;
    date?: string;
    startTime?: string;
    endTime?: string;
  }>;
};

type ChatAsideProps = {
  isOpen: boolean;
  onClose: () => void;
  places: Place[];
  taggedPlace: Place | null;
  onClearTaggedPlace: () => void;
  onApplyPlaces: (places: Place[]) => void;
  onSelectPlace: (place: Place) => void;
};

export default function ChatAside({
  isOpen,
  onClose,
  places,
  taggedPlace,
  onClearTaggedPlace,
  onApplyPlaces,
  onSelectPlace,
}: ChatAsideProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

  const sendMessage = async () => {
    const text = inputText.trim();
    if (!text || isSending || pendingAction) return;

    setMessages((prev) => [...prev, { sender: "You", text }]);
    setInputText("");

    setIsSending(true);
    try {
      const response = await fetch("/api/trips/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: text,
          taggedPlaceName: taggedPlace?.name,
          places,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update trip details.");
      }

      const payload = (await response.json()) as {
        assistant_message?: string;
        places?: Place[];
        needs_confirmation?: boolean;
        pending_action?: PendingAction | null;
      };

      if (payload.needs_confirmation && payload.pending_action) {
        setPendingAction(payload.pending_action);
        setMessages((prev) => [
          ...prev,
          {
            sender: "Assistant",
            text:
              payload.assistant_message ||
              `I found a ${payload.pending_action?.action_type ?? "change"} request. Do you want me to apply it?`,
          },
        ]);
        return;
      }

      if (payload.places && payload.places.length > 0) {
        onApplyPlaces(payload.places);

        if (taggedPlace) {
          const updatedTagged = payload.places.find(
            (place) => place.name.toLowerCase() === taggedPlace.name.toLowerCase(),
          );
          if (updatedTagged) {
            onSelectPlace(updatedTagged);
          }
        }
      }

      setMessages((prev) => [
        ...prev,
        {
          sender: "Assistant",
          text:
            payload.assistant_message ||
            "Updated your trip details based on your request.",
        },
      ]);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update trip details.";
      setMessages((prev) => [
        ...prev,
        { sender: "Assistant", text: `I could not apply that update. ${errorMessage}` },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const confirmPendingAction = async (confirmed: boolean) => {
    if (!pendingAction || isSending) return;

    if (!confirmed) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "Assistant",
          text: "Cancelled the requested update.",
        },
      ]);
      setPendingAction(null);
      return;
    }

    setIsSending(true);
    try {
      const response = await fetch("/api/trips/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: pendingAction.summary,
          taggedPlaceName: taggedPlace?.name,
          places,
          confirm: true,
          pendingAction,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to apply the confirmed update.");
      }

      const payload = (await response.json()) as {
        assistant_message?: string;
        places?: Place[];
      };

      if (payload.places && payload.places.length > 0) {
        onApplyPlaces(payload.places);
      }

      setMessages((prev) => [
        ...prev,
        {
          sender: "Assistant",
          text:
            payload.assistant_message || "Applied the confirmed update to your trip.",
        },
      ]);
      setPendingAction(null);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to apply the confirmed update.";
      setMessages((prev) => [
        ...prev,
        { sender: "Assistant", text: errorMessage },
      ]);
    } finally {
      setIsSending(false);
    }
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
            {taggedPlace ? (
              <div className="mt-2 flex items-center gap-2">
                <span className="rounded-full border border-amber-300/40 bg-amber-300/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-200">
                  Tagged: {taggedPlace.name}
                </span>
                <button
                  type="button"
                  onClick={onClearTaggedPlace}
                  className="text-xs text-slate-300 underline-offset-2 transition hover:text-white hover:underline"
                >
                  Clear
                </button>
              </div>
            ) : null}
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
            {pendingAction ? (
              <div className="rounded-[24px] border border-amber-300/30 bg-amber-300/10 px-4 py-4 text-sm text-amber-100">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-200/90">
                  Confirmation required
                </p>
                <p className="mt-2 leading-relaxed text-slate-100">
                  {pendingAction.action_type === "delete"
                    ? `Delete the selected place(s)? ${pendingAction.summary}`
                    : pendingAction.action_type === "add"
                      ? `Add the new event(s)? ${pendingAction.summary}`
                    : `Apply these place updates? ${pendingAction.summary}`}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => confirmPendingAction(true)}
                    disabled={isSending}
                    className="rounded-full bg-amber-400 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-950 transition hover:brightness-105 disabled:opacity-60"
                  >
                    Yes, apply
                  </button>
                  <button
                    type="button"
                    onClick={() => confirmPendingAction(false)}
                    disabled={isSending}
                    className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-white/10 disabled:opacity-60"
                  >
                    No, cancel
                  </button>
                </div>
              </div>
            ) : null}

            {messages.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-white/12 bg-white/5 px-4 py-4 text-sm text-slate-300">
                Start with a destination, ask for route help, or request a place update.
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
              placeholder={pendingAction ? "Confirm or cancel the pending change above" : "Ask about routes, hotels, or timing"}
              className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none"
              disabled={isSending || Boolean(pendingAction)}
            />
            <button
              type="button"
              onClick={sendMessage}
              disabled={isSending || Boolean(pendingAction)}
              className="rounded-[18px] bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:brightness-105"
            >
              {isSending ? "Updating..." : "Send"}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
