import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CATEGORIES } from "@shared/schema";
import type { InsertTask, Group } from "@shared/schema";

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultGroupId?: string | null;
  defaultQuadrant?: number | null;
}

const QUADRANT_OPTIONS = [
  { q: 1, label: "Do First",  sub: "Important & Urgent",         color: "border-red-400 bg-red-50 text-red-700",    active: "border-red-500 bg-red-100 ring-red-300" },
  { q: 2, label: "Schedule",  sub: "Important, Not Urgent",      color: "border-blue-400 bg-blue-50 text-blue-700",  active: "border-blue-500 bg-blue-100 ring-blue-300" },
  { q: 3, label: "Delegate",  sub: "Not Important, Urgent",      color: "border-yellow-400 bg-yellow-50 text-yellow-700", active: "border-yellow-500 bg-yellow-100 ring-yellow-300" },
  { q: 4, label: "Don't Do",  sub: "Not Important, Not Urgent",  color: "border-gray-300 bg-gray-50 text-gray-600",  active: "border-gray-500 bg-gray-100 ring-gray-300" },
];

export default function AddTaskModal({ isOpen, onClose, defaultGroupId, defaultQuadrant }: AddTaskModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [deadline, setDeadline] = useState("");
  const [groupId, setGroupId] = useState<string>(defaultGroupId ?? "");
  const [quadrant, setQuadrant] = useState<number | null>(defaultQuadrant ?? null);
  const { toast } = useToast();

  const { data: groups = [] } = useQuery<Group[]>({ queryKey: ["/api/groups"] });

  const createTaskMutation = useMutation({
    mutationFn: async (task: InsertTask) => {
      await apiRequest("POST", "/api/tasks", task);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({ title: "Success", description: "Task created successfully" });
      handleClose();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create task", variant: "destructive" });
    },
  });

  const handleClose = () => {
    setTitle("");
    setDescription("");
    setCategory("");
    setDeadline("");
    setGroupId(defaultGroupId ?? "");
    setQuadrant(defaultQuadrant ?? null);
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast({ title: "Error", description: "Task title is required", variant: "destructive" });
      return;
    }
    createTaskMutation.mutate({
      title: title.trim(),
      description: description.trim(),
      completed: false,
      category: category || "",
      deadline: deadline || null,
      groupId: groupId || null,
      quadrant: quadrant,
    });
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={handleClose}
      data-testid="modal-overlay"
    >
      <div
        className="modal-content bg-card md-elevation-8 rounded max-w-lg w-full p-6"
        onClick={(e) => e.stopPropagation()}
        data-testid="modal-content"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-medium text-foreground" data-testid="text-modal-title">
            Add New Task
          </h2>
          <button
            onClick={handleClose}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-full hover:bg-gray-100"
            data-testid="button-close-modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} data-testid="form-add-task">
          <div className="space-y-4">
            {/* Title */}
            <div>
              <label htmlFor="task-title" className="block text-sm font-medium text-foreground mb-2">
                Task Title *
              </label>
              <input
                type="text"
                id="task-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter task title..."
                required
                className="w-full px-4 py-3 bg-background border border-input rounded text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:border-2 transition-all"
                data-testid="input-task-title"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="task-description" className="block text-sm font-medium text-foreground mb-2">
                Description
              </label>
              <textarea
                id="task-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Add more details..."
                className="w-full px-4 py-3 bg-background border border-input rounded text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:border-2 transition-all resize-none"
                data-testid="textarea-task-description"
              />
            </div>

            {/* Eisenhower Matrix Picker */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Priority (Eisenhower Matrix)
              </label>
              <div className="grid grid-cols-2 gap-2" data-testid="quadrant-picker">
                {QUADRANT_OPTIONS.map(({ q, label, sub, color, active }) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setQuadrant(quadrant === q ? null : q)}
                    className={`text-left px-3 py-2.5 rounded border-2 transition-all ${
                      quadrant === q
                        ? `${active} ring-2`
                        : `${color} hover:opacity-80`
                    }`}
                    data-testid={`button-quadrant-${q}`}
                  >
                    <div className="text-xs font-semibold">{label}</div>
                    <div className="text-xs opacity-70 mt-0.5">{sub}</div>
                  </button>
                ))}
              </div>
              {quadrant && (
                <button
                  type="button"
                  onClick={() => setQuadrant(null)}
                  className="mt-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Clear selection
                </button>
              )}
            </div>

            {/* Group + Category + Deadline row */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label htmlFor="task-group" className="block text-xs font-medium text-foreground mb-1.5">
                  Group
                </label>
                <select
                  id="task-group"
                  value={groupId}
                  onChange={(e) => setGroupId(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-background border border-input rounded text-foreground focus:outline-none focus:border-primary transition-all"
                  data-testid="select-task-group"
                >
                  <option value="">None</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="task-category" className="block text-xs font-medium text-foreground mb-1.5">
                  Category
                </label>
                <select
                  id="task-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-background border border-input rounded text-foreground focus:outline-none focus:border-primary transition-all"
                  data-testid="select-task-category"
                >
                  <option value="">None</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="task-deadline" className="block text-xs font-medium text-foreground mb-1.5">
                  Deadline
                </label>
                <input
                  type="date"
                  id="task-deadline"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full px-3 py-2 text-sm bg-background border border-input rounded text-foreground focus:outline-none focus:border-primary transition-all"
                  data-testid="input-task-deadline"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6 justify-end">
            <button
              type="button"
              onClick={handleClose}
              disabled={createTaskMutation.isPending}
              className="md-button px-4 py-2 border-0 text-foreground font-medium hover:bg-gray-100 transition-colors rounded"
              data-testid="button-cancel"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createTaskMutation.isPending}
              className="md-button md-button-raised px-4 py-2 bg-primary text-primary-foreground border-0 font-medium disabled:opacity-50 rounded"
              data-testid="button-submit"
            >
              {createTaskMutation.isPending ? "Adding..." : "Add Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
