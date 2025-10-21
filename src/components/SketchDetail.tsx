import { useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { CharacterListBuilder } from "./CharacterListBuilder";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { PropsSelector } from "./PropsSelector";
import { MediaUploader } from "./MediaUploader";

export default function SketchDetail() {
  const { id } = useParams<{ id: string }>();
  const sketchId = id as any;

  const sketch = useQuery(api.sketches.get, { id: sketchId });
  const latestScript = useQuery(api.scripts.getLatest, { sketchId });
  const scriptVersions = useQuery(api.scripts.getVersions, { sketchId }) || [];
  const mediaFiles = useQuery(api.sketches.listMedia, { sketchId }) || [];

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDuration, setIsEditingDuration] = useState(false);
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState(0);
  const [showScriptVersions, setShowScriptVersions] = useState(false);
  const [isUploadingScript, setIsUploadingScript] = useState(false);

  const scriptFileInputRef = useRef<HTMLInputElement>(null);

  const updateSketch = useMutation(api.sketches.update);
  const createScript = useMutation(api.scripts.create);
  const generateScriptUploadUrl = useMutation(api.scripts.generateUploadUrl);
  const generateMediaUploadUrl = useMutation(api.sketches.generateUploadUrl);
  const addMedia = useMutation(api.sketches.addMedia);
  const removeMedia = useMutation(api.sketches.removeMedia);

  if (!sketch) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-8"></div>
        </div>
      </div>
    );
  }

  const handleScriptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast.error("Please upload a PDF file");
      return;
    }

    setIsUploadingScript(true);

    try {
      const uploadUrl = await generateScriptUploadUrl();
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!result.ok) throw new Error("Upload failed");

      const { storageId } = await result.json();
      await createScript({
        sketchId,
        fileId: storageId,
        fileName: file.name,
      });
      toast.success("Script uploaded!");

      // Reset file input
      if (scriptFileInputRef.current) {
        scriptFileInputRef.current.value = "";
      }
    } catch {
      toast.error("Failed to upload script");
    } finally {
      setIsUploadingScript(false);
    }
  };

  const handleUpdateTitle = async () => {
    if (title.trim() && title !== sketch.title) {
      await updateSketch({ id: sketchId, title: title.trim() });
      toast.success("Title updated!");
    }
    setIsEditingTitle(false);
  };

  const handleUpdateDuration = async () => {
    if (duration !== (sketch.duration || "")) {
      await updateSketch({ id: sketchId, duration: duration || undefined });
      toast.success("Duration updated!");
    }
    setIsEditingDuration(false);
  };

  const handleUpdateDescription = async (newDescription: string) => {
    if (newDescription !== (sketch.description || "")) {
      await updateSketch({
        id: sketchId,
        description: newDescription || undefined,
      });
      toast.success("Description updated!");
    }
  };

  const handleMediaUpload = async (files: File[]) => {
    for (const file of files) {
      const uploadUrl = await generateMediaUploadUrl();
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!result.ok) throw new Error("Upload failed");

      const { storageId } = await result.json();
      await addMedia({
        sketchId,
        fileId: storageId,
        fileName: file.name,
        fileType: file.type,
      });
    }
  };

  const handleMediaRemove = async (fileId: string) => {
    await removeMedia({ id: fileId as any });
  };

  const handleMediaClearAll = async () => {
    for (const media of mediaFiles) {
      await removeMedia({ id: media._id as any });
    }
  };

  // Convert media files to the format expected by MediaUploader
  const initialFiles = mediaFiles.map((media) => ({
    name: media.fileName,
    size: 0,
    type: media.fileType,
    url: media.fileUrl || "",
    id: media._id,
  }));

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <Button variant="link" asChild>
          <Link to="/">← Back to Overview</Link>
        </Button>

        <div className="flex items-center gap-4 mb-2">
          {isEditingTitle ? (
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => void handleUpdateTitle()}
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleUpdateTitle();
                if (e.key === "Escape") {
                  setTitle(sketch.title);
                  setIsEditingTitle(false);
                }
              }}
              className="text-3xl font-bold text-gray-900 bg-transparent border-b-2 border-border outline-none"
              autoFocus
            />
          ) : (
            <h1
              onClick={() => {
                setTitle(sketch.title);
                setIsEditingTitle(true);
              }}
              className="text-3xl font-bold text-gray-900 cursor-pointer hover:text-blue-600"
            >
              {sketch.title}
            </h1>
          )}
        </div>

        {isEditingDuration ? (
          <input
            type="number"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            onBlur={() => void handleUpdateDuration()}
            onKeyDown={(e) => {
              if (e.key === "Enter") void handleUpdateDuration();
              if (e.key === "Escape") {
                setDuration(sketch.duration || 0);
                setIsEditingDuration(false);
              }
            }}
            placeholder="Duration (in minutes)"
            className="text-gray-600 bg-transparent border-b border-gray-300 outline-none"
            autoFocus
          />
        ) : (
          <p
            onClick={() => {
              setDuration(sketch.duration || 0);
              setIsEditingDuration(true);
            }}
            className="text-gray-600 cursor-pointer hover:text-blue-600"
          >
            {sketch.duration
              ? `Duration: ${sketch.duration} minutes`
              : "Click to add duration"}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column */}
        <div className="space-y-8">
          {/* Media Files */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Media Files
            </h2>
            <MediaUploader
              key={initialFiles.length}
              initialFiles={initialFiles}
              onUpload={handleMediaUpload}
              onRemove={handleMediaRemove}
              onClearAll={handleMediaClearAll}
              maxFiles={10}
            />
          </div>

          {/* Description */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Notes & Description
            </h2>
            <Textarea
              defaultValue={sketch.description || ""}
              onBlur={(e) => void handleUpdateDescription(e.target.value)}
              placeholder="Add notes or description..."
              className="min-h-32"
            />
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          {/* Script */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Script (PDF)
              </h2>
              {scriptVersions.length > 0 && (
                <button
                  onClick={() => setShowScriptVersions(!showScriptVersions)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {showScriptVersions ? "Hide" : "Show"} Versions (
                  {scriptVersions.length})
                </button>
              )}
            </div>

            {showScriptVersions && (
              <div className="mb-4 max-h-32 overflow-y-auto border border-gray-200 rounded-lg">
                {scriptVersions.map((script) => (
                  <div
                    key={script._id}
                    className="p-2 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="flex justify-between items-center text-sm">
                      <div>
                        <span className="font-medium">
                          Version {script.version}
                        </span>
                        <span className="text-gray-500 ml-2">
                          ({script.fileName})
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">
                          {new Date(script.createdAt).toLocaleDateString()}
                        </span>
                        {script.fileUrl && (
                          <Button variant="link" asChild>
                            <a
                              href={script.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              View
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {latestScript && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <div className="text-sm text-gray-600">
                    Current Version: {latestScript.version}
                  </div>
                  {latestScript.fileUrl && (
                    <Button variant="outline" asChild>
                      <a
                        href={latestScript.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View PDF
                      </a>
                    </Button>
                  )}
                </div>
                <div className="text-sm text-gray-700">
                  📄 {latestScript.fileName}
                </div>
              </div>
            )}

            <div>
              <input
                ref={scriptFileInputRef}
                type="file"
                accept="application/pdf"
                onChange={(e) => void handleScriptUpload(e)}
                className="hidden"
              />
              <button
                onClick={() => void scriptFileInputRef.current?.click()}
                disabled={isUploadingScript}
                className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploadingScript
                  ? "Uploading..."
                  : latestScript
                    ? "Upload New Script Version (PDF)"
                    : "Upload Script (PDF)"}
              </button>
              <p className="text-xs text-gray-500 mt-1">
                Only PDF files are supported
              </p>
            </div>
          </div>

          {/* Props */}
          <PropsSelector />

          {/* Characters */}
          <CharacterListBuilder />
        </div>
      </div>
    </div>
  );
}
