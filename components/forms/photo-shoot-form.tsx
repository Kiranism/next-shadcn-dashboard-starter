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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Heading } from "@/components/ui/heading";
import { useToast } from "../ui/use-toast";
import FileUpload from "../file-upload";
import { createPhotoShoot, updatePhotoShoot, deletePhotoShoot } from "@/app/api/photoShootApi";

const formSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters" }),
  type: z.string().min(3, { message: "Type must be at least 3 characters" }),
  status: z.boolean(),
  featured: z.boolean(),
  performers: z.string().min(3, { message: "Performers must be at least 3 characters" }),
  photographers: z.string().min(3, { message: "Photographers must be at least 3 characters" }),
  category: z.string().min(3, { message: "Category must be at least 3 characters" }),
  images: z.array(z.instanceof(File)).nonempty("At least one image is required"),
  coverImage: z.instanceof(File).optional(),
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

  const titleText = initialData ? "Edit Photo Shoot" : "Create Photo Shoot";
  const description = initialData
    ? "Edit a photo shoot."
    : "Add a new photo shoot";
  const toastMessage = initialData
    ? "Photo shoot updated."
    : "Photo shoot created.";
  const action = initialData ? "Save changes" : "Create";

  const defaultValues = initialData
    ? { ...initialData, images: [], coverImage: undefined }
    : {
        title: "",
        type: "",
        status: true,
        featured: true,
        performers: "",
        photographers: "",
        category: "",
        images: [],
        coverImage: undefined,
        createdAt: new Date().toISOString(),
      };

  const form = useForm<PhotoShootFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const onSubmit = async (data: PhotoShootFormValues) => {
    try {
      setLoading(true);

      if (initialData) {
        await updatePhotoShoot(initialData._id, data);
      } else {
        await createPhotoShoot(data);
      }

      router.refresh();
      router.push(`/dashboard/photoshoot`);
      toast({
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

  const onRemoveFile = (fileName: string) => {
    const updatedImages = form.getValues("images").filter((file) => file.name !== fileName);
    form.setValue("images", updatedImages);
  };

  const onRemoveCoverImage = () => {
    form.setValue("coverImage", undefined);
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <Heading title={titleText} description={description} />
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
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input
                      disabled={loading}
                      placeholder="Title"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <FormControl>
                    <Input
                      disabled={loading}
                      placeholder="Type"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <FormControl>
                    <input
                      type="checkbox"
                      disabled={loading}
                      checked={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="featured"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Featured</FormLabel>
                  <FormControl>
                    <input
                      type="checkbox"
                      disabled={loading}
                      checked={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="performers"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Performers</FormLabel>
                  <FormControl>
                    <Input
                      disabled={loading}
                      placeholder="Performers"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="photographers"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Photographers</FormLabel>
                  <FormControl>
                    <Input
                      disabled={loading}
                      placeholder="Photographers"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                    <Input
                      disabled={loading}
                      placeholder="Category"
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
                      multiple
                      value={field.value}
                      onChange={(files) => field.onChange(files)}
                      onRemove={onRemoveFile}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="coverImage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cover Image</FormLabel>
                  <FormControl>
                    <FileUpload
                      value={field.value ? [field.value] : []}
                      onChange={(files) => field.onChange(files[0])}
                      onRemove={onRemoveCoverImage}
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
