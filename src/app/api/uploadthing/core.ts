import { createUploadthing, type FileRouter } from "uploadthing/next";

export type ReturnInsertImage = {
  id: string;
  url: string;
};

const f = createUploadthing();

const auth = () => ({ id: "rafaar" }); // Fake auth function

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // Define as many FileRoutes as you like, each with a unique routeSlug
  imageUploader: f({ image: { maxFileSize: "4MB", maxFileCount: 3 } })
    // Set permissions and file types for this FileRoute
    .middleware(async ({ }) => {
      // This code runs on your server before upload
      const user = await auth();

      // If you throw, the user will not be able to upload
      if (!user) throw new Error("Unauthorized");

      // Whatever is returned here is accessible in onUploadComplete as `metadata`
      return { userId: user.id };
    })
    .onUploadComplete(async (data): Promise<ReturnInsertImage> => {

      return {
        id: data.file.key,
        url: data.file.url
      }

    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;

export type GetAllFilesResponse = {
  key: string;
  id: string;
  status: "Deletion Pending" | "Failed" | "Uploaded" | "Uploading";
}[]


export const getFileUrl = (key: string) => {
  return `https://utfs.io/f/${key}`;
}
