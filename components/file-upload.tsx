'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Trash } from 'lucide-react';
import Image from 'next/image';
import { Button } from './ui/button';
import { useToast } from './ui/use-toast';

interface ImageUploadProps {
  onChange: (files: File[]) => void;
  onRemove: (fileName: string) => void;
  value: File[];
  multiple?: boolean;
}

export default function FileUpload({ onChange, onRemove, value, multiple = false }: ImageUploadProps) {
  const { toast } = useToast();

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      onChange([...value, ...acceptedFiles]);
    },
    [value, onChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple,
  });

  const handleRemove = (fileName: string) => {
    onRemove(fileName);
  };

  return (
    <div>
      <div className="mb-4 flex items-center gap-4">
        {!!value.length &&
          value.map((file, index) => (
            <div key={index} className="relative h-[200px] w-[200px] overflow-hidden rounded-md">
              <div className="absolute right-2 top-2 z-10">
                <Button type="button" onClick={() => handleRemove(file.name)} variant="destructive" size="sm">
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
              <div>
                <Image fill className="object-cover" alt="Image" src={URL.createObjectURL(file)} />
              </div>
            </div>
          ))}
      </div>
      <div {...getRootProps({ className: 'dropzone border border-dashed p-4' })}>
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop the files here ...</p>
        ) : (
          <p>Drag 'n' drop some files here, or click to select files</p>
        )}
      </div>
    </div>
  );
}
