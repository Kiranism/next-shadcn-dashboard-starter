'use client';
import React from 'react';
import { Camera, CircleX } from 'lucide-react';

interface IFileImages {
  fileImages: (images: any) => void;
  defaultImage: string | null;
}

export default function FileUpload(props: IFileImages) {
  const [fileInputs, setFileInputs] = React.useState<string | null>(null);

  React.useEffect(() => {
    setFileInputs(props.defaultImage);
  }, [props.defaultImage]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      // Null check for files
      const newFile = files[0];
      setFileInputs(URL.createObjectURL(newFile));
      props.fileImages(newFile);
    }
  };

  const removeFile = () => {
    setFileInputs('');
    props.fileImages('');
  };

  return (
    <div className="-mx-2 mt-5 flex flex-wrap">
      <div className="mb-4 w-full px-2 md:w-1/2 lg:w-1/4">
        <div className="bg-gray-100rounded-md relative rounded-md border border-input p-4 text-center text-gray-500 shadow dark:bg-black">
          {fileInputs && (
            <div className="absolute right-2 top-2">
              <span onClick={() => removeFile()} className="cursor-pointer">
                <CircleX size={20} color="red" />
              </span>
            </div>
          )}
          <label htmlFor={`input-file`} className="block cursor-pointer">
            {!fileInputs && (
              <>
                <span className="mb-2 flex items-center justify-center text-xl">
                  <Camera className="mr-2 h-6 w-6" />
                </span>
                <p className="text-sm">Click to add image</p>
              </>
            )}
            {fileInputs && (
              <>
                <img
                  src={fileInputs}
                  width={0}
                  height={0}
                  sizes="100vw"
                  style={{ width: '100%', height: 'auto' }}
                  className="h-auto w-full rounded-md"
                  alt={`Uploaded`}
                />
              </>
            )}
            <input
              type="file"
              id={`input-file`}
              name={`input-file`}
              accept="image/png, image/jpeg"
              onChange={(event) => handleFileChange(event)}
              hidden
            />
          </label>
        </div>
      </div>
    </div>
  );
}
