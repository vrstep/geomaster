import { Schema, model, Document } from 'mongoose';

interface IPlayer {
  userId: Schema.Types.ObjectId;
  username: string;
  score: number;
}

export interface IRoom extends Document {
  code: string; // The 6-digit room ID
  hostId: Schema.Types.ObjectId;
  quizId: Schema.Types.ObjectId;
  status: 'WAITING' | 'PLAYING' | 'FINISHED';
  players: IPlayer[];
  currentQuestionIndex: number;
}

const roomSchema = new Schema<IRoom>({
  code: { type: String, required: true, unique: true },
  hostId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  quizId: { type: Schema.Types.ObjectId, ref: 'Quiz', required: true },
  status: { type: String, enum: ['WAITING', 'PLAYING', 'FINISHED'], default: 'WAITING' },
  players: [{
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    username: String,
    score: { type: Number, default: 0 }
  }],
  currentQuestionIndex: { type: Number, default: 0 }
}, { timestamps: true });

export const Room = model<IRoom>('Room', roomSchema);