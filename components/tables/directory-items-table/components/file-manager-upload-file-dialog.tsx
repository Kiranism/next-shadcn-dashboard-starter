import { useState, useEffect, useCallback } from "react";

import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import DialogTitle from "@mui/material/DialogTitle";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import Dialog, { DialogProps } from "@mui/material/Dialog";
import CloseIcon from "@mui/icons-material/Close";

import Iconify from "src/components/iconify";
import { Upload } from "src/components/upload";
import { enqueueSnackbar } from "notistack";
import { CreateDirItemRequest } from "src/api/directory/types/directory.types";
import axios, { endpoints } from "src/utils/axios";
import { AxiosResponse } from "axios";
import { set } from "lodash";
import { IconButton } from "@mui/material";

// ----------------------------------------------------------------------

interface Props extends DialogProps {
  title?: string;
  //
  onUpload?: () => void;
  onUpdate?: VoidFunction;
  //
  fileName?: string;
  folderId?: string;
  onChangeFolderName?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  //
  open: boolean;
  onClose: VoidFunction;
}

export default function FileManagerUploadFileDialog({
  title = "Upload Files",
  open,
  onClose,
  //
  folderId,
  onUpload,
  onUpdate,
  //
  fileName,
  onChangeFolderName,
  ...other
}: Props) {
  useEffect(() => {
    if (!open) {
      setFiles([]);
      setSuccessFileNames([]);
      setFailedFileNames([]);
    }
  }, [open]);

  const [sucessFileNames, setSuccessFileNames] = useState<string[]>([]);
  const [failedFileNames, setFailedFileNames] = useState<string[]>([]);

  const handleDrop = useCallback(
    (acceptedFiles: File[]) => {
      const newFiles = acceptedFiles.map((file) =>
        Object.assign(file, {
          preview: URL.createObjectURL(file),
        }),
      );

      setFiles([...files, ...newFiles]);
    },
    [files],
  );

  const [files, setFiles] = useState<File[]>([]);

  const createDirItem = (
    request: CreateDirItemRequest,
  ): Promise<AxiosResponse> => {
    const formData = new FormData();
    request.file && formData.append("file", request.file);
    request.name && formData.append("name", request.name);
    request.description && formData.append("description", request.description);
    request.parent_id && formData.append("parent_id", request.parent_id);
    request.tags && formData.append("tags", request.tags.toString());
    request.is_external_integration &&
      formData.append(
        "is_external_integration",
        request.is_external_integration.toString(),
      );
    const config = {
      headers: {
        "content-type": "multipart/form-data",
      },
    };
    const res = axios.post(endpoints.directory.item.root, formData, config);
    return res;
  };

  const uploadFileMultipart = useCallback(async (file: File) => {
    const request: CreateDirItemRequest = {
      name: file.name,
      file: file,
      description: "",
      parent_id: folderId,
      tags: ["test"],
      //is_external_integration: false
    };
    const response = await createDirItem(request);
  }, []);

  const getFileState = useCallback(
    (fileName: string) => {
      if (failedFileNames.includes(fileName)) {
        return "error";
      }
      if (sucessFileNames.includes(fileName)) {
        return "success";
      } else return undefined;
    },
    [sucessFileNames, failedFileNames],
  );

  const isFailedFile = (fileName: string) => {
    return failedFileNames.includes(fileName);
  };
  const handleUpload = async () => {
    await Promise.all(
      files.map(async (file) => {
        await uploadFileMultipart(file)
          .then(() => {
            setSuccessFileNames([...sucessFileNames, file.name]);
          })
          .catch((error) => {
            setFailedFileNames([...failedFileNames, file.name]);
            throw error;
          });
      }),
    )
      .then(() => {
        enqueueSnackbar(`Upload success`);
        onUpload ? onUpload() : {};
        onClose();
      })
      .catch((error) => {
        if (error.response.status == 415) {
          enqueueSnackbar("File type not supported", { variant: "error" });
        }
        if (error.response.status == 409) {
          enqueueSnackbar("File already exists", { variant: "error" });
        } else {
          enqueueSnackbar("Error uploading file", { variant: "error" });
        }
      });
  };

  const handleRemoveFile = (inputFile: File | string) => {
    const filtered = files.filter((file) => file !== inputFile);
    setFiles(filtered);
  };

  const handleRemoveAllFiles = () => {
    setFiles([]);
  };

  return (
    <Dialog fullWidth maxWidth="sm" open={open} onClose={onClose} {...other}>
      <DialogTitle sx={{ p: (theme) => theme.spacing(3, 3, 2, 3) }}>
        <Stack
          direction={"row"}
          alignContent="center"
          justifyContent={"space-between"}
        >
          {title}
          <IconButton size="small" color={"inherit"} onClick={() => onClose()}>
            <CloseIcon></CloseIcon>
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent dividers sx={{ pt: 1, pb: 0, border: "none" }}>
        <Upload
          multiple
          files={files.map((file) => {
            const state = getFileState(file.name);
            return { file: file, state: state };
          })}
          onDrop={handleDrop}
          onRemove={handleRemoveFile}
        />
      </DialogContent>

      <DialogActions>
        {!!files.length && (
          <Button
            variant="outlined"
            color="inherit"
            onClick={handleRemoveAllFiles}
          >
            Remove all
          </Button>
        )}

        {(onUpload || onUpdate) && (
          <Button
            variant="contained"
            startIcon={<Iconify icon="eva:cloud-upload-fill" />}
            onClick={handleUpload}
            disabled={!files.length}
          >
            Upload
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
