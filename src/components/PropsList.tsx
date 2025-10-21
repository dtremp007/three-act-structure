import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { ListBuilder, type ListBuilderItem } from "./ListBuilder";

export default function PropsList() {
  const props = useQuery(api.props.list) || [];
  const createProp = useMutation(api.props.create);
  const updateProp = useMutation(api.props.update);
  const removeProp = useMutation(api.props.remove);

  const handleCreateProp = async (name: string) => {
    try {
      await createProp({ name });
      toast.success("Prop created!");
    } catch (error) {
      toast.error("Failed to create prop");
      throw error;
    }
  };

  const handleRenameProp = async (id: string, newName: string) => {
    try {
      await updateProp({ id: id as any, name: newName });
      toast.success("Prop renamed!");
    } catch (error) {
      toast.error("Failed to rename prop");
      throw error;
    }
  };

  const handleDeleteProp = async (id: string) => {
    try {
      await removeProp({ id: id as any });
      toast.success("Prop deleted!");
    } catch (error) {
      toast.error("Failed to delete prop");
      throw error;
    }
  };

  const items: ListBuilderItem[] = props.map((prop) => ({
    id: prop._id,
    name: prop.name,
  }));

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Props Library</h1>
          <p className="text-gray-600 mt-1">
            Manage all props for your theatre group
          </p>
        </div>
      </div>

      <ListBuilder
        items={items}
        onCreateItem={handleCreateProp}
        onRenameItem={handleRenameProp}
        onDeleteItem={handleDeleteProp}
        title="Props"
        description="Create and manage props. Click on a prop name to view its details."
        placeholder="Enter prop name..."
        emptyStateMessage="No props yet. Add one to get started."
        getLinkPath={(id) => `/prop/${id}`}
      />
    </div>
  );
}
