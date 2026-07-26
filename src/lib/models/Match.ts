import mongoose, { Schema, models, model } from "mongoose";

export interface MatchDoc extends mongoose.Document {
  date: Date;
  teamA: mongoose.Types.ObjectId[];
  teamB: mongoose.Types.ObjectId[];
  winner: "A" | "B";
  createdAt: Date;
}

const MatchSchema = new Schema<MatchDoc>({
  date: { type: Date, default: Date.now },
  teamA: {
    type: [{ type: Schema.Types.ObjectId, ref: "Player" }],
    required: true,
    validate: {
      validator: (v: unknown[]) => v.length === 2,
      message: "teamA must have exactly 2 players",
    },
  },
  teamB: {
    type: [{ type: Schema.Types.ObjectId, ref: "Player" }],
    required: true,
    validate: {
      validator: (v: unknown[]) => v.length === 2,
      message: "teamB must have exactly 2 players",
    },
  },
  winner: { type: String, enum: ["A", "B"], required: true },
  createdAt: { type: Date, default: Date.now },
});

export const Match = models.Match || model<MatchDoc>("Match", MatchSchema);
