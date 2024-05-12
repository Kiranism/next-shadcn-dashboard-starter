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
import { useCallback, useRef } from "react";

export type ChatTextareaProps = {
  onSend: (message: string) => void;
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

export const ChatTextarea = () => {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
  });

  const onSubmit = useCallback(
    (data: z.infer<typeof FormSchema>) => {
      toast({
        title: "You submitted the following values:",
        description: (
          <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
            <code className="text-white">{JSON.stringify(data, null, 2)}</code>
          </pre>
        ),
      });
      form.setValue("message", "");
      form.resetField("message");
      form.reset();
    },
    [form],
  );
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const message = form.watch("message");
  return (
    <Form {...form}>
      <form
        className="relative overflow-hidden rounded-lg border bg-background focus-within:ring-1 focus-within:ring-ring"
        x-chunk="A form for sending a message to an AI chatbot. The form has a textarea and buttons to upload files and record audio."
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <Label htmlFor="message" className="sr-only">
          Message
        </Label>
        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Textarea
                  ref={textareaRef}
                  rows={1}
                  maxRows={5}
                  autoFocus
                  id="message"
                  value={message}
                  placeholder="Type your message here..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      onSubmit(form.getValues());
                      textareaRef.current?.focus();
                    }
                  }}
                  className="min-h-12 resize-none border-0 p-3 shadow-none focus-visible:ring-0"
                />
              </FormControl>
            </FormItem>
          )}
        />
        <div className="flex items-center p-3 pt-0">
          <Button
            onClick={() => onSubmit(form.getValues())}
            onKeyDown={(e) => e.keyCode === 13 && onSubmit(form.getValues())}
            type="submit"
            size="sm"
            className="ml-auto gap-1.5"
          >
            <Send className="size-3.5" />
          </Button>
        </div>
      </form>
    </Form>
  );
};
