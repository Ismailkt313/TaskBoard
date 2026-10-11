import type { Todo, TodoPriority } from "../types/todo";

const API_URL = `${import.meta.env.VITE_API_URL}/todos`;

export const getTodos = async (folderId?: string): Promise<Todo[]> => {
  const url = folderId ? `${API_URL}?folderId=${folderId}` : API_URL;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Failed to fetch todos");
  }

  return response.json();
};

export const createTodo = async (data: {
  title: string;
  priority: TodoPriority;
  folderId?: string;
  description?: string;
  dueDate?: string;
}): Promise<Todo> => {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    throw new Error("Failed to create todo");
  }

  return response.json();
};

export const createTodos = async (data: {
  titles: string[];
  priority: TodoPriority;
  folderId?: string;
  description?: string;
  dueDate?: string;
}): Promise<Todo[]> => {
  const response = await fetch(`${API_URL}/bulk`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    throw new Error("Failed to create todos");
  }

  return response.json();
};

export const updateTodo = async (
  id: string,
  data: Partial<
    Pick<
      Todo,
      "title" | "completed" | "priority" | "description" | "dueDate"
    >
  >
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

export const deleteCompletedTodos = async (
  folderId?: string
): Promise<{ deletedCount: number }> => {
  const url = folderId
    ? `${API_URL}/completed?folderId=${folderId}`
    : `${API_URL}/completed`;
  const response = await fetch(url, {
    method: "DELETE"
  });

  if (!response.ok) {
    throw new Error("Failed to delete completed todos");
  }

  return response.json();
};

export const bulkDeleteTodos = async (
  ids: string[]
): Promise<{ deletedCount: number }> => {
  const response = await fetch(`${API_URL}/bulk-delete`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ ids })
  });

  if (!response.ok) {
    throw new Error("Failed to delete todos");
  }

  return response.json();
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

// Subtask operations

export const addSubtask = async (
  todoId: string,
  title: string
): Promise<Todo> => {
  const response = await fetch(`${API_URL}/${todoId}/subtasks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ title })
  });

  if (!response.ok) {
    throw new Error("Failed to add subtask");
  }

  return response.json();
};

export const updateSubtask = async (
  todoId: string,
  subtaskId: string,
  data: { title?: string; completed?: boolean }
): Promise<Todo> => {
  const response = await fetch(
    `${API_URL}/${todoId}/subtasks/${subtaskId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    }
  );

  if (!response.ok) {
    throw new Error("Failed to update subtask");
  }

  return response.json();
};

export const deleteSubtask = async (
  todoId: string,
  subtaskId: string
): Promise<Todo> => {
  const response = await fetch(
    `${API_URL}/${todoId}/subtasks/${subtaskId}`,
    {
      method: "DELETE"
    }
  );

  if (!response.ok) {
    throw new Error("Failed to delete subtask");
  }

  return response.json();
};