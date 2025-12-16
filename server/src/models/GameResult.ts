import { Schema, model, Document } from 'mongoose';

export interface IGameResult extends Document {
  roomId: Schema.Types.ObjectId;
  winnerId: Schema.Types.ObjectId;
  scores: { username: string; score: number }[];
  playedAt: Date;
}

const gameResultSchema = new Schema<IGameResult>({
  roomId: { type: Schema.Types.ObjectId, ref: 'Room' },
  winnerId: { type: Schema.Types.ObjectId, ref: 'User' },
  scores: [{ username: String, score: Number }],
  playedAt: { type: Date, default: Date.now }
});

export const GameResult = model<IGameResult>('GameResult', gameResultSchema);