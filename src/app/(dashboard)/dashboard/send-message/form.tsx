"use client";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "@/components/ui/use-toast";
import { fetcher } from "@/lib/utils";

import React from "react";
import useSWR from "swr";
import { GetAllFilesResponse, getFileUrl } from "@/app/api/uploadthing/core";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

const sendMessageFormSchema = z.object({
  message: z.string(),
  number: z
    .string()
    .refine(
      (value) =>
        /^(\+62|62)?[\s-]?0?8[1-9]\d{1}[\s-]?\d{4}[\s-]?\d{2,5}$/.test(value),
      {
        message:
          "Invalid phone number, please input with format 628xxxxxx or 08xxxxxx",
      },
    )
    .optional(),
  sendToAll: z.boolean(),
  image: z.instanceof(File).optional(),
});

type SendMessageFormValue = z.infer<typeof sendMessageFormSchema>;

export function SendMessageForm() {
  const form = useForm<SendMessageFormValue>({
    resolver: zodResolver(sendMessageFormSchema),
    defaultValues: {
      sendToAll: false,
    },
  });

  const { data: imageList } = useSWR<GetAllFilesResponse>(
    "/api/images",
    fetcher,
  );

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const data = form.getValues();
      console.log(data);
      toast({
        title: "Success",
        description: (
          <>
            Message sent to <strong>{data.number}</strong>
          </>
        ),
      });
    } catch (error) {
      console.error(error);
    }
  };

  const isSendToAll = form.watch("sendToAll");

  return (
    <Form {...form}>
      <form
        onSubmit={(e) => e.preventDefault()}
        className="flex flex-col gap-4"
      >
        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Message</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="What's on your mind?"
                  rows={4}
                  className="w-full"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Send to</FormLabel>
              <FormControl>
                <Input
                  type="tel"
                  placeholder="Phone number"
                  disabled={isSendToAll}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex gap-2 items-center pb-4">
          <FormField
            control={form.control}
            name="sendToAll"
            disabled={isSendToAll}
            render={({ field }) => (
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
          <Label>Send to all</Label>
        </div>
        <div className="flex gap-2 items-center">
          <FormField
            control={form.control}
            name="number"
            render={() => (
              <FormItem>
                <Dialog>
                  <DialogTrigger className="flex flex-col gap-3">
                    <FormLabel>Image</FormLabel>
                    <Button variant="outline" type="button">
                      Choose an image
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Choose an image</DialogTitle>
                      <DialogDescription>
                        Pick the image for the message
                      </DialogDescription>
                    </DialogHeader>

                    <ScrollArea className="p-3 whitespace-nowrap rounded-lg border">
                      <div className="flex gap-3">
                        {imageList?.map((image) => (
                          <div
                            key={image.key}
                            className="flex items-center gap-4"
                          >
                            <label
                              htmlFor={image.key}
                              className="border-4 has-[:checked]:border-primary items-center rounded-xl border-transparent hover:border-foreground transition-all"
                            >
                              <img
                                src={getFileUrl(image.key)}
                                alt={image.key}
                                className=" w-32 object-cover rounded-xl"
                              />
                              <input
                                type="radio"
                                id={image.key}
                                value={image.key}
                                className="sr-only"
                                {...form.register("image")}
                              />
                            </label>
                          </div>
                        ))}
                      </div>
                      <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                  </DialogContent>
                </Dialog>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button type="submit" onClick={onSubmit}>
          Send
        </Button>
      </form>
    </Form>
  );
}
