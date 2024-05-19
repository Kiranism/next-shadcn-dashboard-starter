"use client";
// import { INFINITE_QUERY_LIMIT } from "@/config/infinite-query";
import { Loader2, MessageSquare } from "lucide-react";
import Skeleton from "react-loading-skeleton";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useIntersection } from "@mantine/hooks";
import { ChatMessage, ExtendedMessage } from "./Message";
import { queryApi } from "@/app/api/queryApi";
import { v4 as uuid } from "uuid";
import { is } from "date-fns/locale";

interface MessagesProps {
  fileId: string;
  session_id: string;
  isProcessing: boolean;
  lastMessage?: string;
}

const Messages = ({
  fileId,
  session_id,
  lastMessage,
  isProcessing,
}: MessagesProps) => {
  //   const { isLoading: isAiThinking } = useContext(ChatContext);

  const loadingMessage = {
    createdAt: new Date().toISOString(),
    id: "loading-message",
    isUserMessage: false,
    text: (
      <span className="flex h-full items-center justify-center">
        <Loader2 className="h-4 w-4 animate-spin" />
      </span>
    ),
  };

  const { data, isLoading } = queryApi.useListQueryLogsQuery({
    session_id: session_id,
    limit: 10,
    offset: 0,
    query_like: undefined,
  });

  const testMessage = {
    createdAt: new Date().toISOString(),
    id: uuid(),
    isUserMessage: false,
    text: "Hello, how can I help you today? I am a test message. I do have nothing else to say, sorry for being dummy. ",
  };

  const messages: ExtendedMessage[] = useMemo(() => {
    return [
      ...(isProcessing
        ? [
            loadingMessage,
            {
              createdAt: new Date().toISOString(),
              id: uuid(),
              isUserMessage: true,
              text: lastMessage,
            },
          ]
        : []),
      ...(data?.logs.flatMap((log) => {
        const responseMessage = {
          createdAt: new Date().toISOString(),
          id: log.id + "1",
          isUserMessage: false,
          text: "Roger.",
          documents: [
            ...log.documents.map((doc) => {
              return {
                id: doc.id,
                title: doc.meta?.title ?? doc.name,
                mediaType: doc.meta?.media_type ?? "text/plain",
              };
            }),
          ],
        };
        return [
          responseMessage,
          {
            createdAt: log.timestamp as string,
            id: log.id,
            isUserMessage: true,
            text: log.query,
          },
        ];
      }) ?? []),
      testMessage,
    ]; //data?.pages.flatMap((page) => page.messages);
  }, [data, lastMessage]);

  const combinedMessages = [
    ...(false ? [loadingMessage] : []),
    ...(messages ?? []),
  ];

  const lastMessageRef = useRef<HTMLDivElement>(null);

  const { ref, entry } = useIntersection({
    root: lastMessageRef.current,
    threshold: 1,
  });

  useEffect(() => {
    if (entry?.isIntersecting) {
      console.log("fetching next page");
    }
  }, [entry]);

  // useEffect(() => {
  //   if (entry?.isIntersecting) {
  //     fetchNextPage();
  //   }
  // }, [entry, fetchNextPage]);

  return (
    <div className="flex max-h-[calc(100vh-3.5rem-15rem)] border-zinc-200 flex-1 flex-col-reverse gap-4 p-3 overflow-y-auto scrollbar-thumb-blue scrollbar-thumb-rounded scrollbar-track-blue-lighter scrollbar-w-2 scrolling-touch">
      {combinedMessages && combinedMessages.length > 0 ? (
        combinedMessages.map((message, i) => {
          const isNextMessageSamePerson =
            combinedMessages[i - 1]?.isUserMessage ===
            combinedMessages[i]?.isUserMessage;

          if (i === combinedMessages.length - 1) {
            return (
              <ChatMessage
                ref={ref}
                message={message}
                isNextMessageSamePerson={isNextMessageSamePerson}
                key={message.id}
              />
            );
          } else
            return (
              <ChatMessage
                message={message}
                isNextMessageSamePerson={isNextMessageSamePerson}
                key={message.id}
              />
            );
        })
      ) : true ? (
        <div className="w-full flex flex-col gap-2">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-2">
          <MessageSquare className="h-8 w-8 text-blue-500" />
          <h3 className="font-semibold text-xl">You&apos;re all set!</h3>
          <p className="text-zinc-500 text-sm">
            Ask your first question to get started.
          </p>
        </div>
      )}
    </div>
  );
};

export default Messages;
