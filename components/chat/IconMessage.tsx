import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { Icon, Icons } from "../icons";
import { format } from "date-fns";
import { forwardRef } from "react";
import { TextMessage } from "./TextMessage";
import { ExtendedMessage } from "./Message";

export type IconMessageProps = {
  message: ExtendedMessage;
  isNextMessageSamePerson: boolean;
};

export const IconMessage = forwardRef<HTMLDivElement, IconMessageProps>(
  ({ message, isNextMessageSamePerson }, ref) => {
    return (
      <div
        className={cn(
          "relative flex h-6 w-6 aspect-square items-center justify-center",
          {
            "order-2 bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700  rounded-sm":
              message.isUserMessage,
            "order-1 bg-zinc-800 rounded-sm": !message.isUserMessage,
            invisible: isNextMessageSamePerson,
          },
        )}
      >
        {message.isUserMessage ? (
          <Icons.user className="fill-zinc-800 text-zinc-800 dark:fill-zinc-100 dark:text-zinc-100 h-3/4 w-3/4" />
        ) : (
          <Icons.logo className="fill-zinc-300 h-3/4 w-3/4" />
        )}
      </div>
    );
  },
);
