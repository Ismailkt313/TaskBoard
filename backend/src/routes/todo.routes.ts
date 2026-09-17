import { Router } from "express";
import {
  createTodos,
  deleteTodo,
  getTodo,
  getTodos,
  reorderTodos,
  updateTodo
} from "../controllers/todo.controller";

const router = Router();

router.get("/", getTodos);
router.post("/", createTodos);
router.patch("/reorder/move", reorderTodos);
router.get("/:id", getTodo);
router.patch("/:id", updateTodo);
router.delete("/:id", deleteTodo);

export default router;