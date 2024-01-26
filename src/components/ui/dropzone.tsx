import React, { ChangeEvent, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface DropzoneProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "value" | "onChange"
  > {
  handleOnDrop: (acceptedFiles: FileList | null) => void;
  classNameWrapper?: string;
  className?: string;
  dropMessage: string;
  extensions?: string;
}

export const Dropzone = React.forwardRef<HTMLDivElement, DropzoneProps>(
  (
    {
      className,
      classNameWrapper,
      dropMessage,
      handleOnDrop,
      extensions,
      ...props
    },
    ref,
  ) => {
    const inputRef = useRef<HTMLInputElement | null>(null);

    const [fileName, setFileName] = React.useState<string | null>(null);

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      handleOnDrop(null);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      const { files } = e.dataTransfer;
      if (inputRef.current) {
        inputRef.current.files = files;
        handleOnDrop(files);
      }
    };

    const handleButtonClick = () => {
      if (inputRef.current) {
        inputRef.current.click();
      }
    };

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
      const { files } = e.target;

      if (files) {
        if (extensions) {
          // Check file extensions if extensions are specified
          const validFiles = Array.from(files).filter((file) => {
            const fileExtension = file.name.split(".").pop();
            return (
              fileExtension && extensions.slice(1).split(",").includes(fileExtension)
            );
          }) as unknown as FileList;

          if (validFiles.length > 0) {
            // Valid file extension
            setFileName(validFiles[0].name);
            handleOnDrop(validFiles);
          } else {
            // Invalid file extension
            handleOnDrop(null);
          }
        } else {
          // Accept all files if no extensions are specified
          handleOnDrop(files);
        }
      }
    };

    return (
      <Card
        ref={ref}
        className={cn(
          `border-2 border-dashed bg-muted hover:cursor-pointer hover:border-muted-foreground/50`,
          classNameWrapper,
        )}
      >
        <CardContent
          className="flex flex-col items-center justify-center space-y-2 px-2 py-4 text-xs"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={handleButtonClick}
        >
          <div className="flex items-center justify-center text-muted-foreground">
            <div className="flex flex-col gap-2 items-center">
              {fileName ? (
                <span>
                  {fileName}
                </span>
              ) : (
                <span>{dropMessage}</span>
              )}
            </div>
            <Input
              {...props}
              value={undefined}
              ref={inputRef}
              type="file"
              className={cn("hidden", className)}
              onChange={handleInputChange}
              accept={extensions}
            />
          </div>
        </CardContent>
      </Card>
    );
  },
);
