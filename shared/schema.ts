import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const CATEGORIES = ["Work", "Personal", "Shopping", "Health", "Other"] as const;
export type Category = typeof CATEGORIES[number];

// Quadrant definitions
export const QUADRANTS = {
  1: { label: "Do First",  description: "Important + Urgent",     color: "red"    },
  2: { label: "Schedule",  description: "Important + Not Urgent", color: "blue"   },
  3: { label: "Delegate",  description: "Not Important + Urgent", color: "yellow" },
  4: { label: "Don't Do",  description: "Not Important + Not Urgent", color: "gray" },
} as const;
export type QuadrantId = 1 | 2 | 3 | 4;

// Groups table
export const groups = pgTable("groups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertGroupSchema = createInsertSchema(groups).omit({ id: true, createdAt: true });
export type InsertGroup = z.infer<typeof insertGroupSchema>;
export type Group = typeof groups.$inferSelect;

// Tasks table
export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").default(""),
  completed: boolean("completed").notNull().default(false),
  category: text("category").default(""),
  deadline: timestamp("deadline"),
  groupId: varchar("group_id"),
  quadrant: integer("quadrant"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertTaskSchema = createInsertSchema(tasks)
  .omit({ id: true, createdAt: true })
  .extend({
    deadline: z.string().nullable().optional(),
    groupId: z.string().nullable().optional(),
    quadrant: z.number().int().min(1).max(4).nullable().optional(),
  });

export const updateTaskSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  completed: z.boolean().optional(),
  category: z.string().optional(),
  deadline: z.string().nullable().optional(),
  groupId: z.string().nullable().optional(),
  quadrant: z.number().int().min(1).max(4).nullable().optional(),
});

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type UpdateTask = z.infer<typeof updateTaskSchema>;
export type Task = typeof tasks.$inferSelect;
