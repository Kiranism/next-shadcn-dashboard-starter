"use client";
import { OurFileRouter } from "@/app/api/uploadthing/core";
import { UploadDropzone } from "@uploadthing/react";
import { Cloud, FileIcon, Trash } from "lucide-react";
import Image from "next/image";
import { UploadFileResponse } from "uploadthing/client";
import { IMG_MAX_LIMIT } from "./forms/product-form";
import { Button } from "./ui/button";
import { useToast } from "./ui/use-toast";
import { Card } from "@tremor/react";
import { CardContent, CardTitle } from "./ui/card";
import Dropzone from "react-dropzone";
import React from "react";
import { Progress } from "@/components/ui/progress";
import { set } from "date-fns";
import { ScrollArea } from "@radix-ui/react-scroll-area";

interface CustomDropzoneProps {
  files: File[];
  onRemove: (file: File) => void;
  onAdd: (file: File[]) => void;
}

export const CustomDropzone = (props: CustomDropzoneProps) => {
  const [isUploading, setIsUploading] = React.useState<boolean>(true);
  const [uploadProgress, setUploadProgress] = React.useState<number>(0);

  const startSimulatedProgress = () => {
    setUploadProgress(0);

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 95) {
          clearInterval(interval);
          return prev;
        }
        return prev + 5;
      });
    }, 500);
    return interval;
  };

  return (
    <Dropzone
      multiple={false}
      onDrop={async (acceptedFile) => {
        props.onAdd(acceptedFile);
        setIsUploading(true);
        const progressInterval = startSimulatedProgress();
        await new Promise((resolve) => setTimeout(resolve, 2000));
        clearInterval(progressInterval);
        setUploadProgress(100);
      }}
      accept={{
        "application/pdf": [".pdf"],
        "application/xlsx": [".xlsx"],
        "application/vnd.ms-excel": [".xls"],
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
          ".xlsx",
        ],
        "application/msword": [".doc"],
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
          [".docx"],
        "application/vnd.ms-powerpoint": [".ppt"],
        "application/vnd.openxmlformats-officedocument.presentationml.presentation":
          [".pptx"],
        "text/plain": [".txt"],
        "text/csv": [".csv"],
        "text/html": [".html"],
      }}
    >
      {({ getRootProps, getInputProps, acceptedFiles }) => (
        <div
          {...getRootProps()}
          className="border-dashed border-2 border-gray-300 rounded-lg"
        >
          <div className="flex items-center justify-center h-full w-full">
            <label
              htmlFor="dropzone-file"
              className="flex flex-col items-center justify-center w-full h-full rounded-lg cursor-poitner bg-gray-50 hover:bg-gray-100 dark:bg-zinc-900 dark:hover:bg-zinc-800"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-4 w-full">
                <Cloud className="h-8 w-8 mb-2" />
                <div className="mb-2 text-sm text-zinc-700 dark:text-zinc-300">
                  <span className="font-semibold">Click to upload</span> or drag
                  and drop
                </div>
              </div>
              <div className="max-h-48 overflow-scroll mb-3 px-4 w-full">
                <div className="flex flex-col items-center py-1">
                  {props.files.map((file) => {
                    return (
                      <div
                        key={file.name}
                        onClick={(e) => {
                          e.stopPropagation(); //  <------ Here is the magic
                        }}
                        className="mb-2 w-full max-w-xs bg-white dark:bg-zinc-900 flex items-center justify-between rounded-md overflow-hidden outline outline-[1px] outline-zinc-200 divide-x divide-zinc-200"
                      >
                        <div className="px-2 py-1 h-full grid place-items-center">
                          <FileIcon className="h-4 w-4 text-blue-500"></FileIcon>
                        </div>

                        <div className="px-3 py-2 h-full w-full text-sm truncate">
                          {file.name}
                        </div>
                        <div className="flex items-center flex justify-end hover:bg-gray-50 dark:hover:bg-zinc-700">
                          <Button
                            type="button"
                            onClick={(e) => {
                              props.onRemove(file);
                            }}
                            variant="null"
                            size="sm"
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              {/* {isUploading && (
                <div className="w-full mt-1 max-w-xs mx-auto pb-3">
                  <Progress
                    value={50}
                    className="h-1 w-full bg-zinc-200"
                  ></Progress>
                </div>
              )} */}
            </label>
          </div>
        </div>
      )}
    </Dropzone>
  );
};
