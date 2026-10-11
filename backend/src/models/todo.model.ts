import mongoose, { Document, Schema, Types } from "mongoose";

export type TodoPriority = "low" | "medium" | "high";

export interface ISubtask {
  _id: Types.ObjectId;
  title: string;
  completed: boolean;
}

export interface ITodo extends Document {
  title: string;
  description: string;
  completed: boolean;
  priority: TodoPriority;
  order: number;
  folderId: Types.ObjectId | null;
  dueDate: Date | null;
  subtasks: ISubtask[];
  createdAt: Date;
  updatedAt: Date;
}

const subtaskSchema = new Schema<ISubtask>(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    completed: {
      type: Boolean,
      default: false
    }
  },
  {
    _id: true
  }
);

const todoSchema = new Schema<ITodo>(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      default: "",
      trim: true
    },
    completed: {
      type: Boolean,
      default: false
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium"
    },
    order: {
      type: Number,
      required: true
    },
    folderId: {
      type: Schema.Types.ObjectId,
      ref: "Folder",
      default: null
    },
    dueDate: {
      type: Date,
      default: null
    },
    subtasks: {
      type: [subtaskSchema],
      default: []
    }
  },
  {
    timestamps: true
  }
);

todoSchema.index({ folderId: 1, order: 1 });

export const Todo = mongoose.model<ITodo>("Todo", todoSchema);