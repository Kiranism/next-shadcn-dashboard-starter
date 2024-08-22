import { createUploadthing, type FileRouter } from 'uploadthing/next';

const f = createUploadthing();

const auth = () => ({ id: 'fakeId' }); // Fake auth function

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // Define as many FileRoutes as you like, each with a unique routeSlug
  imageUploader: f({ image: { maxFileSize: '4MB', maxFileCount: 3 } })
    // Set permissions and file types for this FileRoute
    .middleware(async ({}) => {
      console.log('uploading');
      return { userId: 'id' };
    })
    .onUploadComplete(async () => {
      // This code RUNS ON YOUR SERVER after upload
    })
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
