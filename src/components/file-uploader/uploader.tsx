"use client";

import {
  AlertCircleIcon,
  FileTextIcon,
  FileUpIcon,
  Loader2,
  XIcon,
} from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useFileUpload } from "@/hooks/use-file-upload";
import { formatBytes } from "@/lib/format-bytes";
import { orpcClient } from "@/lib/orpc-client";
import { Button } from "../ui/button";

interface ResumeUploaderProps {
  onUploadComplete: (key: string, file: File) => void;
  onRemove: (key: string) => void;
}

const inferResumeContentType = (file: File): string | null => {
  if (file.type) {
    return file.type;
  }

  const lowerFilename = file.name.toLowerCase();
  if (lowerFilename.endsWith(".pdf")) {
    return "application/pdf";
  }
  if (lowerFilename.endsWith(".docx")) {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }
  if (lowerFilename.endsWith(".txt")) {
    return "text/plain";
  }

  return null;
};

export function ResumeUploader({
  onUploadComplete,
  onRemove,
}: ResumeUploaderProps) {
  const [uploadState, setUploadState] = useState<{
    uploading: boolean;
    progress: number;
    key?: string;
    error?: string;
  }>({ uploading: false, progress: 0 });

  const maxSize = 5 * 1024 * 1024; // 5MB

  const uploadFile = useCallback(
    async (file: File) => {
      setUploadState({ uploading: true, progress: 0 });

      try {
        const contentType = inferResumeContentType(file);
        if (!contentType) {
          throw new Error("Unsupported resume format. Use PDF, DOCX, or TXT.");
        }

        const { url, key } = await orpcClient.media.getPresignedUrl({
          filename: file.name,
          contentType: contentType as
            | "application/pdf"
            | "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            | "text/plain",
          purpose: "resume",
        });

        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();

          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const progress = Math.round((event.loaded / event.total) * 100);
              setUploadState((prev) => ({ ...prev, progress, key }));
            }
          };

          xhr.onload = () => {
            if (xhr.status === 200 || xhr.status === 204) {
              setUploadState({ uploading: false, progress: 100, key });
              toast.success("File uploaded successfully");
              onUploadComplete(key, file);
              resolve();
            } else {
              reject(new Error("Upload failed"));
            }
          };

          xhr.onerror = () => reject(new Error("Upload failed"));

          xhr.open("PUT", url);
          xhr.setRequestHeader("Content-Type", contentType);
          xhr.send(file);
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Upload failed";
        setUploadState({ uploading: false, progress: 0, error: message });
        toast.error(message);
      }
    },
    [onUploadComplete],
  );

  const handleFilesAdded = useCallback(
    (addedFiles: { file: File | { name: string } }[]) => {
      const file = addedFiles[0]?.file;
      if (file instanceof File) {
        uploadFile(file);
      }
    },
    [uploadFile],
  );

  const [
    { files, isDragging, errors },
    {
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      openFileDialog,
      removeFile,
      getInputProps,
    },
  ] = useFileUpload({
    maxFiles: 1,
    maxSize,
    accept:
      ".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain",
    multiple: false,
    onFilesAdded: handleFilesAdded,
  });

  const handleRemove = async (fileId: string) => {
    if (uploadState.key) {
      try {
        await orpcClient.media.deleteFile({ key: uploadState.key });
        onRemove(uploadState.key);
        toast.success("File removed");
      } catch {
        toast.error("Failed to remove file");
      }
    }
    removeFile(fileId);
    setUploadState({ uploading: false, progress: 0 });
  };

  return (
    <div className="flex flex-col gap-2">
      {files.length === 0 ? (
        <>
          <button
            type="button"
            className="flex min-h-40 flex-col items-center justify-center rounded-xl border border-input border-dashed p-4 transition-colors hover:bg-accent/50 has-disabled:pointer-events-none has-[input:focus]:border-ring has-disabled:opacity-50 has-[input:focus]:ring-[3px] has-[input:focus]:ring-ring/50 data-[dragging=true]:bg-accent/50 cursor-pointer"
            data-dragging={isDragging || undefined}
            onClick={openFileDialog}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <input
              {...getInputProps()}
              aria-label="Upload resume"
              className="sr-only"
            />
            <div className="flex flex-col items-center justify-center text-center">
              <div
                aria-hidden="true"
                className="mb-2 flex size-11 shrink-0 items-center justify-center rounded-full border bg-background"
              >
                <FileUpIcon className="size-4 opacity-60" />
              </div>
              <p className="mb-1.5 font-medium text-sm">Upload your resume</p>
              <p className="mb-2 text-muted-foreground text-xs">
                Drag & drop or click to browse
              </p>
              <div className="flex flex-wrap justify-center gap-1 text-muted-foreground/70 text-xs">
                <span>PDF, DOCX, TXT</span>
                <span>∙</span>
                <span>Up to {formatBytes(maxSize)}</span>
              </div>
            </div>
          </button>

          {errors.length > 0 && (
            <div
              className="flex items-center gap-1 text-destructive text-xs"
              role="alert"
            >
              <AlertCircleIcon className="size-3 shrink-0" />
              <span>{errors[0]}</span>
            </div>
          )}
        </>
      ) : (
        <div className="space-y-2">
          {files.map((file) => (
            <div
              className="flex items-center justify-between gap-2 rounded-lg border bg-background p-3"
              key={file.id}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="flex aspect-square size-10 shrink-0 items-center justify-center rounded border bg-muted/50">
                  <FileTextIcon className="size-4 opacity-60" />
                </div>
                <div className="flex min-w-0 flex-col gap-0.5">
                  <p className="truncate font-medium text-[13px]">
                    {file.file instanceof File
                      ? file.file.name
                      : file.file.name}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {formatBytes(
                      file.file instanceof File
                        ? file.file.size
                        : file.file.size,
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {uploadState.uploading && (
                  <div className="flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin text-primary" />
                    <span className="text-xs text-muted-foreground">
                      {uploadState.progress}%
                    </span>
                  </div>
                )}

                {uploadState.error && (
                  <span className="text-xs text-destructive">Failed</span>
                )}

                <Button
                  aria-label="Remove file"
                  className="-me-1 size-8 text-muted-foreground/80 hover:bg-transparent hover:text-foreground"
                  onClick={() => handleRemove(file.id)}
                  size="icon"
                  variant="ghost"
                  disabled={uploadState.uploading}
                >
                  <XIcon aria-hidden="true" className="size-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
