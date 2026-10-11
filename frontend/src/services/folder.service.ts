import type { Folder } from "../types/todo";

const API_URL = `${import.meta.env.VITE_API_URL}/folders`;

export const getFolders = async (): Promise<Folder[]> => {
  const response = await fetch(API_URL);

  if (!response.ok) {
    throw new Error("Failed to fetch folders");
  }

  return response.json();
};

export const createFolder = async (name: string): Promise<Folder> => {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ name })
  });

  if (!response.ok) {
    throw new Error("Failed to create folder");
  }

  return response.json();
};

export const updateFolder = async (
  id: string,
  name: string
): Promise<Folder> => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ name })
  });

  if (!response.ok) {
    throw new Error("Failed to update folder");
  }

  return response.json();
};

export const deleteFolder = async (id: string): Promise<void> => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "DELETE"
  });

  if (!response.ok) {
    throw new Error("Failed to delete folder");
  }
};
