export type TodoPriority = "low" | "medium" | "high";

export interface Subtask {
  _id: string;
  title: string;
  completed: boolean;
}

export interface Todo {
  _id: string;
  title: string;
  description: string;
  completed: boolean;
  priority: TodoPriority;
  order: number;
  folderId: string | null;
  dueDate: string | null;
  subtasks: Subtask[];
  createdAt: string;
  updatedAt: string;
}

export interface Folder {
  _id: string;
  name: string;
  taskCount: number;
  createdAt: string;
  updatedAt: string;
}