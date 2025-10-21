import { useState, useRef, KeyboardEvent } from "react";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { Link } from "react-router-dom";
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
import { cn } from "@/lib/utils";
import { Input } from "./ui/input";

export interface ListBuilderItem {
  id: string;
  name: string;
}

export interface ListBuilderProps {
  items: ListBuilderItem[];
  onCreateItem: (name: string) => void | Promise<void>;
  onRenameItem: (id: string, newName: string) => void | Promise<void>;
  onDeleteItem: (id: string) => void | Promise<void>;
  title?: string;
  description?: string;
  placeholder?: string;
  createButtonLabel?: string;
  emptyStateMessage?: string;
  maxLength?: number;
  allowEmpty?: boolean;
  getLinkPath?: (id: string) => string;
}

export function ListBuilder({
  items,
  onCreateItem,
  onRenameItem,
  onDeleteItem,
  title = "List Builder",
  description,
  placeholder = "Enter item name...",
  emptyStateMessage = "No items yet. Add one to get started.",
  allowEmpty = false,
  getLinkPath,
}: ListBuilderProps) {
  const [newItemName, setNewItemName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleCreate = async () => {
    const trimmedName = newItemName.trim();

    if (!allowEmpty && !trimmedName) {
      setError("Item name cannot be empty");
      return;
    }

    if (items.some((item) => item.name === trimmedName)) {
      setError("An item with this name already exists");
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      await onCreateItem(trimmedName);
      setNewItemName("");
      inputRef.current?.focus();
    } catch {
      setError("Failed to create item");
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

  const startEditing = (item: ListBuilderItem) => {
    setEditingId(item.id);
    setEditingName(item.name);
    setError(null);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingName("");
    setError(null);
  };

  const saveEditing = async (id: string) => {
    const trimmedName = editingName.trim();

    if (!allowEmpty && !trimmedName) {
      setError("Item name cannot be empty");
      return;
    }

    if (items.some((item) => item.id !== id && item.name === trimmedName)) {
      setError("An item with this name already exists");
      return;
    }

    setError(null);

    try {
      await onRenameItem(id, trimmedName);
      setEditingId(null);
      setEditingName("");
    } catch {
      setError("Failed to update item");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await onDeleteItem(id);
    } catch {
      setError("Failed to delete item");
    }
  };

  const handleEditKeyDown = (
    e: KeyboardEvent<HTMLInputElement>,
    id: string
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      void saveEditing(id);
    } else if (e.key === "Escape") {
      cancelEditing();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Create Item Section */}
        <Field>
          <FieldLabel htmlFor="new-item-input">Add Item</FieldLabel>
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              id="new-item-input"
              type="text"
              value={newItemName}
              onChange={(e) => {
                setNewItemName(e.target.value);
                setError(null);
              }}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={isCreating}
              maxLength={100}
            />
            <Button
              onClick={() => void handleCreate()}
              disabled={isCreating || (!allowEmpty && !newItemName.trim())}
              size="sm"
            >
              <Plus className="size-4" />
            </Button>
          </div>
          {error && <FieldError>{error}</FieldError>}
        </Field>

        {/* Items List */}
        <div className="space-y-2">
          <FieldDescription>
            {items.length === 0 ? (
              emptyStateMessage
            ) : (
              <>
                <span className="font-medium">{items.length}</span>{" "}
                {items.length === 1 ? "item" : "items"}
              </>
            )}
          </FieldDescription>

          {items.length > 0 && (
            <div className="space-y-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-2 rounded-md border border-border bg-muted/30 p-3 transition-colors hover:bg-muted/50"
                >
                  {editingId === item.id ? (
                    <>
                      <Input
                        type="text"
                        value={editingName}
                        onChange={(e) => {
                          setEditingName(e.target.value);
                          setError(null);
                        }}
                        onKeyDown={(e) => handleEditKeyDown(e, item.id)}
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
                        onClick={() => void saveEditing(item.id)}
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
                      {getLinkPath ? (
                        <Link
                          to={getLinkPath(item.id)}
                          className="flex-1 text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {item.name}
                        </Link>
                      ) : (
                        <span className="flex-1 text-sm font-medium">
                          {item.name}
                        </span>
                      )}
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => startEditing(item)}
                      >
                        <Pencil className="size-4 text-muted-foreground" />
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => void handleDelete(item.id)}
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
