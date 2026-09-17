import { Request, Response } from "express";
import { Todo } from "../models/todo.model";

export const getTodos = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const todos = await Todo.find().sort({ order: 1, createdAt: -1 });

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

export const createTodos = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { titles, priority = "medium" } = req.body;

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

    const lastTodo = await Todo.findOne().sort({ order: -1 });
    const startOrder = lastTodo ? lastTodo.order + 1 : 0;

    const todos = await Todo.insertMany(
      cleanedTitles.map((title, index) => ({
        title,
        completed: false,
        priority,
        order: startOrder + index
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
    const { title, completed, priority } = req.body;

    if (
      priority !== undefined &&
      !["low", "medium", "high"].includes(priority)
    ) {
      res.status(400).json({
        message: "Invalid priority"
      });
      return;
    }

    const todo = await Todo.findByIdAndUpdate(
      req.params.id,
      {
        ...(title !== undefined && { title }),
        ...(completed !== undefined && { completed }),
        ...(priority !== undefined && { priority })
      },
      {
        new: true,
        runValidators: true
      }
    );

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

    const todos = await Todo.find().sort({ order: 1, createdAt: -1 });

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

    const updatedTodos = await Todo.find().sort({ order: 1 });

    res.status(200).json(updatedTodos);
  } catch {
    res.status(500).json({
      message: "Failed to reorder todos"
    });
  }
};