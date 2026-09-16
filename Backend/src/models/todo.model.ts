import mongoose, { Document, Schema } from "mongoose";

export type TodoPriority = "low" | "medium" | "high";

export interface ITodo extends Document {
  title: string;
  completed: boolean;
  priority: TodoPriority;
  order: number;
}

const todoSchema = new Schema<ITodo>(
  {
    title: {
      type: String,
      required: true,
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
    }
  },
  {
    timestamps: true
  }
);

export const Todo = mongoose.model<ITodo>("Todo", todoSchema);