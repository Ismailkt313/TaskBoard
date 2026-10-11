import mongoose, { Document, Schema } from "mongoose";

export interface IFolder extends Document {
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

const folderSchema = new Schema<IFolder>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    }
  },
  {
    timestamps: true
  }
);

export const Folder = mongoose.model<IFolder>("Folder", folderSchema);
