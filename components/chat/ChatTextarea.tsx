"use client";
import { Textarea } from "@/components/ui/textarea-autosize";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Paperclip, Send } from "lucide-react";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "../ui/use-toast";
import { useCallback, useRef, useState } from "react";
import { queryApi } from "@/app/api/queryApi";

export type ChatTextareaProps = {
  onSend: (message: string) => void;
  sessionId: string;
};

const FormSchema = z.object({
  message: z
    .string()
    .min(1, {
      message: "Message must not be empty.",
    })
    .max(300, {
      message: "Message must not be longer than 300 characters.",
    }),
});

export const ChatTextarea = (props: ChatTextareaProps) => {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
  });

  // const onSubmit = useCallback(
  //   async (message: string) => {
  //     console.log("message", message);
  //     props.onSend(message);
  //     console.log("onSent");
  //     toast({
  //       title: "You submitted the following values:",
  //       description: (
  //         <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
  //           <code className="text-white">
  //             {JSON.stringify(message, null, 2)}
  //           </code>
  //         </pre>
  //       ),
  //     });
  //     query({ query: message, top_k: 5, session_id: props.sessionId });
  //   },
  //   [form],
  // );
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [message, setMessage] = useState("");
  return (
    <div className="absolute bottom-0 left-0 w-full">
      <div className="mx-2 flex flex-row gap-3 md:mx-4 md:last:mb-6 lg:mx-auto lg:max-w-2xl xl:max-w-3xl">
        <div className="relative flex h-full flex-1 items-stretch md:flex-col">
          <div className="relative flex flex-col w-full flex-grow p-4">
            <div className="relative">
              <Textarea
                rows={1}
                ref={textareaRef}
                maxRows={4}
                autoFocus
                onChange={(e) => setMessage(e.target.value)}
                value={message}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();

                    props.onSend(message);

                    setMessage("");
                    textareaRef.current?.focus();
                  }
                }}
                placeholder="Enter your question..."
                className="bg-background resize-none pr-12 text-base py-3 scrollbar-thumb-blue scrollbar-thumb-rounded scrollbar-track-blue-lighter scrollbar-w-2 scrolling-touch"
              />

              <Button
                // disabled={isLoading || isDisabled}
                className="absolute bottom-1.5 right-[8px]"
                aria-label="send message"
                onClick={() => {
                  props.onSend(message);
                  setMessage("");

                  textareaRef.current?.focus();
                }}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
