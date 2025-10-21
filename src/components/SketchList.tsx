import React, { useEffect, useState, useRef, KeyboardEvent } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SketchCard } from "./SketchCard";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

export default function SketchList() {
  const sketches = useQuery(api.sketches.list) || [];
  const [items, setItems] = useState(sketches);
  const [newSketchTitle, setNewSketchTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const reorderSketches = useMutation(api.sketches.reorder);
  const createSketch = useMutation(api.sketches.create);
  const removeSketch = useMutation(api.sketches.remove);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((item) => item._id === active.id);
        const newIndex = items.findIndex((item) => item._id === over?.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }

  useEffect(() => {
    reorderSketches({
      sketchIds: items.map((s) => s._id),
    }).catch(() => {
      toast.error("Failed to reorder sketches. Please try again.");
    });
  }, [items, reorderSketches]);

  useEffect(() => {
    const oldSketches = JSON.stringify(items);
    const newSketches = JSON.stringify(sketches);
    if (oldSketches !== newSketches) {
      setItems(sketches);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sketches]);

  const handleCreate = async () => {
    const trimmedTitle = newSketchTitle.trim();

    if (!trimmedTitle) {
      toast.error("Sketch title cannot be empty");
      return;
    }

    setIsCreating(true);

    try {
      await createSketch({ title: trimmedTitle });
      setNewSketchTitle("");
      toast.success("Sketch created!");
      inputRef.current?.focus();
    } catch (error) {
      toast.error("Failed to create sketch");
      console.error(error);
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

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this sketch? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      await removeSketch({ id: id as any });
      toast.success("Sketch deleted!");
    } catch (error) {
      toast.error("Failed to delete sketch");
      console.error(error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sketches</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Create Sketch Section */}
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            type="text"
            value={newSketchTitle}
            onChange={(e) => setNewSketchTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter sketch title..."
            disabled={isCreating}
            maxLength={100}
          />
          <Button
            onClick={() => void handleCreate()}
            disabled={isCreating || !newSketchTitle.trim()}
            size="sm"
          >
            <Plus className="size-4" />
          </Button>
        </div>

        {/* Sketches List */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={(e) => void handleDragEnd(e)}
        >
          <SortableContext
            items={items.map((s) => s._id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="flex flex-col gap-2">
              {items.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No sketches yet. Add your first sketch to get started.
                </p>
              ) : (
                items.map((sketch) => (
                  <SketchCard
                    key={sketch._id}
                    sketch={sketch}
                    onDelete={(id) => void handleDelete(id)}
                  />
                ))
              )}
            </div>
          </SortableContext>
        </DndContext>
      </CardContent>
    </Card>
  );
}
