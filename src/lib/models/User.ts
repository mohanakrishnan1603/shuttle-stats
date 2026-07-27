import mongoose, { Schema, models, model } from "mongoose";

export type UserRole = "admin" | "viewer";

export interface UserDoc extends mongoose.Document {
  username: string;
  passwordHash: string;
  role: UserRole;
  createdAt: Date;
}

const UserSchema = new Schema<UserDoc>({
  username: { type: String, required: true, unique: true, trim: true, lowercase: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ["admin", "viewer"], default: "admin" },
  createdAt: { type: Date, default: Date.now },
});

export const User = models.User || model<UserDoc>("User", UserSchema);
