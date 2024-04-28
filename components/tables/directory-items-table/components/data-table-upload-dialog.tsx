import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UploadIcon } from "@radix-ui/react-icons";
import * as z from "zod";
import { useCallback, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Trash } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
// import FileUpload from "@/components/FileUpload";
import { useToast } from "../../../ui/use-toast";
import { CustomDropzone } from "../../../file-upload";
import { IndexSelector } from "@/components/select/index-selector";
import { SplitterSelector } from "@/components/select/splitter-selector";
import axios, { endpoints } from "@/lib/axios";
import { AxiosResponse } from "axios";
import { CreateDirItemRequest } from "@/constants/directory";
import React from "react";
import { on } from "events";

type ProductFormValues = z.infer<typeof formSchema>;
export const IMG_MAX_LIMIT = 3;

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

const formSchema = z.object({
  name: z
    .string()
    .min(3, { message: "Product Name must be at least 3 characters" }),
  imgUrl: z
    .array(ImgSchema)
    .max(IMG_MAX_LIMIT, { message: "You can only add up to 3 images" })
    .min(1, { message: "At least one image must be added." }),
  units: z.coerce.number(),
  overlap: z.coerce.number(),
  splitter: z.string().min(3, { message: "The chunker name must be valid" }),
  category: z.string().min(1, { message: "Please select a category" }),
});
interface ProductFormProps {
  initialData: any | null;
  categories: any;
}

export function UploadDialog({ initialData, categories }: ProductFormProps) {
  const defaultValues = initialData
    ? initialData
    : {
        name: "",
        description: "",
        price: 0,
        imgUrl: [],
        category: "",
        units: 100,
        overlap: 50,
        splitter: "chunker",
      };

  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imgLoading, setImgLoading] = useState(false);
  const title = initialData ? "Edit product" : "Create product";
  const description = initialData ? "Edit a product." : "Add a new product";
  const toastMessage = initialData ? "Product updated." : "Product created.";

  const [sucessFileNames, setSuccessFileNames] = useState<string[]>([]);
  const [failedFileNames, setFailedFileNames] = useState<string[]>([]);

  const [files, setFiles] = useState<File[]>([]);
  const handleRemoveFile = (file: File) => {
    const fs = files.filter((f) => f.name != file.name);
    setFiles(fs);
  };
  const handleAddFiles = (newFiles: File[]) => {
    setFiles(files.concat(newFiles));
  };
  const createDirItem = (
    request: CreateDirItemRequest,
  ): Promise<AxiosResponse> => {
    const formData = new FormData();
    request.file && formData.append("file", request.file);
    request.name && formData.append("name", request.name);
    request.description && formData.append("description", request.description);
    request.parent_id && formData.append("parent_id", request.parent_id);
    request.tags && formData.append("tags", request.tags.toString());
    request.is_external_integration &&
      formData.append(
        "is_external_integration",
        request.is_external_integration.toString(),
      );
    const config = {
      headers: {
        "content-type": "multipart/form-data",
      },
    };
    const res = axios.post(endpoints.directory.item.root, formData, config);
    return res;
  };

  const uploadFileMultipart = useCallback(async (file: File) => {
    const request: CreateDirItemRequest = {
      name: file.name,
      file: file,
      description: "",
      parent_id: undefined,
      tags: ["test"],
      //is_external_integration: false
    };
    const response = await createDirItem(request);
  }, []);

  const getFileState = useCallback(
    (fileName: string) => {
      if (failedFileNames.includes(fileName)) {
        return "error";
      }
      if (sucessFileNames.includes(fileName)) {
        return "success";
      } else return undefined;
    },
    [sucessFileNames, failedFileNames],
  );

  const isFailedFile = (fileName: string) => {
    return failedFileNames.includes(fileName);
  };
  const handleUpload = async () => {
    await Promise.all(
      files.map(async (file) => {
        await uploadFileMultipart(file)
          .then(() => {
            setSuccessFileNames([...sucessFileNames, file.name]);
          })
          .catch((error) => {
            setFailedFileNames([...failedFileNames, file.name]);
            throw error;
          });
      }),
    )
      .then(() => {
        toast({
          variant: "default",
          title: "Upload success.",
        });
        // onUpload ? onUpload() : {};
        // onClose();
      })
      .catch((error) => {
        if (error.response.status == 415) {
          toast({
            variant: "destructive",
            title: "File not supported.",
          });
        }
        if (error.response.status == 409) {
          toast({
            variant: "destructive",
            title: "File already exists",
          });
        } else {
          toast({
            variant: "destructive",
            title: "Oh no! Something went wrong.",
          });
        }
      });
  };

  const onSubmit = async (data: ProductFormValues) => {
    console.log("units:" + data.units);
    try {
      setLoading(true);
      if (initialData) {
        // await axios.post(`/api/products/edit-product/${initialData._id}`, data);
      } else {
        // const res = await axios.post(`/api/products/create-product`, data);
        // console.log("product", res);
      }
      router.refresh();
      router.push(`/dashboard/products`);
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: "There was a problem with your request.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: "There was a problem with your request.",
      });
    } finally {
      setLoading(false);
    }
  };

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const units = form.watch("units");
  const overlap = form.watch("overlap");

  const isValid: boolean = useMemo(() => {
    console.log("units:" + units);
    console.log("overlap:" + overlap);
    console.log("files:" + files.length);
    return units > overlap && files.length > 0;
  }, [units, overlap, files]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="ml-auto hidden h-8 lg:flex">
          <UploadIcon className="mr-2 h-4 w-4" />
          Upload
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Upload file</DialogTitle>
          <DialogDescription>
            The files are indexed and splitted according to the selected
            settings.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-8 w-full"
          >
            <FormField
              control={form.control}
              name="imgUrl"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <CustomDropzone
                      files={files}
                      onAdd={handleAddFiles}
                      onRemove={handleRemoveFile}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="gap-10">
              <div className="md:grid md:grid-cols-3 gap-8">
                <FormField
                  control={form.control}
                  name="splitter"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Splitter</FormLabel>
                      <FormControl>
                        <SplitterSelector
                          value={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="units"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Units</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step={10}
                          disabled={loading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="overlap"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Overlap</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step={10}
                          disabled={loading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Index</FormLabel>
                  {/* <Select
                    disabled={loading}
                    onValueChange={field.onChange}
                    value={field.value}
                    defaultValue={field.value}
                  >
                    <SelectTrigger
                      className="w-full color-primary-500 overflow-hidden"
                      style={{ width: "100%" }}
                    >
                      <SelectValue
                        defaultValue={field.value}
                        className="w-full color-primary-500 overflow-hidden"
                        placeholder="Select index..."
                      />
                    </SelectTrigger>
                    <SelectContent className="w-full hover:opacity-100 hover:bg-primary-100">
                      {/* @ts-ignore  */}
                  {/* {categories.map((category) => (
                        <SelectItem
                          className="w-full hover:opacity-100 hover:bg-primary-100"
                          key={category._id}
                          value={category._id}
                        >
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent> */}
                  <FormControl>
                    <IndexSelector
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  {/* // </Select> */}
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
        <DialogFooter>
          <Button disabled={!isValid} type="submit">
            Upload
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
