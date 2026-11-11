// src/db/tasks.ts
import { db } from './index.ts';
import { tasks } from './schema.ts';
import { and, desc, eq } from 'drizzle-orm';

export interface TaskInput {
  title: string;
  date?: string | null;
  time?: string | null;
  category?: string;
  done?: boolean;
  priority?: string;
  notes?: string | null;
  isUndated?: boolean;
}

export async function getUserTasks(uid: string) {
  try {
    return await db
      .select()
      .from(tasks)
      .where(eq(tasks.userId, uid))
      .orderBy(desc(tasks.createdAt));
  } catch (error) {
    console.error('Error fetching tasks from Cloud SQL:', error);
    throw new Error('Database query failed for tasks.', { cause: error });
  }
}

export async function createTask(uid: string, data: TaskInput) {
  try {
    const [newTask] = await db
      .insert(tasks)
      .values({
        userId: uid,
        title: data.title,
        date: data.date || null,
        time: data.time || null,
        category: data.category || 'recordatorios',
        done: data.done ?? false,
        priority: data.priority || 'medium',
        notes: data.notes || null,
        isUndated: data.isUndated ?? (!data.date),
      })
      .returning();
    return newTask;
  } catch (error) {
    console.error('Error creating task in Cloud SQL:', error);
    throw new Error('Database insert failed for task.', { cause: error });
  }
}

export async function updateTask(uid: string, id: number, data: Partial<TaskInput>) {
  try {
    const [updated] = await db
      .update(tasks)
      .set({
        ...(data.title !== undefined && { title: data.title }),
        ...(data.date !== undefined && { date: data.date }),
        ...(data.time !== undefined && { time: data.time }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.done !== undefined && { done: data.done }),
        ...(data.priority !== undefined && { priority: data.priority }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.isUndated !== undefined && { isUndated: data.isUndated }),
      })
      .where(and(eq(tasks.id, id), eq(tasks.userId, uid)))
      .returning();
    return updated;
  } catch (error) {
    console.error('Error updating task in Cloud SQL:', error);
    throw new Error('Database update failed for task.', { cause: error });
  }
}

export async function deleteTask(uid: string, id: number) {
  try {
    const [deleted] = await db
      .delete(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.userId, uid)))
      .returning();
    return deleted;
  } catch (error) {
    console.error('Error deleting task in Cloud SQL:', error);
    throw new Error('Database delete failed for task.', { cause: error });
  }
}
