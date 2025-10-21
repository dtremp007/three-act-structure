import { useState } from "react";
import { toast } from "sonner";
import {
  ImageIcon,
  VideoIcon,
  XIcon,
  UploadIcon,
  Trash2Icon,
  AlertCircleIcon,
} from "lucide-react";
import { useFileUpload, formatBytes, type FileMetadata } from "@/hooks/use-file-upload";
import { Button } from "@/components/ui/button";

type MediaUploaderProps = {
  initialFiles: FileMetadata[];
  onUpload: (files: File[]) => Promise<void>;
  onRemove: (fileId: string) => Promise<void>;
  onClearAll: () => Promise<void>;
  maxFiles?: number;
  maxSizeMB?: number;
};

export function MediaUploader({
  initialFiles,
  onUpload,
  onRemove,
  onClearAll,
  maxFiles = 10,
  maxSizeMB = 50,
}: MediaUploaderProps) {
  const maxSize = maxSizeMB * 1024 * 1024;

  const [isUploading, setIsUploading] = useState(false);

  const [
    { files, isDragging, errors },
    {
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      openFileDialog,
      removeFile,
      clearFiles,
      getInputProps,
    },
  ] = useFileUpload({
    multiple: true,
    maxFiles,
    maxSize,
    accept: "image/*,video/*",
    initialFiles,
    onFilesAdded: (addedFiles) => {
      // Upload new files
      void (async () => {
        setIsUploading(true);
        try {
          const actualFiles = addedFiles
            .map(fw => fw.file)
            .filter((f): f is File => f instanceof File);

          await onUpload(actualFiles);

          toast.success(
            `${actualFiles.length} file${actualFiles.length > 1 ? "s" : ""} uploaded!`
          );
        } catch (error) {
          toast.error("Failed to upload files");
          console.error(error);
        } finally {
          setIsUploading(false);
        }
      })();
    },
  });

  const handleRemoveFile = async (fileId: string) => {
    if (confirm("Are you sure you want to delete this media file?")) {
      try {
        await onRemove(fileId);
        removeFile(fileId);
        toast.success("Media file deleted!");
      } catch (error) {
        toast.error("Failed to delete file");
        console.error(error);
      }
    }
  };

  const handleClearAll = async () => {
    if (
      confirm(
        "Are you sure you want to remove all media files? This cannot be undone."
      )
    ) {
      try {
        await onClearAll();
        clearFiles();
        toast.success("All media files removed!");
      } catch (error) {
        toast.error("Failed to remove all files");
        console.error(error);
      }
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Drop area */}
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        data-dragging={isDragging || undefined}
        data-files={files.length > 0 || undefined}
        data-uploading={isUploading || undefined}
        className="relative flex min-h-52 flex-col items-center overflow-hidden rounded-xl border border-dashed border-input p-4 transition-colors not-data-files:justify-center has-[input:focus]:border-ring has-[input:focus]:ring-[3px] has-[input:focus]:ring-ring/50 data-[dragging=true]:bg-accent/50 data-[uploading=true]:opacity-60"
      >
        <input
          {...getInputProps()}
          className="sr-only"
          aria-label="Upload media files"
          disabled={isUploading}
        />
        {files.length > 0 ? (
          <div className="flex w-full flex-col gap-3">
            <div className="flex items-center justify-end gap-2">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openFileDialog}
                  disabled={isUploading || files.length >= maxFiles}
                >
                  <UploadIcon
                    className="-ms-0.5 size-3.5 opacity-60"
                    aria-hidden="true"
                  />
                  Add files
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void handleClearAll()}
                  disabled={isUploading}
                >
                  <Trash2Icon
                    className="-ms-0.5 size-3.5 opacity-60"
                    aria-hidden="true"
                  />
                  Remove all
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {files.map((file) => {
                const fileType = file.file instanceof File ? file.file.type : file.file.type;
                const isImage = fileType.startsWith("image/");
                const isVideo = fileType.startsWith("video/");
                const fileUrl = file.file instanceof File
                  ? URL.createObjectURL(file.file)
                  : (file.file.url || "");

                return (
                  <div
                    key={file.id}
                    className="relative flex flex-col rounded-md border bg-background"
                  >
                    {isImage ? (
                      <a
                        href={fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="block aspect-square overflow-hidden rounded-t-[inherit]"
                      >
                        <img
                          src={fileUrl}
                          alt={file.file.name}
                          className="size-full object-cover"
                        />
                      </a>
                    ) : isVideo ? (
                      <a
                        href={fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex aspect-square items-center justify-center overflow-hidden rounded-t-[inherit] bg-accent"
                        onClick={(e) => {
                          e.preventDefault();
                          window.open(fileUrl, '_blank');
                        }}
                      >
                        <VideoIcon className="size-8 opacity-60" />
                      </a>
                    ) : (
                      <div className="flex aspect-square items-center justify-center overflow-hidden rounded-t-[inherit] bg-accent">
                        <ImageIcon className="size-5 opacity-60" />
                      </div>
                    )}
                    <Button
                      onClick={() => void handleRemoveFile(file.id)}
                      size="icon"
                      className="absolute -top-2 -right-2 size-6 rounded-full border-2 border-background shadow-none focus-visible:border-background"
                      aria-label="Remove file"
                      disabled={isUploading}
                    >
                      <XIcon className="size-3.5" />
                    </Button>
                    <div className="flex min-w-0 flex-col gap-0.5 border-t p-3">
                      <p className="truncate text-[13px] font-medium">
                        {file.file.name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {file.file instanceof File
                          ? formatBytes(file.file.size)
                          : isImage
                            ? "Image"
                            : "Video"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center px-4 py-3 text-center">
            <div
              className="mb-2 flex size-11 shrink-0 items-center justify-center rounded-full border bg-background"
              aria-hidden="true"
            >
              <ImageIcon className="size-4 opacity-60" />
            </div>
            <p className="mb-1.5 text-sm font-medium">
              Drop your media files here
            </p>
            <p className="text-xs text-muted-foreground">
              Max {maxFiles} files ∙ Up to {maxSizeMB}MB ∙ Images & Videos
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={openFileDialog}
              disabled={isUploading}
            >
              <UploadIcon className="-ms-1 opacity-60" aria-hidden="true" />
              {isUploading ? "Uploading..." : "Select files"}
            </Button>
          </div>
        )}
      </div>

      {errors.length > 0 && (
        <div
          className="flex items-center gap-1 text-xs text-destructive"
          role="alert"
        >
          <AlertCircleIcon className="size-3 shrink-0" />
          <span>{errors[0]}</span>
        </div>
      )}
    </div>
  );
}
