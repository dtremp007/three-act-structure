import { useState, KeyboardEvent } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import type { Id } from "../../convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";

interface PropsSelectorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sketchId: Id<"sketches">;
  selectedPropIds: Set<Id<"props">>;
  onToggleProp: (propId: Id<"props">) => void;
}

export function PropsSelectorDialog({
  open,
  onOpenChange,
  sketchId: _sketchId,
  selectedPropIds,
  onToggleProp,
}: PropsSelectorDialogProps) {
  const allProps = useQuery(api.props.list) || [];
  const createProp = useMutation(api.props.create);

  const [searchQuery, setSearchQuery] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateProp = async () => {
    const trimmedName = searchQuery.trim();

    if (!trimmedName) {
      setError("Prop name cannot be empty");
      return;
    }

    if (allProps.some((prop) => prop.name === trimmedName)) {
      setError("A prop with this name already exists");
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const propId = await createProp({ name: trimmedName });
      setSearchQuery("");
      toast.success("Prop created!");

      // Automatically select the newly created prop
      onToggleProp(propId);
    } catch {
      setError("Failed to create prop");
      toast.error("Failed to create prop");
    } finally {
      setIsCreating(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && filteredProps.length === 0 && searchQuery.trim()) {
      e.preventDefault();
      void handleCreateProp();
    }
  };

  const filteredProps = allProps.filter((prop) =>
    prop.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const canCreate = searchQuery.trim() && filteredProps.length === 0;

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

  const getStatusLabel = (status: "idea" | "planned" | "ready"): string => {
    switch (status) {
      case "idea":
        return "Idea";
      case "planned":
        return "Planned";
      case "ready":
        return "Ready";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Props to Sketch</DialogTitle>
        </DialogHeader>

        <div className="flex-1 px-2 overflow-y-auto space-y-4">
          {/* Search/Create Combined */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Search or Create Props</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setError(null);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Search or type to create new prop..."
                  className="pl-9"
                  disabled={isCreating}
                  maxLength={100}
                />
              </div>
              {canCreate && (
                <Button
                  onClick={() => void handleCreateProp()}
                  disabled={isCreating}
                  size="sm"
                  title={`Create "${searchQuery.trim()}"`}
                >
                  <Plus className="size-4 mr-1" />
                  Create
                </Button>
              )}
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          {/* Props List */}
          <div className="space-y-2">
            {filteredProps.length === 0 ? (
              <div className="text-center py-8 space-y-2">
                {canCreate ? (
                  <>
                    <p className="text-sm text-muted-foreground">
                      No props found matching "{searchQuery.trim()}".
                    </p>
                    <p className="text-sm font-medium text-gray-900">
                      Press Enter or click "Create" to add this prop.
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {searchQuery
                      ? "No props found matching your search."
                      : "No props available. Type to create a new prop."}
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredProps.map((prop) => {
                  const isSelected = selectedPropIds.has(prop._id);
                  return (
                    <label
                      key={prop._id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleProp(prop._id)}
                        className="size-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{prop.name}</span>
                          <Badge variant={getStatusVariant(prop.status)}>
                            {getStatusLabel(prop.status)}
                          </Badge>
                        </div>
                        {prop.responsiblePerson && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Responsible: {prop.responsiblePerson.name}
                          </p>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
