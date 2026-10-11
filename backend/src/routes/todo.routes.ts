import { Router } from "express";
import {
  addSubtask,
  bulkDeleteTodos,
  createTodo,
  createTodos,
  deleteCompletedTodos,
  deleteSubtask,
  deleteTodo,
  getTodo,
  getTodos,
  reorderTodos,
  updateSubtask,
  updateTodo
} from "../controllers/todo.controller";

const router = Router();

router.get("/", getTodos);
router.post("/", createTodo);
router.post("/bulk", createTodos);
router.patch("/reorder/move", reorderTodos);
router.delete("/completed", deleteCompletedTodos);
router.post("/bulk-delete", bulkDeleteTodos);
router.get("/:id", getTodo);
router.patch("/:id", updateTodo);
router.delete("/:id", deleteTodo);

// Subtask routes
router.post("/:id/subtasks", addSubtask);
router.patch("/:id/subtasks/:subtaskId", updateSubtask);
router.delete("/:id/subtasks/:subtaskId", deleteSubtask);

export default router;