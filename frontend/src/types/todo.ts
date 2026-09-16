export type TodoPriority = "low" | "medium" | "high";

export interface Todo {
  _id: string;
  title: string;
  completed: boolean;
  priority: TodoPriority;
  order: number;
  createdAt: string;
  updatedAt: string;
}