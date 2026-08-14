import { Schema, model, Document, Types } from 'mongoose';

export interface IMeeting extends Document {
  userId: Types.ObjectId;
  title: string;
  audioUrl?: string;
  cloudinaryPublicId?: string;
  transcript: string;
  summary: string;
  decisions: string[];
  followUps: string[];
  status: 'processing' | 'completed' | 'failed';
  createdAt: Date;
}

const meetingSchema = new Schema<IMeeting>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Meeting title is required'],
      trim: true,
    },
    audioUrl: {
      type: String,
      default: '',
    },
    cloudinaryPublicId: {
      type: String,
      default: '',
    },
    transcript: {
      type: String,
      default: '',
    },
    summary: {
      type: String,
      default: '',
    },
    decisions: {
      type: [String],
      default: [],
    },
    followUps: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['processing', 'completed', 'failed'],
      default: 'processing',
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: true },
  }
);

export const Meeting = model<IMeeting>('Meeting', meetingSchema);
