import { Schema, model, Document, Types } from 'mongoose';

export interface ITask extends Document {
  meetingId: Types.ObjectId;
  userId: Types.ObjectId;
  task: string;
  assignedTo: string;
  deadline: string;
  status: 'todo' | 'in-progress' | 'done';
  createdAt: Date;
}

const taskSchema = new Schema<ITask>(
  {
    meetingId: {
      type: Schema.Types.ObjectId,
      ref: 'Meeting',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    task: {
      type: String,
      required: [true, 'Task content is required'],
      trim: true,
    },
    assignedTo: {
      type: String,
      default: 'Unassigned',
      trim: true,
    },
    deadline: {
      type: String,
      default: 'Not specified',
      trim: true,
    },
    status: {
      type: String,
      enum: ['todo', 'in-progress', 'done'],
      default: 'todo',
      index: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: true },
  }
);

export const Task = model<ITask>('Task', taskSchema);
