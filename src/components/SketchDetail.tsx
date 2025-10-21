import { useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

export default function SketchDetail() {
  const { id } = useParams<{ id: string }>();
  const sketchId = id as any;

  const sketch = useQuery(api.sketches.get, { id: sketchId });
  const teamMembers = useQuery(api.teamMembers.list) || [];
  const latestScript = useQuery(api.scripts.getLatest, { sketchId });
  const scriptVersions = useQuery(api.scripts.getVersions, { sketchId }) || [];
  const characters = useQuery(api.characters.list, { sketchId }) || [];
  const props = useQuery(api.props.list, { sketchId }) || [];

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDuration, setIsEditingDuration] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState("");
  const [description, setDescription] = useState("");
  const [showScriptVersions, setShowScriptVersions] = useState(false);
  const [newCharacterName, setNewCharacterName] = useState("");
  const [newPropName, setNewPropName] = useState("");
  const [isUploadingScript, setIsUploadingScript] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const scriptFileInputRef = useRef<HTMLInputElement>(null);

  const updateSketch = useMutation(api.sketches.update);
  const generateUploadUrl = useMutation(api.sketches.generateUploadUrl);
  const createScript = useMutation(api.scripts.create);
  const generateScriptUploadUrl = useMutation(api.scripts.generateUploadUrl);
  const createCharacter = useMutation(api.characters.create);
  const updateCharacter = useMutation(api.characters.update);
  const removeCharacter = useMutation(api.characters.remove);
  const createProp = useMutation(api.props.create);
  const updateProp = useMutation(api.props.update);
  const removeProp = useMutation(api.props.remove);

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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const uploadUrl = await generateUploadUrl();
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!result.ok) throw new Error("Upload failed");

      const { storageId } = await result.json();
      await updateSketch({ id: sketchId, imageId: storageId });
      toast.success("Image uploaded!");
    } catch (error) {
      toast.error("Failed to upload image");
    }
  };

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
        fileName: file.name 
      });
      toast.success("Script uploaded!");
      
      // Reset file input
      if (scriptFileInputRef.current) {
        scriptFileInputRef.current.value = "";
      }
    } catch (error) {
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

  const handleUpdateDescription = async () => {
    if (description !== (sketch.description || "")) {
      await updateSketch({ id: sketchId, description: description || undefined });
      toast.success("Description updated!");
    }
    setIsEditingDescription(false);
  };

  const handleCreateCharacter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCharacterName.trim()) return;

    try {
      await createCharacter({ sketchId, name: newCharacterName });
      setNewCharacterName("");
      toast.success("Character added!");
    } catch (error) {
      toast.error("Failed to add character");
    }
  };

  const handleCreateProp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPropName.trim()) return;

    try {
      await createProp({ sketchId, name: newPropName });
      setNewPropName("");
      toast.success("Prop added!");
    } catch (error) {
      toast.error("Failed to add prop");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <Link
          to="/"
          className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
        >
          ← Back to Overview
        </Link>

        <div className="flex items-center gap-4 mb-2">
          {isEditingTitle ? (
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleUpdateTitle}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleUpdateTitle();
                if (e.key === "Escape") {
                  setTitle(sketch.title);
                  setIsEditingTitle(false);
                }
              }}
              className="text-3xl font-bold text-gray-900 bg-transparent border-b-2 border-blue-500 outline-none"
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
            type="text"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            onBlur={handleUpdateDuration}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleUpdateDuration();
              if (e.key === "Escape") {
                setDuration(sketch.duration || "");
                setIsEditingDuration(false);
              }
            }}
            placeholder="Duration (e.g., 5 minutes)"
            className="text-gray-600 bg-transparent border-b border-gray-300 outline-none"
            autoFocus
          />
        ) : (
          <p
            onClick={() => {
              setDuration(sketch.duration || "");
              setIsEditingDuration(true);
            }}
            className="text-gray-600 cursor-pointer hover:text-blue-600"
          >
            {sketch.duration ? `Duration: ${sketch.duration}` : "Click to add duration"}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column */}
        <div className="space-y-8">
          {/* Image */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Image</h2>
            {sketch.imageUrl ? (
              <div className="relative">
                <img
                  src={sketch.imageUrl}
                  alt={sketch.title}
                  className="w-full h-48 object-cover rounded-lg"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm hover:bg-opacity-70"
                >
                  Change
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-500 hover:border-blue-500 hover:text-blue-500 transition-colors"
              >
                Click to upload image
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>

          {/* Description */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Notes & Description</h2>
            {isEditingDescription ? (
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={handleUpdateDescription}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setDescription(sketch.description || "");
                    setIsEditingDescription(false);
                  }
                }}
                placeholder="Add notes or description..."
                className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            ) : (
              <div
                onClick={() => {
                  setDescription(sketch.description || "");
                  setIsEditingDescription(true);
                }}
                className="min-h-[8rem] p-3 border border-gray-200 rounded-lg cursor-pointer hover:border-blue-500 transition-colors"
              >
                {sketch.description ? (
                  <p className="text-gray-700 whitespace-pre-wrap">{sketch.description}</p>
                ) : (
                  <p className="text-gray-500">Click to add notes or description...</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          {/* Script */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Script (PDF)</h2>
              {scriptVersions.length > 0 && (
                <button
                  onClick={() => setShowScriptVersions(!showScriptVersions)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {showScriptVersions ? "Hide" : "Show"} Versions ({scriptVersions.length})
                </button>
              )}
            </div>

            {showScriptVersions && (
              <div className="mb-4 max-h-32 overflow-y-auto border border-gray-200 rounded-lg">
                {scriptVersions.map((script) => (
                  <div key={script._id} className="p-2 border-b border-gray-100 last:border-b-0">
                    <div className="flex justify-between items-center text-sm">
                      <div>
                        <span className="font-medium">Version {script.version}</span>
                        <span className="text-gray-500 ml-2">({script.fileName})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">
                          {new Date(script.createdAt).toLocaleDateString()}
                        </span>
                        {script.fileUrl && (
                          <a
                            href={script.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-xs"
                          >
                            View
                          </a>
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
                    <a
                      href={latestScript.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                    >
                      View PDF
                    </a>
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
                onChange={handleScriptUpload}
                className="hidden"
              />
              <button
                onClick={() => scriptFileInputRef.current?.click()}
                disabled={isUploadingScript}
                className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploadingScript ? (
                  "Uploading..."
                ) : latestScript ? (
                  "Upload New Script Version (PDF)"
                ) : (
                  "Upload Script (PDF)"
                )}
              </button>
              <p className="text-xs text-gray-500 mt-1">
                Only PDF files are supported
              </p>
            </div>
          </div>

          {/* Characters */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Characters</h2>
            
            <form onSubmit={handleCreateCharacter} className="mb-4 flex gap-2">
              <input
                type="text"
                value={newCharacterName}
                onChange={(e) => setNewCharacterName(e.target.value)}
                placeholder="Character name"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Add
              </button>
            </form>

            <div className="space-y-2">
              {characters.map((character) => (
                <CharacterItem
                  key={character._id}
                  character={character}
                  teamMembers={teamMembers}
                  onUpdate={updateCharacter}
                  onRemove={removeCharacter}
                />
              ))}
            </div>
          </div>

          {/* Props */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Props</h2>
            
            <form onSubmit={handleCreateProp} className="mb-4 flex gap-2">
              <input
                type="text"
                value={newPropName}
                onChange={(e) => setNewPropName(e.target.value)}
                placeholder="Prop name"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Add
              </button>
            </form>

            <div className="space-y-2">
              {props.map((prop) => (
                <PropItem
                  key={prop._id}
                  prop={prop}
                  onUpdate={updateProp}
                  onRemove={removeProp}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CharacterItem({
  character,
  teamMembers,
  onUpdate,
  onRemove,
}: {
  character: any;
  teamMembers: any[];
  onUpdate: any;
  onRemove: any;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(character.name);

  const handleSave = async () => {
    if (name.trim() && name !== character.name) {
      await onUpdate({ id: character._id, name: name.trim() });
      toast.success("Character updated!");
    }
    setIsEditing(false);
  };

  const handleAssignmentChange = async (teamMemberId: string | null) => {
    await onUpdate({ id: character._id, assignedTo: teamMemberId });
    toast.success("Assignment updated!");
  };

  const handleRemove = async () => {
    if (confirm(`Remove character "${character.name}"?`)) {
      await onRemove({ id: character._id });
      toast.success("Character removed!");
    }
  };

  const assignedMember = teamMembers.find(m => m._id === character.assignedTo);

  return (
    <div className="flex items-center gap-2 p-2 border border-gray-200 rounded-lg">
      {isEditing ? (
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={handleSave}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") {
              setName(character.name);
              setIsEditing(false);
            }
          }}
          className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
          autoFocus
        />
      ) : (
        <span
          onClick={() => setIsEditing(true)}
          className="flex-1 cursor-pointer hover:text-blue-600"
        >
          {character.name}
        </span>
      )}

      <select
        value={character.assignedTo || ""}
        onChange={(e) => handleAssignmentChange(e.target.value || null)}
        className="px-2 py-1 border border-gray-300 rounded text-sm"
      >
        <option value="">Unassigned</option>
        {teamMembers.map((member) => (
          <option key={member._id} value={member._id}>
            {member.name}
          </option>
        ))}
      </select>

      <button
        onClick={handleRemove}
        className="text-red-600 hover:text-red-800 text-sm px-1"
      >
        ✕
      </button>
    </div>
  );
}

function PropItem({
  prop,
  onUpdate,
  onRemove,
}: {
  prop: any;
  onUpdate: any;
  onRemove: any;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(prop.name);

  const handleSave = async () => {
    if (name.trim() && name !== prop.name) {
      await onUpdate({ id: prop._id, name: name.trim() });
      toast.success("Prop updated!");
    }
    setIsEditing(false);
  };

  const handleToggleAcquired = async () => {
    await onUpdate({ id: prop._id, acquired: !prop.acquired });
    toast.success(prop.acquired ? "Marked as needed" : "Marked as acquired");
  };

  const handleRemove = async () => {
    if (confirm(`Remove prop "${prop.name}"?`)) {
      await onRemove({ id: prop._id });
      toast.success("Prop removed!");
    }
  };

  return (
    <div className="flex items-center gap-2 p-2 border border-gray-200 rounded-lg">
      <input
        type="checkbox"
        checked={prop.acquired}
        onChange={handleToggleAcquired}
        className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
      />

      {isEditing ? (
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={handleSave}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") {
              setName(prop.name);
              setIsEditing(false);
            }
          }}
          className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
          autoFocus
        />
      ) : (
        <span
          onClick={() => setIsEditing(true)}
          className={`flex-1 cursor-pointer hover:text-blue-600 ${
            prop.acquired ? "line-through text-gray-500" : ""
          }`}
        >
          {prop.name}
        </span>
      )}

      <button
        onClick={handleRemove}
        className="text-red-600 hover:text-red-800 text-sm px-1"
      >
        ✕
      </button>
    </div>
  );
}
