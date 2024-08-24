'use client';
import { CalendarDateRangePicker } from '@/components/date-range-picker';
import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';

import {
  FileUploader,
  FileUploaderContent,
  FileUploaderItem,
  FileInput
} from '@/components/file-upload';

import { ReloadIcon, SlashIcon, UploadIcon } from '@radix-ui/react-icons';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb';
import { UserClient } from '@/components/tables/user-tables/client';
import { useState } from 'react';
import { Paperclip } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useLocalStorage } from 'usehooks-ts';

const FileSvgDraw = () => {
  return (
    <>
      <svg
        className="mb-3 h-8 w-8 text-gray-500 dark:text-gray-400"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 20 16"
      >
        <path
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
        />
      </svg>
      <p className="mb-1 text-sm text-gray-500 dark:text-gray-400">
        <span className="font-semibold">Click to upload</span>
        &nbsp; or drag and drop
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        PNG & JPG images are acceptable
      </p>
    </>
  );
};

export const StudentsTransfer = () => {
  const [files, setFiles] = useState<File[] | null>(null);
  const [isUploading, setUploadingState] = useState<boolean>(false);
  const [localstorageTranslatedFiles, setValue] = useLocalStorage(
    'translatedFiles',
    [] as any,
    { initializeWithValue: false }
  );
  const uploadedFiles: any[] = [];

  const { toast } = useToast();
  const dropZoneConfig = {
    maxFiles: 5,
    maxSize: 1024 * 1024 * 4,
    multiple: true
  };

  const translateDocuments = async () => {
    setUploadingState(true);

    files?.forEach((file) => {
      const formData = new FormData();

      formData.append('prompt_type', '1');
      formData.append('files', file);

      fetch('https://api.hobs.ai/student/submit-documents', {
        method: 'POST',
        body: formData
      })
        .then((response) => {
          return response.json();
        })
        .then((response) => {
          toast({
            title: 'Translation Succeed !',
            description: `File ${file.name} Translated`
          });

          files.splice(files.indexOf(file), 1);

          if (files.length < 1) {
            setUploadingState(false);
            setFiles(null);
            toast({
              color: 'green',
              title: 'All files are translated !',
              description: 'You can find your files in table below'
            });

            const filename = Object.keys(response['file_URLS']).at(0) as string;
            const url = response['file_URLS'][filename];
            const file = { filename, url };

            setValue([...localstorageTranslatedFiles, file]);
          }
        })
        .catch((error) => {
          toast({
            variant: 'destructive',
            title: 'Not translated !',
            description: 'File is not translated, try again'
          });
          setUploadingState(false);
          console.log(error);
        });
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">
          Translate Documents
        </h2>
        <div className="hidden items-center space-x-2 md:flex">
          <CalendarDateRangePicker />
        </div>
      </div>
      <small>
        You Can translate your documents using our Amazing AI tools, trained and
        developed for special needs.
      </small>

      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator>
            <SlashIcon />
          </BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard/students">Students</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator>
            <SlashIcon />
          </BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbPage>Translate</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center justify-end space-y-2">
        <Button
          onClick={() => translateDocuments()}
          variant={'default'}
          disabled={isUploading || !files}
        >
          {!isUploading ? (
            <>
              <UploadIcon className="pd-2 h-4 w-4"></UploadIcon> Translate
              Selected files{' '}
            </>
          ) : (
            ''
          )}
          {isUploading ? (
            <>
              <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />{' '}
              <span>Uploading, Please wait ..</span>
            </>
          ) : (
            ''
          )}
        </Button>
      </div>
      <div className="file-upload-box">
        <FileUploader
          value={files}
          onValueChange={setFiles}
          dropzoneOptions={dropZoneConfig}
          className="relative rounded-lg bg-background p-2"
        >
          <FileInput
            style={{ border: 'dashed 1px black', borderRadius: 6 }}
            className="margin-10 outline-dashed outline-1 outline-white"
          >
            <div className="flex w-full flex-col items-center justify-center pb-4 pt-3 ">
              <FileSvgDraw />
            </div>
          </FileInput>
          <FileUploaderContent style={{ transform: '1s' }}>
            {files &&
              files.length > 0 &&
              files.map((file, i) => (
                <FileUploaderItem key={i} index={i}>
                  <Paperclip className="h-4 w-4 stroke-current" />
                  <span>{file.name}</span>
                </FileUploaderItem>
              ))}
          </FileUploaderContent>
        </FileUploader>
      </div>
      <UserClient data={localstorageTranslatedFiles}></UserClient>
    </div>
  );
};
