// src/db/schema.ts
import { relations } from 'drizzle-orm';
import { boolean, doublePrecision, integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

// Users table linked to Firebase Auth UID
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  displayName: text('display_name'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Tasks table
export const tasks = pgTable('tasks', {
  id: serial('id').primaryKey(),
  userId: text('user_id').references(() => users.uid).notNull(),
  title: text('title').notNull(),
  date: text('date'), // Format: YYYY-MM-DD or null for undated
  time: text('time'), // Format: HH:MM
  category: text('category').notNull().default('recordatorios'),
  done: boolean('done').notNull().default(false),
  priority: text('priority').notNull().default('medium'),
  notes: text('notes'),
  isUndated: boolean('is_undated').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

// Habits table
export const habits = pgTable('habits', {
  id: serial('id').primaryKey(),
  userId: text('user_id').references(() => users.uid).notNull(),
  name: text('name').notNull(),
  icon: text('icon').notNull().default('🎯'),
  category: text('category').notNull().default('personal'),
  targetDays: integer('target_days').notNull().default(7),
  streak: integer('streak').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

// Habit completion logs
export const habitLogs = pgTable('habit_logs', {
  id: serial('id').primaryKey(),
  habitId: integer('habit_id').references(() => habits.id).notNull(),
  date: text('date').notNull(), // Format: YYYY-MM-DD
  completed: boolean('completed').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// Personal Finances table
export const finances = pgTable('finances', {
  id: serial('id').primaryKey(),
  userId: text('user_id').references(() => users.uid).notNull(),
  type: text('type').notNull(), // 'income' | 'expense'
  amount: doublePrecision('amount').notNull(),
  category: text('category').notNull(),
  concept: text('concept').notNull(),
  date: text('date').notNull(), // Format: YYYY-MM-DD
  createdAt: timestamp('created_at').defaultNow(),
});

// Shopping list items table
export const shoppingItems = pgTable('shopping_items', {
  id: serial('id').primaryKey(),
  userId: text('user_id').references(() => users.uid).notNull(),
  name: text('name').notNull(),
  category: text('category').notNull().default('general'),
  quantity: text('quantity').notNull().default('1'),
  bought: boolean('bought').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  tasks: many(tasks),
  habits: many(habits),
  finances: many(finances),
  shoppingItems: many(shoppingItems),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  user: one(users, {
    fields: [tasks.userId],
    references: [users.uid],
  }),
}));

export const habitsRelations = relations(habits, ({ one, many }) => ({
  user: one(users, {
    fields: [habits.userId],
    references: [users.uid],
  }),
  logs: many(habitLogs),
}));

export const habitLogsRelations = relations(habitLogs, ({ one }) => ({
  habit: one(habits, {
    fields: [habitLogs.habitId],
    references: [habits.id],
  }),
}));

export const financesRelations = relations(finances, ({ one }) => ({
  user: one(users, {
    fields: [finances.userId],
    references: [users.uid],
  }),
}));

export const shoppingItemsRelations = relations(shoppingItems, ({ one }) => ({
  user: one(users, {
    fields: [shoppingItems.userId],
    references: [users.uid],
  }),
}));
