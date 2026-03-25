import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, List, Trash2 } from "lucide-react";
import { useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import AddTaskModal from "@/components/add-task-modal";
import type { Task } from "@shared/schema";

const QUADRANT_CONFIG = {
  1: {
    label: "Do First",
    sub: "Important & Urgent",
    corner: "Q1",
    bg: "bg-red-50",
    border: "border-red-200",
    header: "bg-red-100",
    accent: "text-red-700",
    dropActive: "bg-red-100 border-red-400",
  },
  2: {
    label: "Schedule",
    sub: "Important, Not Urgent",
    corner: "Q2",
    bg: "bg-blue-50",
    border: "border-blue-200",
    header: "bg-blue-100",
    accent: "text-blue-700",
    dropActive: "bg-blue-100 border-blue-400",
  },
  3: {
    label: "Delegate",
    sub: "Not Important, Urgent",
    corner: "Q3",
    bg: "bg-yellow-50",
    border: "border-yellow-200",
    header: "bg-yellow-100",
    accent: "text-yellow-700",
    dropActive: "bg-yellow-100 border-yellow-400",
  },
  4: {
    label: "Don't Do",
    sub: "Not Important, Not Urgent",
    corner: "Q4",
    bg: "bg-gray-50",
    border: "border-gray-200",
    header: "bg-gray-100",
    accent: "text-gray-600",
    dropActive: "bg-gray-100 border-gray-400",
  },
} as const;

export default function MatrixPage() {
  const [, setLocation] = useLocation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [defaultQuadrant, setDefaultQuadrant] = useState<number | null>(null);
  const [dragOverQuadrant, setDragOverQuadrant] = useState<number | null>(null);
  const { toast } = useToast();

  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
    queryFn: async () => {
      const res = await fetch("/api/tasks", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch tasks");
      return res.json();
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, quadrant }: { id: string; quadrant: number | null }) => {
      await apiRequest("PATCH", `/api/tasks/${id}`, { quadrant });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/tasks"] }),
    onError: () => toast({ title: "Error", description: "Failed to move task", variant: "destructive" }),
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/tasks/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/tasks"] }),
    onError: () => toast({ title: "Error", description: "Failed to delete task", variant: "destructive" }),
  });

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData("taskId", taskId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, quadrant: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverQuadrant(quadrant);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear if leaving the quadrant container itself
    if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) {
      setDragOverQuadrant(null);
    }
  };

  const handleDrop = (e: React.DragEvent, quadrant: number) => {
    e.preventDefault();
    setDragOverQuadrant(null);
    const taskId = e.dataTransfer.getData("taskId");
    if (taskId) updateTaskMutation.mutate({ id: taskId, quadrant });
  };

  const tasksInQuadrant = (q: number) =>
    tasks.filter((t) => t.quadrant === q && !t.completed);

  const unassigned = tasks.filter((t) => !t.quadrant && !t.completed);

  const formatDeadline = (deadline: Date | string | null) => {
    if (!deadline) return null;
    const d = new Date(deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dl = new Date(d);
    dl.setHours(0, 0, 0, 0);
    const diff = Math.round((dl.getTime() - today.getTime()) / 86400000);
    const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    if (diff < 0)  return { label, cls: "text-danger" };
    if (diff === 0) return { label: "Today", cls: "text-warning fw-bold" };
    return { label, cls: "text-muted" };
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-medium text-foreground">Eisenhower Matrix</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Drag rows between quadrants to reprioritise</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLocation("/")}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted-foreground border border-gray-200 rounded bg-transparent hover:text-foreground hover:border-gray-400 transition-colors"
            >
              <List className="w-4 h-4" />
              List View
            </button>
            <button
              onClick={() => { setDefaultQuadrant(null); setIsModalOpen(true); }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-primary border border-primary rounded bg-transparent hover:bg-primary hover:text-white transition-colors"
              data-testid="button-add-task"
            >
              <Plus className="w-4 h-4" />
              Add Task
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-6">
        {/* 2×2 Grid */}
        <div className="grid grid-cols-2 gap-4">
          {([1, 2, 3, 4] as const).map((q) => {
            const cfg = QUADRANT_CONFIG[q];
            const qtasks = tasksInQuadrant(q);
            const isOver = dragOverQuadrant === q;

            return (
              <div
                key={q}
                className={`flex flex-col rounded-lg border-2 transition-colors ${
                  isOver ? cfg.dropActive : `${cfg.bg} ${cfg.border}`
                }`}
                onDragOver={(e) => handleDragOver(e, q)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, q)}
                data-testid={`quadrant-${q}`}
              >
                {/* Quadrant header */}
                <div className={`flex items-center justify-between px-4 py-3 rounded-t-md ${cfg.header}`}>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold uppercase tracking-wider ${cfg.accent}`}>{cfg.corner}</span>
                      <span className={`text-sm font-semibold ${cfg.accent}`}>{cfg.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{cfg.sub}</p>
                  </div>
                  <button
                    onClick={() => { setDefaultQuadrant(q); setIsModalOpen(true); }}
                    className={`w-7 h-7 flex items-center justify-center rounded-full bg-white border ${cfg.border} ${cfg.accent} hover:opacity-80 transition-opacity`}
                    title={`Add task to ${cfg.label}`}
                    data-testid={`button-add-to-quadrant-${q}`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Bootstrap table */}
                <div className="overflow-x-auto">
                  {qtasks.length === 0 ? (
                    <div className="flex items-center justify-center py-8 text-xs text-muted-foreground border-t border-dashed border-gray-300">
                      Drop tasks here
                    </div>
                  ) : (
                    <table className="table mb-0" style={{ background: "transparent" }}>
                      <tbody>
                        {qtasks.map((task) => {
                          const dl = formatDeadline(task.deadline);
                          return (
                            <tr
                              key={task.id}
                              draggable
                              onDragStart={(e) => handleDragStart(e, task.id)}
                              className="cursor-grab active:cursor-grabbing"
                              style={{ background: "transparent" }}
                              data-testid={`task-card-${task.id}`}
                            >
                              <td>
                                <span title="Drag to move" style={{ cursor: "grab", color: "#aaa", fontSize: 14 }}>⠿</span>
                              </td>
                              <td>
                                <span className="text-sm" data-testid={`text-task-title-${task.id}`}>
                                  {task.title}
                                </span>
                              </td>
                              <td>
                                <span className="text-sm text-muted-foreground">
                                  {task.description || "—"}
                                </span>
                              </td>
                              <td>
                                {dl ? (
                                  <small className={dl.cls}>{dl.label}</small>
                                ) : (
                                  <span className="text-muted-foreground">—</span>
                                )}
                              </td>
                              <td>
                                <button
                                  onClick={() => deleteTaskMutation.mutate(task.id)}
                                  className="bg-transparent border-0 p-0 text-muted-foreground hover:text-danger transition-colors"
                                  data-testid={`button-delete-task-${task.id}`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Unassigned tasks strip */}
        {unassigned.length > 0 && (
          <div className="mt-4 bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-4 py-2 border-b border-gray-100">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Unassigned — drag to a quadrant</p>
            </div>
            <table className="table mb-0">
              <tbody>
                {unassigned.map((task) => (
                  <tr
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    className="cursor-grab active:cursor-grabbing"
                    data-testid={`unassigned-task-${task.id}`}
                  >
                    <td style={{ width: 20 }}>
                      <span style={{ cursor: "grab", color: "#aaa", fontSize: 14 }}>⠿</span>
                    </td>
                    <td className="text-sm">{task.title}</td>
                    <td className="text-sm text-muted-foreground">{task.description || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      <AddTaskModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setDefaultQuadrant(null); }}
        defaultQuadrant={defaultQuadrant}
      />
    </div>
  );
}
