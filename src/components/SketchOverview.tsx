import { useState, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Link } from "react-router-dom";
import { toast } from "sonner";

export default function SketchOverview() {
  const sketches = useQuery(api.sketches.list) || [];
  const teamMembers = useQuery(api.teamMembers.list) || [];
  const [editMode, setEditMode] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [newSketchTitle, setNewSketchTitle] = useState("");
  const [newSketchDuration, setNewSketchDuration] = useState("");
  const [showNewSketchForm, setShowNewSketchForm] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");
  const [showNewMemberForm, setShowNewMemberForm] = useState(false);

  const createSketch = useMutation(api.sketches.create);
  const reorderSketches = useMutation(api.sketches.reorder);
  const createTeamMember = useMutation(api.teamMembers.create);
  const updateTeamMember = useMutation(api.teamMembers.update);
  const removeTeamMember = useMutation(api.teamMembers.remove);

  const handleCreateSketch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSketchTitle.trim()) return;

    try {
      await createSketch({
        title: newSketchTitle,
        duration: newSketchDuration || undefined,
      });
      setNewSketchTitle("");
      setNewSketchDuration("");
      setShowNewSketchForm(false);
      toast.success("Sketch created!");
    } catch (error) {
      toast.error("Failed to create sketch");
    }
  };

  const handleCreateTeamMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;

    try {
      await createTeamMember({ name: newMemberName });
      setNewMemberName("");
      setShowNewMemberForm(false);
      toast.success("Team member added!");
    } catch (error) {
      toast.error("Failed to add team member");
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const reorderedSketches = [...sketches];
    const [draggedSketch] = reorderedSketches.splice(draggedIndex, 1);
    reorderedSketches.splice(dropIndex, 0, draggedSketch);

    try {
      await reorderSketches({
        sketchIds: reorderedSketches.map(s => s._id),
      });
      toast.success("Sketches reordered!");
    } catch (error) {
      toast.error("Failed to reorder sketches");
    }

    setDraggedIndex(null);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Sketch Organizer</h1>
        <button
          onClick={() => setEditMode(!editMode)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {editMode ? "Done Editing" : "Edit Mode"}
        </button>
      </div>

      {/* Team Members Section */}
      <div className="mb-8 bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Team Members</h2>
          {editMode && (
            <button
              onClick={() => setShowNewMemberForm(true)}
              className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
            >
              Add Member
            </button>
          )}
        </div>

        {showNewMemberForm && (
          <form onSubmit={handleCreateTeamMember} className="mb-4 flex gap-2">
            <input
              type="text"
              value={newMemberName}
              onChange={(e) => setNewMemberName(e.target.value)}
              placeholder="Member name"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setShowNewMemberForm(false)}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
          </form>
        )}

        <div className="flex flex-wrap gap-2">
          {teamMembers.map((member) => (
            <TeamMemberChip
              key={member._id}
              member={member}
              editMode={editMode}
              onUpdate={updateTeamMember}
              onRemove={removeTeamMember}
            />
          ))}
        </div>
      </div>

      {/* Sketches Section */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Sketches</h2>
          <button
            onClick={() => setShowNewSketchForm(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Add Sketch
          </button>
        </div>

        {showNewSketchForm && (
          <div className="mb-6 bg-white rounded-lg shadow-sm p-6">
            <form onSubmit={handleCreateSketch} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sketch Title
                </label>
                <input
                  type="text"
                  value={newSketchTitle}
                  onChange={(e) => setNewSketchTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration (optional)
                </label>
                <input
                  type="text"
                  value={newSketchDuration}
                  onChange={(e) => setNewSketchDuration(e.target.value)}
                  placeholder="e.g., 5 minutes"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Create Sketch
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewSketchForm(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sketches.map((sketch, index) => (
          <div
            key={sketch._id}
            draggable={editMode}
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, index)}
            className={`bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow ${
              editMode ? "cursor-move" : ""
            }`}
          >
            <Link to={`/sketch/${sketch._id}`} className="block p-6">
              {sketch.imageUrl && (
                <img
                  src={sketch.imageUrl}
                  alt={sketch.title}
                  className="w-full h-32 object-cover rounded-lg mb-4"
                />
              )}
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {sketch.title}
              </h3>
              {sketch.duration && (
                <p className="text-sm text-gray-600">Duration: {sketch.duration}</p>
              )}
              {editMode && (
                <div className="mt-2 text-xs text-gray-500">
                  ⋮⋮ Drag to reorder
                </div>
              )}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

function TeamMemberChip({
  member,
  editMode,
  onUpdate,
  onRemove,
}: {
  member: any;
  editMode: boolean;
  onUpdate: any;
  onRemove: any;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(member.name);

  const handleSave = async () => {
    if (name.trim() && name !== member.name) {
      await onUpdate({ id: member._id, name: name.trim() });
      toast.success("Member updated!");
    }
    setIsEditing(false);
  };

  const handleRemove = async () => {
    if (confirm(`Remove ${member.name} from the team?`)) {
      await onRemove({ id: member._id });
      toast.success("Member removed!");
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1 bg-blue-100 px-3 py-1 rounded-full">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={handleSave}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") {
              setName(member.name);
              setIsEditing(false);
            }
          }}
          className="bg-transparent border-none outline-none text-sm w-20"
          autoFocus
        />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 bg-blue-100 px-3 py-1 rounded-full">
      <span className="text-sm text-blue-800">{member.name}</span>
      {editMode && (
        <>
          <button
            onClick={() => setIsEditing(true)}
            className="text-blue-600 hover:text-blue-800 text-xs ml-1"
          >
            ✏️
          </button>
          <button
            onClick={handleRemove}
            className="text-red-600 hover:text-red-800 text-xs"
          >
            ✕
          </button>
        </>
      )}
    </div>
  );
}
