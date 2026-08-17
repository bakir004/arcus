import { todos } from '@/database';

export type Todo = typeof todos.$inferSelect;
export type NewTodo = typeof todos.$inferInsert;
