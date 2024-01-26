import { GetAllFilesResponse, getFileUrl } from "@/app/api/uploadthing/core";

export function ImageList({ data }: { data: GetAllFilesResponse }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {data.map((file, index) => (
        <div key={index} className="grid gap-4">
          <div>
            <img
              src={getFileUrl(file.key)}
              alt={file.key}
              className="h-auto max-w-full rounded-lg"
            />
          </div>
        </div>
      ))}
    </div>
  );
}
