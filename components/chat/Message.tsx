import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { Icons } from "../icons";
import { format } from "date-fns";
import { forwardRef } from "react";
import { TextMessage } from "./TextMessage";
import { IconMessage } from "./IconMessage";
import { is } from "date-fns/locale";
import {
  itemTypeToIcon,
  mediaTypeToIcon,
  mediaTypes,
} from "@/constants/mediaTypes";

export type DocumentRef = {
  id: string;
  title: string;
  mediaType: string;
};

export type ExtendedMessage = {
  id: string;
  createdAt: string;
  text: string | React.ReactNode;
  isUserMessage: boolean;
  documents?: DocumentRef[];
};
export type ChatMessageProps = {
  message: ExtendedMessage;
  isNextMessageSamePerson: boolean;
};

export const ChatMessage = forwardRef<HTMLDivElement, ChatMessageProps>(
  ({ message, isNextMessageSamePerson }, ref) => {
    return (
      // <div
      //   className={cn("overflow-hidden", {
      //     "justify-end": message.isUserMessage,
      //     "max-w-[50%]": !message.isUserMessage,
      //   })}
      // >
      <div className={"flex flex-col gap-y-2"}>
        <div
          // ref={ref}
          className={cn("flex items-end", {
            "justify-end": message.isUserMessage,
          })}
        >
          <IconMessage
            message={message}
            isNextMessageSamePerson={isNextMessageSamePerson}
          />
          <TextMessage
            message={message}
            isNextMessageSamePerson={isNextMessageSamePerson}
          />
        </div>
        <div className="flex gap-x-2 gap-y-1 flex-wrap items-center max-w-[70%] overflow-hidden">
          {message.documents?.map((doc) => {
            return (
              <div
                key={doc.id}
                className="p-1 cursor-pointer flex flex-row whitespace-nowrap truncate gap-x-2 border rounded-md text-sm "
              >
                {mediaTypeToIcon(doc)} {doc.title}
              </div>
            );
          })}
          {/* //{" "}
          <div className="p-1 flex flex-row gap-x-2 border rounded-md text-sm">
            // {itemTypeToIcon("pdf")} Hola //{" "}
          </div>
          //{" "}
          <div className="p-1 flex flex-row gap-x-2 border rounded-md text-sm">
            // {itemTypeToIcon("pdf")} Hola //{" "}
          </div> */}
        </div>
      </div>
      // </div>
    );
  },
);
