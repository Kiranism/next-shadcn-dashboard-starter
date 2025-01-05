'use client';
import React, { useState } from 'react';
import { Camera, CircleX } from 'lucide-react';

interface IFileImages {
  fileImages: (images: any) => void;
  defaultImages: any[];
}

export default function FileUpload(props: IFileImages) {
  const [fileInputs, setFileInputs] = useState(() => {
    return [
      ...props.defaultImages,
      ...new Array(8 - props.defaultImages.length).fill(null)
    ];
  });

  const handleFileChange = (
    index: number,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      // Null check for files
      const newFile = files[0];
      const updatedFileInputs = [...fileInputs];
      updatedFileInputs[index] = newFile; // Replace the null or existing image with the selected file
      setFileInputs(updatedFileInputs);
      props.fileImages(updatedFileInputs);
    }
  };

  const removeFile = (index: number) => {
    const files = [...fileInputs];
    files[index] = null;
    setFileInputs(files);
    props.fileImages(files);
  };

  return (
    <div className="-mx-2 mt-5 flex flex-wrap">
      {fileInputs.map((file, index) => (
        <div className="mb-4 w-full px-2 md:w-1/2 lg:w-1/4" key={index}>
          <div className="bg-gray-100rounded-md relative rounded-md border border-input p-4 text-center text-gray-500 shadow dark:bg-black">
            {file && (
              <div className="absolute right-2 top-2">
                <span
                  onClick={() => removeFile(index)}
                  className="cursor-pointer"
                >
                  <CircleX size={20} color="red" />
                </span>
              </div>
            )}
            <label
              htmlFor={`input-file${index}`}
              className="block cursor-pointer"
            >
              {!file && (
                <>
                  <span className="mb-2 flex items-center justify-center text-xl">
                    <Camera className="mr-2 h-6 w-6" />
                  </span>
                  <p className="text-sm">Click to add image</p>
                </>
              )}
              {file && (
                <>
                  <img
                    src={
                      typeof file === 'string'
                        ? file
                        : URL.createObjectURL(file)
                    }
                    width={0}
                    height={0}
                    sizes="100vw"
                    style={{ width: '100%', height: 'auto' }}
                    className="h-auto w-full rounded-md"
                    alt={`Uploaded ${index + 1}`}
                  />
                </>
              )}
              <input
                type="file"
                id={`input-file${index}`}
                name={`input-file${index}`}
                accept="image/png, image/jpeg"
                onChange={(event) => handleFileChange(index, event)}
                hidden
              />
            </label>
          </div>
        </div>
      ))}
    </div>
  );
}
