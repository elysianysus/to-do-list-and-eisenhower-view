import { type Task, type InsertTask, type UpdateTask, type Group, type InsertGroup } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getGroups(): Promise<Group[]>;
  getGroup(id: string): Promise<Group | undefined>;
  createGroup(group: InsertGroup): Promise<Group>;
  deleteGroup(id: string): Promise<boolean>;

  getTasks(groupId?: string | null): Promise<Task[]>;
  getTask(id: string): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, updates: UpdateTask): Promise<Task | undefined>;
  deleteTask(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private tasks: Map<string, Task>;
  private groups: Map<string, Group>;

  constructor() {
    this.tasks = new Map();
    this.groups = new Map();
  }

  async getGroups(): Promise<Group[]> {
    return Array.from(this.groups.values()).sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }

  async getGroup(id: string): Promise<Group | undefined> {
    return this.groups.get(id);
  }

  async createGroup(insertGroup: InsertGroup): Promise<Group> {
    const id = randomUUID();
    const group: Group = {
      ...insertGroup,
      description: insertGroup.description ?? "",
      id,
      createdAt: new Date(),
    };
    this.groups.set(id, group);
    return group;
  }

  async deleteGroup(id: string): Promise<boolean> {
    if (!this.groups.has(id)) return false;
    for (const [taskId, task] of this.tasks) {
      if (task.groupId === id) {
        this.tasks.set(taskId, { ...task, groupId: null });
      }
    }
    return this.groups.delete(id);
  }

  async getTasks(groupId?: string | null): Promise<Task[]> {
    let all = Array.from(this.tasks.values());
    if (groupId !== undefined && groupId !== null) {
      all = all.filter((t) => t.groupId === groupId);
    }
    return all.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getTask(id: string): Promise<Task | undefined> {
    return this.tasks.get(id);
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = randomUUID();
    const task: Task = {
      ...insertTask,
      description: insertTask.description ?? "",
      completed: insertTask.completed ?? false,
      category: insertTask.category ?? "",
      deadline: insertTask.deadline ? new Date(insertTask.deadline as unknown as string) : null,
      groupId: insertTask.groupId ?? null,
      quadrant: insertTask.quadrant ?? null,
      id,
      createdAt: new Date(),
    };
    this.tasks.set(id, task);
    return task;
  }

  async updateTask(id: string, updates: UpdateTask): Promise<Task | undefined> {
    const existing = this.tasks.get(id);
    if (!existing) return undefined;

    const updatedTask: Task = {
      ...existing,
      ...updates,
      deadline:
        updates.deadline !== undefined
          ? updates.deadline ? new Date(updates.deadline) : null
          : existing.deadline,
      groupId: updates.groupId !== undefined ? updates.groupId ?? null : existing.groupId,
      quadrant: updates.quadrant !== undefined ? updates.quadrant ?? null : existing.quadrant,
    };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }

  async deleteTask(id: string): Promise<boolean> {
    return this.tasks.delete(id);
  }
}

export const storage = new MemStorage();
