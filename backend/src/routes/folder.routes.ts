import { Router } from "express";
import {
  createFolder,
  deleteFolder,
  getFolders,
  updateFolder
} from "../controllers/folder.controller";

const router = Router();

router.get("/", getFolders);
router.post("/", createFolder);
router.patch("/:id", updateFolder);
router.delete("/:id", deleteFolder);

export default router;
