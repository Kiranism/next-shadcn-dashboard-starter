"use client";

import { ReturnInsertImage } from "@/app/api/uploadthing/core";
import FileUpload from "@/components/file-upload";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

const ImgSchema = z.object({
  fileName: z.string(),
  name: z.string(),
  fileSize: z.number(),
  size: z.number(),
  fileKey: z.string(),
  key: z.string(),
  fileUrl: z.string(),
  url: z.string(),
});

export const IMG_MAX_LIMIT = 3;

const formSchema = z.object({
  imgUrl: z
    .array(ImgSchema)
    .max(IMG_MAX_LIMIT, { message: "You can only add up to 3 images" })
    .min(1, { message: "At least one image must be added." }),
});

type FormValues = z.infer<typeof formSchema>;

export function UploadImageForm() {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      imgUrl: [],
    },
  });

  return (
    <Form {...form}>
      <form>
        <FormField
          control={form.control}
          name="imgUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Upload an Image</FormLabel>
              <FormControl>
                <FileUpload
                  onChange={field.onChange}
                  value={field.value.map((item) => ({
                    ...item,
                    serverData: {} as ReturnInsertImage,
                  }))}
                  onRemove={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}
