import { ScrollArea } from "@/components/ui/scroll-area";
import { UploadImageForm } from "./form";
import { Separator } from "@/components/ui/separator";
import { getAllFiles } from "@/app/api/uploadthing/server";
import { ImageList } from "@/components/image-list";


export default async function Page() {
  const imageList = await getAllFiles();

  return (
    <ScrollArea className="h-full">
      <div className="flex-1 space-y-8 p-4 md:p-8 pt-6">
        <h2 className="text-3xl font-bold tracking-tight">Gallery</h2>

        <UploadImageForm />

        <Separator />

        <ImageList data={imageList} />
      </div>
    </ScrollArea>
  );
}
