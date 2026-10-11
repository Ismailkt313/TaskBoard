import { Request, Response } from "express";
import { Todo } from "../models/todo.model";
import { Folder } from "../models/folder.model";
import mongoose from "mongoose";

export const getTodos = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { folderId } = req.query;

    const filter: Record<string, unknown> = {};

    if (folderId) {
      if (!mongoose.Types.ObjectId.isValid(folderId as string)) {
        res.status(400).json({
          message: "Invalid folder ID"
        });
        return;
      }
      filter.folderId = folderId;
    }

    const todos = await Todo.find(filter).sort({
      createdAt: -1
    });

    res.status(200).json(todos);
  } catch {
    res.status(500).json({
      message: "Failed to fetch todos"
    });
  }
};

export const getTodo = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const todo = await Todo.findById(req.params.id);

    if (!todo) {
      res.status(404).json({
        message: "Todo not found"
      });
      return;
    }

    res.status(200).json(todo);
  } catch {
    res.status(500).json({
      message: "Failed to fetch todo"
    });
  }
};

export const createTodo = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { title, priority = "medium", folderId, description, dueDate } =
      req.body;

    if (!title || typeof title !== "string" || !title.trim()) {
      res.status(400).json({
        message: "Title is required"
      });
      return;
    }

    if (!["low", "medium", "high"].includes(priority)) {
      res.status(400).json({
        message: "Invalid priority"
      });
      return;
    }

    if (folderId) {
      if (!mongoose.Types.ObjectId.isValid(folderId)) {
        res.status(400).json({
          message: "Invalid folder ID"
        });
        return;
      }

      const folderExists = await Folder.findById(folderId);
      if (!folderExists) {
        res.status(404).json({
          message: "Folder not found"
        });
        return;
      }
    }

    const firstTodo = await Todo.findOne({
      folderId: folderId || null
    }).sort({ order: 1 });

    const order = firstTodo ? firstTodo.order - 1 : 0;

    const todo = await Todo.create({
      title: title.trim(),
      description: description?.trim() || "",
      completed: false,
      priority,
      order,
      folderId: folderId || null,
      dueDate: dueDate || null,
      subtasks: []
    });

    res.status(201).json(todo);
  } catch {
    res.status(500).json({
      message: "Failed to create todo"
    });
  }
};

// Keep backward-compatible bulk create
export const createTodos = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { titles, priority = "medium", folderId, description, dueDate } = req.body;

    if (!Array.isArray(titles) || titles.length === 0) {
      res.status(400).json({
        message: "At least one title is required"
      });
      return;
    }

    if (!["low", "medium", "high"].includes(priority)) {
      res.status(400).json({
        message: "Invalid priority"
      });
      return;
    }

    if (folderId) {
      if (!mongoose.Types.ObjectId.isValid(folderId)) {
        res.status(400).json({
          message: "Invalid folder ID"
        });
        return;
      }

      const folderExists = await Folder.findById(folderId);
      if (!folderExists) {
        res.status(404).json({
          message: "Folder not found"
        });
        return;
      }
    }

    const cleanedTitles = titles
      .filter((title): title is string => typeof title === "string")
      .map((title) => title.trim())
      .filter(Boolean);

    if (cleanedTitles.length === 0) {
      res.status(400).json({
        message: "At least one valid title is required"
      });
      return;
    }

    const firstTodo = await Todo.findOne({
      folderId: folderId || null
    }).sort({ order: 1 });
    const startOrder = firstTodo ? firstTodo.order - cleanedTitles.length : 0;

    const todos = await Todo.insertMany(
      cleanedTitles.map((title, index) => ({
        title,
        description: description?.trim() || "",
        completed: false,
        priority,
        order: startOrder + index,
        folderId: folderId || null,
        dueDate: dueDate || null,
        subtasks: []
      }))
    );

    res.status(201).json(todos);
  } catch {
    res.status(500).json({
      message: "Failed to create todos"
    });
  }
};

export const updateTodo = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { title, completed, priority, description, dueDate } = req.body;

    if (
      priority !== undefined &&
      !["low", "medium", "high"].includes(priority)
    ) {
      res.status(400).json({
        message: "Invalid priority"
      });
      return;
    }

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (completed !== undefined) updateData.completed = completed;
    if (priority !== undefined) updateData.priority = priority;
    if (description !== undefined) updateData.description = description;
    if (dueDate !== undefined) updateData.dueDate = dueDate;

    const todo = await Todo.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    });

    if (!todo) {
      res.status(404).json({
        message: "Todo not found"
      });
      return;
    }

    res.status(200).json(todo);
  } catch {
    res.status(500).json({
      message: "Failed to update todo"
    });
  }
};

export const deleteTodo = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const todo = await Todo.findByIdAndDelete(req.params.id);

    if (!todo) {
      res.status(404).json({
        message: "Todo not found"
      });
      return;
    }

    res.status(204).send();
  } catch {
    res.status(500).json({
      message: "Failed to delete todo"
    });
  }
};

export const deleteCompletedTodos = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { folderId } = req.query;
    const filter: Record<string, unknown> = { completed: true };

    if (folderId) {
      if (folderId === "none") {
        filter.folderId = null;
      } else if (mongoose.Types.ObjectId.isValid(folderId as string)) {
        filter.folderId = folderId;
      } else {
        res.status(400).json({
          message: "Invalid folder ID"
        });
        return;
      }
    }

    const result = await Todo.deleteMany(filter);
    res.status(200).json({
      message: "Completed todos deleted successfully",
      deletedCount: result.deletedCount
    });
  } catch {
    res.status(500).json({
      message: "Failed to delete completed todos"
    });
  }
};

export const bulkDeleteTodos = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({
        message: "Array of task IDs is required"
      });
      return;
    }

    const validIds = ids.filter((id) => mongoose.Types.ObjectId.isValid(id));
    if (validIds.length === 0) {
      res.status(400).json({
        message: "No valid task IDs provided"
      });
      return;
    }

    const result = await Todo.deleteMany({ _id: { $in: validIds } });
    res.status(200).json({
      message: "Tasks deleted successfully",
      deletedCount: result.deletedCount
    });
  } catch {
    res.status(500).json({
      message: "Failed to delete tasks"
    });
  }
};

export const reorderTodos = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { todoId, targetIndex } = req.body;

    if (!todoId || typeof targetIndex !== "number") {
      res.status(400).json({
        message: "todoId and targetIndex are required"
      });
      return;
    }

    const draggedTodo = await Todo.findById(todoId);
    if (!draggedTodo) {
      res.status(404).json({
        message: "Todo not found"
      });
      return;
    }

    const todos = await Todo.find({
      folderId: draggedTodo.folderId
    }).sort({ order: 1, createdAt: -1 });

    const currentIndex = todos.findIndex(
      (todo) => todo._id.toString() === todoId
    );

    if (currentIndex === -1) {
      res.status(404).json({
        message: "Todo not found"
      });
      return;
    }

    const [movedTodo] = todos.splice(currentIndex, 1);

    const safeIndex = Math.max(
      0,
      Math.min(targetIndex, todos.length)
    );

    todos.splice(safeIndex, 0, movedTodo);

    await Promise.all(
      todos.map((todo, index) =>
        Todo.findByIdAndUpdate(todo._id, {
          order: index
        })
      )
    );

    const updatedTodos = await Todo.find({
      folderId: draggedTodo.folderId
    }).sort({ order: 1 });

    res.status(200).json(updatedTodos);
  } catch {
    res.status(500).json({
      message: "Failed to reorder todos"
    });
  }
};

// ========== Subtask operations ==========

export const addSubtask = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { title } = req.body;

    if (!title || typeof title !== "string" || !title.trim()) {
      res.status(400).json({
        message: "Subtask title is required"
      });
      return;
    }

    const todo = await Todo.findById(req.params.id);

    if (!todo) {
      res.status(404).json({
        message: "Todo not found"
      });
      return;
    }

    todo.subtasks.push({
      title: title.trim(),
      completed: false
    } as never);

    await todo.save();

    res.status(201).json(todo);
  } catch {
    res.status(500).json({
      message: "Failed to add subtask"
    });
  }
};

export const updateSubtask = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id, subtaskId } = req.params;
    const { title, completed } = req.body;

    const todo = await Todo.findById(id);

    if (!todo) {
      res.status(404).json({
        message: "Todo not found"
      });
      return;
    }

    const subtask = todo.subtasks.find(
      (s) => s._id.toString() === subtaskId
    );

    if (!subtask) {
      res.status(404).json({
        message: "Subtask not found"
      });
      return;
    }

    if (title !== undefined) subtask.title = title.trim();
    if (completed !== undefined) subtask.completed = completed;

    await todo.save();

    res.status(200).json(todo);
  } catch {
    res.status(500).json({
      message: "Failed to update subtask"
    });
  }
};

export const deleteSubtask = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id, subtaskId } = req.params;

    const todo = await Todo.findById(id);

    if (!todo) {
      res.status(404).json({
        message: "Todo not found"
      });
      return;
    }

    const subtaskIndex = todo.subtasks.findIndex(
      (s) => s._id.toString() === subtaskId
    );

    if (subtaskIndex === -1) {
      res.status(404).json({
        message: "Subtask not found"
      });
      return;
    }

    todo.subtasks.splice(subtaskIndex, 1);
    await todo.save();

    res.status(200).json(todo);
  } catch {
    res.status(500).json({
      message: "Failed to delete subtask"
    });
  }
};