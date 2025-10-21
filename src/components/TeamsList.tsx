import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { ListBuilder, type ListBuilderItem } from "./ListBuilder";

export default function TeamsList() {
  const teamMembers = useQuery(api.teamMembers.list) || [];
  const createTeamMember = useMutation(api.teamMembers.create);
  const updateTeamMember = useMutation(api.teamMembers.update);
  const removeTeamMember = useMutation(api.teamMembers.remove);

  const handleCreateMember = async (name: string) => {
    try {
      await createTeamMember({ name });
      toast.success("Team member added!");
    } catch (error) {
      toast.error("Failed to add team member");
      throw error;
    }
  };

  const handleRenameMember = async (id: string, newName: string) => {
    try {
      await updateTeamMember({ id: id as any, name: newName });
      toast.success("Team member updated!");
    } catch (error) {
      toast.error("Failed to update team member");
      throw error;
    }
  };

  const handleDeleteMember = async (id: string) => {
    try {
      await removeTeamMember({ id: id as any });
      toast.success("Team member removed!");
    } catch (error) {
      toast.error("Failed to remove team member");
      throw error;
    }
  };

  const items: ListBuilderItem[] = teamMembers.map((member) => ({
    id: member._id,
    name: member.name,
  }));

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Team Members</h1>
          <p className="text-gray-600 mt-1">
            Manage your theatre group members
          </p>
        </div>
      </div>

      <ListBuilder
        items={items}
        onCreateItem={handleCreateMember}
        onRenameItem={handleRenameMember}
        onDeleteItem={handleDeleteMember}
        title="Team Members"
        description="Add and manage team members who can be assigned to characters and props."
        placeholder="Enter member name..."
        emptyStateMessage="No team members yet. Add your first member to get started."
      />
    </div>
  );
}
