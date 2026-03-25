import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Trash2, Tag, Calendar, X, LayoutGrid } from "lucide-react";
import { useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import AddTaskModal from "@/components/add-task-modal";
import type { Task, Group } from "@shared/schema";

type FilterType = 'all' | 'active' | 'completed';

const CATEGORY_COLORS: Record<string, string> = {
  Work:     'bg-blue-100 text-blue-800',
  Personal: 'bg-purple-100 text-purple-800',
  Shopping: 'bg-yellow-100 text-yellow-800',
  Health:   'bg-green-100 text-green-800',
  Other:    'bg-gray-100 text-gray-700',
};

export default function Home() {
  const [filter, setFilter] = useState<FilterType>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [newGroupName, setNewGroupName] = useState("");
  const [showNewGroupInput, setShowNewGroupInput] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // ── Queries ──────────────────────────────────────────
  const { data: groups = [] } = useQuery<Group[]>({ queryKey: ['/api/groups'] });

  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ['/api/tasks', selectedGroupId],
    queryFn: async () => {
      const url = selectedGroupId
        ? `/api/tasks?groupId=${selectedGroupId}`
        : '/api/tasks';
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch tasks');
      return res.json();
    },
  });

  // ── Group mutations ──────────────────────────────────
  const createGroupMutation = useMutation({
    mutationFn: async (name: string) => {
      await apiRequest('POST', '/api/groups', { name, description: '' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/groups'] });
      setNewGroupName("");
      setShowNewGroupInput(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create group", variant: "destructive" });
    },
  });

  const deleteGroupMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/groups/${id}`);
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['/api/groups'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      if (selectedGroupId === id) setSelectedGroupId(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete group", variant: "destructive" });
    },
  });

  // ── Task mutations ───────────────────────────────────
  const toggleTaskMutation = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      await apiRequest('PATCH', `/api/tasks/${id}`, { completed });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update task", variant: "destructive" });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/tasks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      toast({ title: "Success", description: "Task deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete task", variant: "destructive" });
    },
  });

  // ── Helpers ──────────────────────────────────────────
  const filteredTasks = tasks.filter((task) => {
    if (filter === 'active') return !task.completed;
    if (filter === 'completed') return task.completed;
    return true;
  });

  const activeTasks = tasks.filter((t) => !t.completed);

  const selectedGroupName = selectedGroupId
    ? groups.find((g) => g.id === selectedGroupId)?.name ?? 'Group'
    : 'All Tasks';

  const formatDeadline = (deadline: Date | string | null) => {
    if (!deadline) return null;
    const d = new Date(deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dl = new Date(d);
    dl.setHours(0, 0, 0, 0);
    const diff = Math.round((dl.getTime() - today.getTime()) / 86400000);
    const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    if (diff < 0)  return { label, style: 'text-danger fw-bold' };
    if (diff === 0) return { label: 'Today', style: 'text-warning fw-bold' };
    if (diff === 1) return { label: 'Tomorrow', style: 'text-warning' };
    return { label, style: 'text-muted' };
  };

  const formatTime = (date: Date | string) => {
    const d = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dd = new Date(d);
    dd.setHours(0, 0, 0, 0);
    if (dd.getTime() === today.getTime()) {
      return `Today at ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
    }
    if (dd.getTime() === today.getTime() - 86400000) return 'Yesterday';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newGroupName.trim();
    if (!name) return;
    createGroupMutation.mutate(name);
  };

  // ── Render ───────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-card md-elevation-2 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-medium text-foreground">My Tasks</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                <span data-testid="text-tasks-remaining">{activeTasks.length}</span> tasks remaining
                {selectedGroupId && (
                  <span className="ml-2 font-medium text-primary">· {selectedGroupName}</span>
                )}
              </p>
            </div>
            <button
              onClick={() => setLocation('/matrix')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted-foreground border border-gray-200 rounded bg-transparent hover:text-foreground hover:border-gray-400 transition-colors"
              data-testid="button-matrix-view"
            >
              <LayoutGrid className="w-4 h-4" />
              Matrix View
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-primary border border-primary rounded bg-transparent hover:bg-primary hover:text-white transition-colors"
              data-testid="button-add-task"
            >
              <Plus className="w-4 h-4" />
              Add Task
            </button>
          </div>
        </div>
      </header>

      {/* Body: sidebar + main */}
      <div className="flex flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 gap-6">

        {/* ── Sidebar ── */}
        <aside className="w-44 flex-shrink-0" data-testid="groups-sidebar">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2 px-1">Groups</p>

          {/* All Tasks */}
          <button
            onClick={() => setSelectedGroupId(null)}
            className={`w-full text-left px-2 py-1.5 text-sm rounded transition-colors border-0 bg-transparent mb-0.5 ${
              selectedGroupId === null
                ? 'text-primary font-medium'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            data-testid="button-group-all"
          >
            All Tasks
          </button>

          {/* Group list */}
          {groups.map((group) => (
            <div
              key={group.id}
              className="flex items-center group mb-0.5"
              data-testid={`group-item-${group.id}`}
            >
              <button
                onClick={() => setSelectedGroupId(group.id)}
                className={`flex-1 text-left px-2 py-1.5 text-sm rounded transition-colors border-0 bg-transparent ${
                  selectedGroupId === group.id
                    ? 'text-primary font-medium'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                data-testid={`button-group-${group.id}`}
              >
                {group.name}
              </button>
              <button
                onClick={() => deleteGroupMutation.mutate(group.id)}
                className="opacity-0 group-hover:opacity-40 hover:!opacity-100 transition-opacity bg-transparent border-0 p-1 cursor-pointer text-muted-foreground"
                title="Delete group"
                data-testid={`button-delete-group-${group.id}`}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}

          {/* New group */}
          <div className="mt-2">
            {showNewGroupInput ? (
              <form onSubmit={handleCreateGroup}>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Group name…"
                  autoFocus
                  className="w-full px-2 py-1.5 text-sm border border-input rounded focus:outline-none focus:border-primary text-foreground mb-1.5"
                  data-testid="input-new-group-name"
                />
                <div className="flex gap-1.5">
                  <button
                    type="submit"
                    disabled={createGroupMutation.isPending || !newGroupName.trim()}
                    className="flex-1 text-xs py-1 bg-primary text-primary-foreground border-0 rounded disabled:opacity-40"
                    data-testid="button-create-group-submit"
                  >
                    Create
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowNewGroupInput(false); setNewGroupName(""); }}
                    className="flex-1 text-xs py-1 text-muted-foreground bg-transparent border border-gray-200 rounded hover:border-gray-400 transition-colors"
                    data-testid="button-create-group-cancel"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setShowNewGroupInput(true)}
                className="flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors border-0 bg-transparent"
                data-testid="button-new-group"
              >
                <Plus className="w-3 h-3" />
                New Group
              </button>
            )}
          </div>
        </aside>

        {/* ── Main content ── */}
        <div className="flex-1 min-w-0">
          {/* Filter tabs */}
          <div className="flex gap-0 border-b border-gray-200 mb-6">
            {(['all', 'active', 'completed'] as FilterType[]).map((key) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-4 py-2 text-sm capitalize border-0 bg-transparent transition-colors -mb-px ${
                  filter === key
                    ? 'text-primary font-medium border-b-2 border-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                style={{ borderBottom: filter === key ? '2px solid rgb(63,81,181)' : '2px solid transparent' }}
                data-testid={`button-filter-${key}`}
              >
                {key}
              </button>
            ))}
          </div>

          {/* Tasks table */}
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-card rounded p-4 animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="text-center py-12" data-testid="empty-state">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-16 h-16 mx-auto text-muted-foreground opacity-50">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
              </svg>
              <h3 className="text-lg font-medium text-foreground mt-4">No tasks found</h3>
              <p className="text-muted-foreground mt-2">
                {selectedGroupId ? `No tasks in "${selectedGroupName}" yet.` : 'Get started by adding your first task!'}
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="table" data-testid="tasks-table">
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Title</th>
                    <th>Description</th>
                    <th><span className="d-flex align-items-center gap-1"><Tag style={{width:14,height:14}} /> Category</span></th>
                    <th><span className="d-flex align-items-center gap-1"><Calendar style={{width:14,height:14}} /> Deadline</span></th>
                    <th>Group</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.map((task) => {
                    const deadlineInfo = formatDeadline(task.deadline);
                    const isOverdue = task.deadline && !task.completed && new Date(task.deadline) < new Date();
                    const taskGroup = task.groupId ? groups.find((g) => g.id === task.groupId) : null;

                    return (
                      <tr
                        key={task.id}
                        className={task.completed ? 'task-completed' : isOverdue ? 'table-danger' : ''}
                        data-testid={`task-item-${task.id}`}
                      >
                        <td>
                          <input
                            type="checkbox"
                            className="task-checkbox"
                            checked={task.completed}
                            onChange={() => toggleTaskMutation.mutate({ id: task.id, completed: !task.completed })}
                            disabled={toggleTaskMutation.isPending}
                            data-testid={`checkbox-task-${task.id}`}
                          />
                        </td>
                        <td>
                          <span
                            className={`task-title ${task.completed ? 'text-decoration-line-through' : ''}`}
                            data-testid={`text-task-title-${task.id}`}
                          >
                            {task.title}
                          </span>
                        </td>
                        <td>
                          <span data-testid={`text-task-description-${task.id}`}>
                            {task.description || '-'}
                          </span>
                        </td>
                        <td data-testid={`text-task-category-${task.id}`}>
                          {task.category ? (
                            <span className={`badge px-2 py-1 rounded text-xs font-medium ${CATEGORY_COLORS[task.category] ?? 'bg-gray-100 text-gray-700'}`}>
                              {task.category}
                            </span>
                          ) : <span className="text-muted-foreground">-</span>}
                        </td>
                        <td data-testid={`text-task-deadline-${task.id}`}>
                          {deadlineInfo
                            ? <small className={deadlineInfo.style}>{deadlineInfo.label}</small>
                            : <span className="text-muted-foreground">-</span>}
                        </td>
                        <td data-testid={`text-task-group-${task.id}`}>
                          {taskGroup ? (
                            <span className="badge px-2 py-1 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                              {taskGroup.name}
                            </span>
                          ) : <span className="text-muted-foreground">-</span>}
                        </td>
                        <td>
                          <small data-testid={`text-task-time-${task.id}`}>{formatTime(task.createdAt)}</small>
                        </td>
                        <td>
                          <button
                            onClick={() => deleteTaskMutation.mutate(task.id)}
                            disabled={deleteTaskMutation.isPending}
                            className="bg-destructive text-destructive-foreground border-0 rounded px-3 py-1 text-sm font-medium hover:opacity-90 transition-opacity"
                            data-testid={`button-delete-task-${task.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <AddTaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        defaultGroupId={selectedGroupId}
      />
    </div>
  );
}
