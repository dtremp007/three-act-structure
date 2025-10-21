import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import type { Id } from "../../convex/_generated/dataModel";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { NativeSelect } from "./ui/native-select";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
  FieldSet,
  FieldSeparator,
} from "./ui/field";
import { MediaUploader } from "./MediaUploader";

export default function PropDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const propId = id as Id<"props">;

  const prop = useQuery(api.props.get, { id: propId });
  const teamMembers = useQuery(api.teamMembers.list) || [];
  const mediaFiles = useQuery(api.props.listMedia, { propId }) || [];

  const [isEditingName, setIsEditingName] = useState(false);
  const [name, setName] = useState("");

  const updateProp = useMutation(api.props.update);
  const removeProp = useMutation(api.props.remove);
  const generateMediaUploadUrl = useMutation(api.props.generateUploadUrl);
  const addMedia = useMutation(api.props.addMedia);
  const removeMedia = useMutation(api.props.removeMedia);

  if (!prop) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-8"></div>
        </div>
      </div>
    );
  }

  const handleUpdateName = async () => {
    if (name.trim() && name !== prop.name) {
      await updateProp({ id: propId, name: name.trim() });
      toast.success("Name updated!");
    }
    setIsEditingName(false);
  };

  const handleUpdateStatus = async (
    newStatus: "idea" | "planned" | "ready"
  ) => {
    await updateProp({ id: propId, status: newStatus });
    toast.success("Status updated!");
  };

  const handleUpdateResponsible = async (personId: string) => {
    const responsiblePersonId =
      personId === "" ? undefined : (personId as Id<"teamMembers">);
    await updateProp({ id: propId, responsiblePersonId });
    toast.success("Responsible person updated!");
  };

  const handleUpdateNotes = async (newNotes: string) => {
    if (newNotes !== (prop.notes || "")) {
      await updateProp({ id: propId, notes: newNotes || undefined });
      toast.success("Notes updated!");
    }
  };

  const handleDeleteProp = async () => {
    if (
      confirm(
        "Are you sure you want to delete this prop? This will remove it from all sketches and delete all associated media."
      )
    ) {
      try {
        await removeProp({ id: propId });
        toast.success("Prop deleted!");
        void navigate("/props");
      } catch (error) {
        toast.error("Failed to delete prop");
        console.error(error);
      }
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
        propId,
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

  const getStatusVariant = (
    status: "idea" | "planned" | "ready"
  ): "default" | "secondary" | "outline" => {
    switch (status) {
      case "idea":
        return "outline";
      case "planned":
        return "secondary";
      case "ready":
        return "default";
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <div className="flex gap-4 mb-4">
          <Button variant="link" asChild>
            <Link to="/props">← Back to Props</Link>
          </Button>
          <Button variant="destructive" onClick={() => void handleDeleteProp()}>
            Delete Prop
          </Button>
        </div>

        <div className="flex items-center gap-4 mb-4">
          {isEditingName ? (
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => void handleUpdateName()}
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleUpdateName();
                if (e.key === "Escape") {
                  setName(prop.name);
                  setIsEditingName(false);
                }
              }}
              className="text-3xl font-bold"
              autoFocus
            />
          ) : (
            <h1
              onClick={() => {
                setName(prop.name);
                setIsEditingName(true);
              }}
              className="text-3xl font-bold text-gray-900 cursor-pointer hover:text-blue-600"
            >
              {prop.name}
            </h1>
          )}
          <Badge variant={getStatusVariant(prop.status)}>
            {prop.status.charAt(0).toUpperCase() + prop.status.slice(1)}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Prop Details */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Prop Details</CardTitle>
            </CardHeader>
            <CardContent>
              <FieldSet>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="prop-status">Status</FieldLabel>
                    <NativeSelect
                      id="prop-status"
                      value={prop.status}
                      onChange={(e) =>
                        void handleUpdateStatus(
                          e.target.value as "idea" | "planned" | "ready"
                        )
                      }
                    >
                      <option value="idea">Idea</option>
                      <option value="planned">Planned</option>
                      <option value="ready">Ready</option>
                    </NativeSelect>
                    <FieldDescription>
                      Track the current state of this prop
                    </FieldDescription>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="prop-responsible">
                      Responsible Person
                    </FieldLabel>
                    <NativeSelect
                      id="prop-responsible"
                      value={prop.responsiblePersonId || ""}
                      onChange={(e) =>
                        void handleUpdateResponsible(e.target.value)
                      }
                    >
                      <option value="">Not assigned</option>
                      {teamMembers.map((member) => (
                        <option key={member._id} value={member._id}>
                          {member.name}
                        </option>
                      ))}
                    </NativeSelect>
                    <FieldDescription>
                      Assign a team member to handle this prop
                    </FieldDescription>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="prop-notes">Notes</FieldLabel>
                    <Textarea
                      id="prop-notes"
                      defaultValue={prop.notes || ""}
                      onBlur={(e) => void handleUpdateNotes(e.target.value)}
                      placeholder="Add notes..."
                      className="min-h-32"
                    />
                    <FieldDescription>
                      Add any additional details or instructions
                    </FieldDescription>
                  </Field>
                </FieldGroup>
              </FieldSet>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Media & Usage */}
        <div className="space-y-8">
          {/* Media Files */}
          <Card>
            <CardHeader>
              <CardTitle>Media Files</CardTitle>
            </CardHeader>
            <CardContent>
              <MediaUploader
                key={initialFiles.length}
                initialFiles={initialFiles}
                onUpload={handleMediaUpload}
                onRemove={handleMediaRemove}
                onClearAll={handleMediaClearAll}
                maxFiles={10}
              />
            </CardContent>
          </Card>

          {/* Sketches Using This Prop */}
          <Card>
            <CardHeader>
              <CardTitle>Used in Sketches</CardTitle>
            </CardHeader>
            <CardContent>
              <FieldSet>
                <FieldDescription>
                  {prop.sketches.length === 0
                    ? "Not used in any sketches yet"
                    : `This prop is used in ${prop.sketches.length} ${prop.sketches.length === 1 ? "sketch" : "sketches"}`}
                </FieldDescription>
                {prop.sketches.length > 0 && (
                  <>
                    <FieldSeparator />
                    <FieldGroup>
                      <div className="space-y-2">
                        {prop.sketches.map((sketch) => (
                          <Link
                            key={sketch._id}
                            to={`/sketch/${sketch._id}`}
                            className="block p-3 border border-border rounded-lg hover:border-ring hover:bg-accent transition-colors"
                          >
                            <p className="font-medium">{sketch.title}</p>
                          </Link>
                        ))}
                      </div>
                    </FieldGroup>
                  </>
                )}
              </FieldSet>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
