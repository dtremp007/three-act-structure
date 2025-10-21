import { Link } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Users, Package, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Id } from "../../convex/_generated/dataModel";

interface SketchCardProps {
  sketch: {
    _id: Id<"sketches">;
    title: string;
    duration?: number;
  };
  onDelete?: (id: Id<"sketches">) => void;
}

export function SketchCard({ sketch, onDelete }: SketchCardProps) {
  // Fetch characters and props for this sketch
  const characters =
    useQuery(api.characters.list, { sketchId: sketch._id }) || [];
  const props = useQuery(api.props.listForSketch, { sketchId: sketch._id }) || [];
  const teamMembers = useQuery(api.teamMembers.list) || [];

  // Get assigned actors (characters with assigned team members)
  const assignedActors = characters
    .filter((char) => char.assignedTo)
    .map((char) => {
      const teamMember = teamMembers.find((tm) => tm._id === char.assignedTo);
      return teamMember?.name || "Unknown";
    })
    .filter((name) => name !== "Unknown");

  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id: sketch._id,
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <div
        className={cn(
          "flex items-center border border-border text-sm rounded-md transition-colors bg-card text-card-foreground shadow-sm p-4 gap-4 min-h-28"
        )}
      >
        {/* Drag Handle - Always visible, only functional in edit mode */}
        <button
          {...listeners}
          className={cn(
            "flex shrink-0 items-center justify-center p-1 rounded transition-colors touch-none",
            "cursor-grab active:cursor-grabbing hover:bg-accent"
          )}
          aria-label="Drag to reorder"
        >
          <GripVertical className="size-5 text-muted-foreground" />
        </button>

        <div className="flex flex-1 flex-col gap-2">
          <h3 className="text-sm font-medium">{sketch.title}</h3>

          <div className="flex flex-col gap-2">
            {/* Actors */}
            {assignedActors.length > 0 && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="size-3" />
                <span>{assignedActors.join(", ")}</span>
              </div>
            )}

            {/* Props count */}
            {props.length > 0 && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Package className="size-3" />
                <span>
                  {props.length} {props.length === 1 ? "prop" : "props"}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {sketch.duration && <Badge>{sketch.duration} minutes</Badge>}
          <div className="flex gap-2">
            <Button size="sm" variant="outline" asChild>
              <Link to={`/sketch/${sketch._id}`}>Details</Link>
            </Button>
            {onDelete && (
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(sketch._id);
                }}
              >
                <Trash2 className="size-4 text-muted-foreground hover:text-destructive" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
