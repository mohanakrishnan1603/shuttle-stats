import mongoose, { Schema, models, model } from "mongoose";

export interface UserDoc extends mongoose.Document {
  username: string;
  passwordHash: string;
  createdAt: Date;
}

const UserSchema = new Schema<UserDoc>({
  username: { type: String, required: true, unique: true, trim: true, lowercase: true },
  passwordHash: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export const User = models.User || model<UserDoc>("User", UserSchema);
