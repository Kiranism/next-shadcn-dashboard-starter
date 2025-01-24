'use client';
import React, { useState } from 'react';

import { Camera, CircleX } from 'lucide-react';

interface IFileImages {
  fileImages: (images: any) => void;
}

export default function FileUploadFive(props: IFileImages) {
  const [fileInputs, setFileInputs] = useState(new Array(1).fill(null));

  const handleFileChange = (
    index: number,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { files } = event.target; // Destructure files from the event target
    if (files && files.length > 0) {
      const updatedFiles = [...fileInputs];
      updatedFiles[index] = files[0]; // Assign the selected file to the corresponding index
      setFileInputs(updatedFiles); // Update the state with the new file array
      props.fileImages(updatedFiles);
    } else {
      console.warn('No file selected');
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
                  <CircleX color="red" className="h-5 w-5" />
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
                    src={URL.createObjectURL(file)}
                    alt=""
                    className="h-auto w-full rounded-md"
                  />
                </>
              )}
              <input
                type="file"
                id={`input-file${index}`}
                name={`input-file${index}`}
                accept="image/png, image/gif, image/jpeg"
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
