import mongoose, { Schema, models, model } from "mongoose";

export interface PlayerDoc extends mongoose.Document {
  name: string;
  email?: string;
  mobile?: string;
  createdAt: Date;
}

const PlayerSchema = new Schema<PlayerDoc>({
  name: { type: String, required: true, trim: true },
  email: { type: String, trim: true },
  mobile: { type: String, trim: true },
  createdAt: { type: Date, default: Date.now },
});

export const Player = models.Player || model<PlayerDoc>("Player", PlayerSchema);
