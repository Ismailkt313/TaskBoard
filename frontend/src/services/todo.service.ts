import {type Todo,type TodoPriority } from "../types/todo";

const API_URL = `${import.meta.env.VITE_API_URL}/todos`;

export const getTodos = async (): Promise<Todo[]> => {
  const response = await fetch(API_URL);

  if (!response.ok) {
    throw new Error("Failed to fetch todos");
  }

  return response.json();
};

export const createTodos = async (
  titles: string[],
  priority: TodoPriority
): Promise<Todo[]> => {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      titles,
      priority
    })
  });

  if (!response.ok) {
    throw new Error("Failed to create todos");
  }

  return response.json();
};

export const updateTodo = async (
  id: string,
  data: Partial<Pick<Todo, "title" | "completed" | "priority">>
): Promise<Todo> => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    throw new Error("Failed to update todo");
  }

  return response.json();
};

export const deleteTodo = async (id: string): Promise<void> => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "DELETE"
  });

  if (!response.ok) {
    throw new Error("Failed to delete todo");
  }
};

export const reorderTodos = async (
  todoId: string,
  targetIndex: number
): Promise<Todo[]> => {
  const response = await fetch(`${API_URL}/reorder/move`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      todoId,
      targetIndex
    })
  });

  if (!response.ok) {
    throw new Error("Failed to reorder todos");
  }

  return response.json();
};