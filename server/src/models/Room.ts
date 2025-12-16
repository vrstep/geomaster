import { Schema, model, Document, Types } from 'mongoose';

// 1. Define the Question Schema (Embedded)
const questionSchema = new Schema({
  questionText: { type: String, required: true },
  imageUrl: String,
  options: [{ type: String, required: true }],
  correctAnswer: { type: String, required: true }
});

export interface IPlayer {
  userId: Types.ObjectId;
  username: string;
  avatar?: string;
  score: number;
  isReady: boolean;
  hasAnsweredCurrent: boolean;
  streak: number;
}

// 2. Update Interface to match embedded data
export interface IRoom extends Document {
  code: string;
  hostId: Types.ObjectId;
  config: {
    mode: 'SINGLE' | 'MULTI';
    type: 'CAPITALS' | 'FLAGS' | 'BORDERS';
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    region?: string;
    isRanked: boolean;
  };
  // CHANGED: Now stores full objects, not IDs
  questions: {
    questionText: string;
    imageUrl?: string;
    options: string[];
    correctAnswer: string;
  }[];
  status: 'WAITING' | 'PLAYING' | 'FINISHED';
  players: IPlayer[];
  currentQuestionIndex: number;
  roundStartTime?: Date;
}

const roomSchema = new Schema<IRoom>({
  code: { type: String, required: true, unique: true },
  hostId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  config: {
    mode: { type: String, default: 'MULTI' },
    type: { type: String, required: true },
    difficulty: { type: String, default: 'MEDIUM' },
    region: String,
    isRanked: { type: Boolean, default: false }
  },
  // CHANGED: Use the embedded schema
  questions: [questionSchema], 
  status: { type: String, enum: ['WAITING', 'PLAYING', 'FINISHED'], default: 'WAITING' },
  players: [{
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    username: String,
    avatar: String,
    score: { type: Number, default: 0 },
    isReady: { type: Boolean, default: false },
    hasAnsweredCurrent: { type: Boolean, default: false },
    streak: { type: Number, default: 0 }
  }],
  currentQuestionIndex: { type: Number, default: 0 },
  roundStartTime: Date
}, { timestamps: true });

export const Room = model<IRoom>('Room', roomSchema);