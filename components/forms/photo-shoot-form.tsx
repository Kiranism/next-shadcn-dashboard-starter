"use client";
import * as z from "zod";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Trash } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Heading } from "@/components/ui/heading";
import { useToast } from "../ui/use-toast";
import FileUpload from "../file-upload";

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

export const IMG_MAX_LIMIT = 10;

const formSchema = z.object({
  modelName: z
    .string()
    .min(3, { message: "Model Name must be at least 3 characters" }),
  photographer: z
    .string()
    .min(3, { message: "Photographer Name must be at least 3 characters" }),
  images: z
    .array(ImgSchema)
    .max(IMG_MAX_LIMIT, { message: "You can only add up to 10 images" })
    .min(1, { message: "At least one image must be added." }),
});

type PhotoShootFormValues = z.infer<typeof formSchema>;

interface PhotoShootFormProps {
  initialData: any | null;
}

export const PhotoShootForm: React.FC<PhotoShootFormProps> = ({
  initialData,
}) => {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const title = initialData ? "Edit Photo Shoot" : "Create Photo Shoot";
  const description = initialData
    ? "Edit a photo shoot."
    : "Add a new photo shoot";
  const toastMessage = initialData
    ? "Photo shoot updated."
    : "Photo shoot created.";
  const action = initialData ? "Save changes" : "Create";

  const defaultValues = initialData
    ? initialData
    : {
        modelName: "",
        photographer: "",
        images: [],
      };

  const form = useForm<PhotoShootFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const onSubmit = async (data: PhotoShootFormValues) => {
    try {
      setLoading(true);
      if (initialData) {
        // await axios.post(`/api/photoshoots/edit-photoshoot/${initialData._id}`, data);
      } else {
        // const res = await axios.post(`/api/photoshoots/create-photoshoot`, data);
        // console.log("photoshoot", res);
      }
      router.refresh();
      router.push(`/dashboard/photoshoots`);
      toast({
        variant: "destructive",
        title: toastMessage,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: "There was a problem with your request.",
      });
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async () => {
    try {
      setLoading(true);
      // await axios.delete(`/api/${params.storeId}/photoshoots/${params.photoshootId}`);
      router.refresh();
      router.push(`/${params.storeId}/photoshoots`);
    } catch (error) {
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  const triggerImgUrlValidation = () => form.trigger("images");

  return (
    <>
      {/* <AlertModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={onDelete}
        loading={loading}
      /> */}
      <div className="flex items-center justify-between">
        <Heading title={title} description={description} />
        {initialData && (
          <Button
            disabled={loading}
            variant="destructive"
            size="sm"
            onClick={() => setOpen(true)}
          >
            <Trash className="h-4 w-4" />
          </Button>
        )}
      </div>
      <Separator />
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="w-full space-y-8"
        >
          <div className="gap-8 md:grid md:grid-cols-1">
            <FormField
              control={form.control}
              name="modelName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Model Name</FormLabel>
                  <FormControl>
                    <Input
                      disabled={loading}
                      placeholder="Model Name"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="photographer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Photographer</FormLabel>
                  <FormControl>
                    <Input
                      disabled={loading}
                      placeholder="Photographer"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="images"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Images</FormLabel>
                  <FormControl>
                    <FileUpload
                      onChange={field.onChange}
                      value={field.value}
                      onRemove={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <Button disabled={loading} className="ml-auto" type="submit">
            {action}
          </Button>
        </form>
      </Form>
    </>
  );
};
