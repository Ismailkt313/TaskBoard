import { Request, Response } from "express";
import { Folder } from "../models/folder.model";
import { Todo } from "../models/todo.model";

export const getFolders = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const folders = await Folder.find().sort({ createdAt: 1 });

    const folderIds = folders.map((f) => f._id);
    const counts = await Todo.aggregate([
      { $match: { folderId: { $in: folderIds } } },
      { $group: { _id: "$folderId", count: { $sum: 1 } } }
    ]);

    const countMap = new Map(
      counts.map((c: { _id: string; count: number }) => [
        c._id.toString(),
        c.count
      ])
    );

    const result = folders.map((folder) => ({
      _id: folder._id,
      name: folder.name,
      createdAt: folder.createdAt,
      updatedAt: folder.updatedAt,
      taskCount: countMap.get(folder._id.toString()) || 0
    }));

    res.status(200).json(result);
  } catch {
    res.status(500).json({
      message: "Failed to fetch folders"
    });
  }
};

export const createFolder = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name } = req.body;

    if (!name || typeof name !== "string" || !name.trim()) {
      res.status(400).json({
        message: "Folder name is required"
      });
      return;
    }

    const folder = await Folder.create({ name: name.trim() });

    res.status(201).json({
      ...folder.toObject(),
      taskCount: 0
    });
  } catch {
    res.status(500).json({
      message: "Failed to create folder"
    });
  }
};

export const updateFolder = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name } = req.body;

    if (!name || typeof name !== "string" || !name.trim()) {
      res.status(400).json({
        message: "Folder name is required"
      });
      return;
    }

    const folder = await Folder.findByIdAndUpdate(
      req.params.id,
      { name: name.trim() },
      { new: true, runValidators: true }
    );

    if (!folder) {
      res.status(404).json({
        message: "Folder not found"
      });
      return;
    }

    const taskCount = await Todo.countDocuments({
      folderId: folder._id
    });

    res.status(200).json({
      ...folder.toObject(),
      taskCount
    });
  } catch {
    res.status(500).json({
      message: "Failed to update folder"
    });
  }
};

export const deleteFolder = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const folder = await Folder.findById(req.params.id);

    if (!folder) {
      res.status(404).json({
        message: "Folder not found"
      });
      return;
    }

    // Delete all todos in the folder
    await Todo.deleteMany({ folderId: folder._id });
    await Folder.findByIdAndDelete(folder._id);

    res.status(204).send();
  } catch {
    res.status(500).json({
      message: "Failed to delete folder"
    });
  }
};
