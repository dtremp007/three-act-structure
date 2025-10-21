import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { PropsSelectorDialog } from "./PropsSelectorDialog";

export function PropsSelector() {
  const { id } = useParams<{ id: string }>();
  const sketchId = id as Id<"sketches">;

  const selectedProps = useQuery(api.props.listForSketch, { sketchId }) || [];
  const addToSketch = useMutation(api.props.addToSketch);
  const removeFromSketch = useMutation(api.props.removeFromSketch);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [pendingSelections, setPendingSelections] = useState<Set<Id<"props">>>(
    new Set()
  );

  const handleOpenDialog = () => {
    // Initialize pending selections with current props
    setPendingSelections(new Set(selectedProps.map((p) => p._id)));
    setIsDialogOpen(true);
  };

  const handleToggleProp = (propId: Id<"props">) => {
    setPendingSelections((prev) => {
      const next = new Set(prev);
      if (next.has(propId)) {
        next.delete(propId);
      } else {
        next.add(propId);
      }
      return next;
    });
  };

  const handleCloseDialog = async () => {
    const currentIds = new Set(selectedProps.map((p) => p._id));
    const added = Array.from(pendingSelections).filter((id) => !currentIds.has(id));
    const removed = selectedProps.filter((p) => !pendingSelections.has(p._id));

    try {
      // Add new props
      for (const propId of added) {
        await addToSketch({ sketchId, propId });
      }

      // Remove unselected props
      for (const prop of removed) {
        await removeFromSketch({ sketchId, propId: prop._id });
      }

      if (added.length > 0 || removed.length > 0) {
        toast.success("Props updated!");
      }
    } catch (error) {
      toast.error("Failed to update props");
      console.error(error);
    }

    setIsDialogOpen(false);
  };

  const handleRemoveProp = async (propId: Id<"props">) => {
    try {
      await removeFromSketch({ sketchId, propId });
      toast.success("Prop removed!");
    } catch (error) {
      toast.error("Failed to remove prop");
      console.error(error);
    }
  };

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
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Props Needed</CardTitle>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleOpenDialog}>
                <Plus className="size-4 mr-1" />
                Add Props
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {selectedProps.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No props assigned to this sketch yet.
              <br />
              Click "Add Props" to get started.
            </p>
          ) : (
            <div className="space-y-2">
              {selectedProps.map((prop) => (
                <div
                  key={prop._id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <Link
                    to={`/prop/${prop._id}`}
                    className="flex-1 min-w-0 hover:text-blue-600"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{prop.name}</span>
                      <Badge variant={getStatusVariant(prop.status)}>
                        {getStatusLabel(prop.status)}
                      </Badge>
                    </div>
                  </Link>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    onClick={() => {
                      void handleRemoveProp(prop._id);
                    }}
                    title="Remove from sketch"
                  >
                    <Trash2 className="size-4 text-muted-foreground hover:text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <PropsSelectorDialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            void handleCloseDialog();
          }
        }}
        sketchId={sketchId}
        selectedPropIds={pendingSelections}
        onToggleProp={handleToggleProp}
      />
    </>
  );
}
