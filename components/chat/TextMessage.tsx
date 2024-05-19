import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { Icons } from "../icons";
import { format } from "date-fns";
import { forwardRef } from "react";
import { ExtendedMessage } from "./Message";

export type TextMessageProps = {
  message: ExtendedMessage;
  isNextMessageSamePerson: boolean;
};

export const TextMessage = forwardRef<HTMLDivElement, TextMessageProps>(
  ({ message, isNextMessageSamePerson }, ref) => {
    return (
      <div
        className={cn(
          "flex flex-col space-y-2 text-md max-w-md mx-1 border border-gray-300 dark:border-zinc-700 rounded-lg",
          {
            "order-1 items-end rounded-br-none": message.isUserMessage,
            "order-2 items-start rounded-bl-none": !message.isUserMessage,
          },
        )}
      >
        <div
          className={cn("px-4 py-1.5 rounded-lg inline-block", {
            "bg-white dark:bg-zinc-900 dark:text-white outlined":
              message.isUserMessage,
            "bg-gray-200 text-gray-900 dark:text-white dark:bg-zinc-800":
              !message.isUserMessage,
            "rounded-br-none":
              !isNextMessageSamePerson && message.isUserMessage,
            "rounded-bl-none":
              !isNextMessageSamePerson && !message.isUserMessage,
          })}
        >
          {typeof message.text === "string" ? (
            <ReactMarkdown
              className={cn("prose", {
                "dark:text-zinc-50": message.isUserMessage,
              })}
            >
              {message.text}
            </ReactMarkdown>
          ) : (
            message.text
          )}
          {message.isUserMessage && (
            <div
              className={cn(
                "text-xs select-none mt-1 w-full text-right text-zinc-400",
                {},
              )}
            >
              {format(new Date(message.createdAt), "HH:mm")}
            </div>
          )}
        </div>
      </div>
    );
  },
);
