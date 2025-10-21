import { useState, KeyboardEvent } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
} from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Id } from "../../convex/_generated/dataModel";

export function CharacterListBuilder() {
  const { id } = useParams<{ id: string }>();
  const sketchId = id as any;

  // Fetch data
  const characters = useQuery(api.characters.list, { sketchId }) || [];
  const teamMembers = useQuery(api.teamMembers.list) || [];

  // Mutations
  const createCharacter = useMutation(api.characters.create);
  const updateCharacter = useMutation(api.characters.update);
  const removeCharacter = useMutation(api.characters.remove);

  // State
  const [newCharacterName, setNewCharacterName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    const trimmedName = newCharacterName.trim();

    if (!trimmedName) {
      setError("Character name cannot be empty");
      return;
    }

    if (characters.some((char) => char.name === trimmedName)) {
      setError("A character with this name already exists");
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      await createCharacter({ sketchId, name: trimmedName });
      setNewCharacterName("");
      toast.success("Character added!");
    } catch {
      setError("Failed to create character");
    } finally {
      setIsCreating(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      void handleCreate();
    }
  };

  const startEditing = (character: typeof characters[0]) => {
    setEditingId(character._id);
    setEditingName(character.name);
    setError(null);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingName("");
    setError(null);
  };

  const saveEditing = async (id: Id<"characters">) => {
    const trimmedName = editingName.trim();

    if (!trimmedName) {
      setError("Character name cannot be empty");
      return;
    }

    if (
      characters.some(
        (char) => char._id !== id && char.name === trimmedName
      )
    ) {
      setError("A character with this name already exists");
      return;
    }

    setError(null);

    try {
      await updateCharacter({ id, name: trimmedName });
      setEditingId(null);
      setEditingName("");
      toast.success("Character updated!");
    } catch {
      setError("Failed to update character");
    }
  };

  const handleDelete = async (id: Id<"characters">, name: string) => {
    if (confirm(`Remove character "${name}"?`)) {
      try {
        await removeCharacter({ id });
        toast.success("Character removed!");
      } catch {
        setError("Failed to delete character");
      }
    }
  };

  const handleEditKeyDown = (
    e: KeyboardEvent<HTMLInputElement>,
    id: Id<"characters">
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      void saveEditing(id);
    } else if (e.key === "Escape") {
      cancelEditing();
    }
  };

  const handleAssignmentChange = async (
    id: Id<"characters">,
    teamMemberId: string
  ) => {
    try {
      await updateCharacter({
        id,
        assignedTo: teamMemberId || undefined,
      });
      toast.success("Assignment updated!");
    } catch {
      toast.error("Failed to update assignment");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Characters</CardTitle>
        <CardDescription>Manage characters in this sketch</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Create Character Section */}
        <Field>
          <FieldLabel htmlFor="new-character-input">New Character</FieldLabel>
          <div className="flex gap-2">
            <input
              id="new-character-input"
              type="text"
              value={newCharacterName}
              onChange={(e) => {
                setNewCharacterName(e.target.value);
                setError(null);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Enter character name..."
              maxLength={100}
              disabled={isCreating}
              className={cn(
                "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors",
                "placeholder:text-muted-foreground",
                "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring",
                "disabled:cursor-not-allowed disabled:opacity-50",
                error &&
                  "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20"
              )}
            />
            <Button
              onClick={() => void handleCreate()}
              disabled={isCreating || !newCharacterName.trim()}
              size="sm"
            >
              <Plus className="size-4" />
            </Button>
          </div>
          {error && <FieldError>{error}</FieldError>}
        </Field>

        {/* Characters List */}
        <div className="space-y-2">
          <FieldDescription>
            {characters.length === 0 ? (
              "No characters yet. Add your first character."
            ) : (
              <>
                <span className="font-medium">{characters.length}</span>{" "}
                {characters.length === 1 ? "character" : "characters"}
              </>
            )}
          </FieldDescription>

          {characters.length > 0 && (
            <div className="space-y-2">
              {characters.map((character) => (
                <div
                  key={character._id}
                  className="flex items-center gap-2 rounded-md border border-border bg-muted/30 p-3 transition-colors hover:bg-muted/50"
                >
                  {editingId === character._id ? (
                    <>
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => {
                          setEditingName(e.target.value);
                          setError(null);
                        }}
                        onKeyDown={(e) => handleEditKeyDown(e, character._id)}
                        maxLength={100}
                        autoFocus
                        className={cn(
                          "flex h-8 flex-1 rounded-md border border-input bg-background px-2 py-1 text-sm",
                          "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring",
                          error &&
                            "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20"
                        )}
                      />
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => void saveEditing(character._id)}
                      >
                        <Check className="size-4 text-green-600" />
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={cancelEditing}
                      >
                        <X className="size-4 text-muted-foreground" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 text-sm font-medium">
                        {character.name}
                      </span>

                      {/* Team Member Assignment */}
                      <NativeSelect
                        value={character.assignedTo || ""}
                        onChange={(e) =>
                          void handleAssignmentChange(
                            character._id,
                            e.target.value
                          )
                        }
                        className="w-40"
                      >
                        <NativeSelectOption value="">
                          Unassigned
                        </NativeSelectOption>
                        {teamMembers.map((member) => (
                          <NativeSelectOption
                            key={member._id}
                            value={member._id}
                          >
                            {member.name}
                          </NativeSelectOption>
                        ))}
                      </NativeSelect>

                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => startEditing(character)}
                      >
                        <Pencil className="size-4 text-muted-foreground" />
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={() =>
                          void handleDelete(character._id, character.name)
                        }
                      >
                        <Trash2 className="size-4 text-muted-foreground hover:text-destructive" />
                      </Button>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
