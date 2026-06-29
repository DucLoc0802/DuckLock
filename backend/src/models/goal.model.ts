import { Schema, model, Document } from 'mongoose';

export interface IGoal extends Document {
  text: string;
  createdAt: Date;
}

const GoalSchema = new Schema<IGoal>(
  {
    text: {
      type: String,
      required: [true, 'Please add a goal text value'],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export default model<IGoal>('Goal', GoalSchema);
