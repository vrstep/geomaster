import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
  username: string;
  email: string;
  passwordHash: string;
  avatar?: string;
  stats: {
    gamesPlayed: number;
    gamesWon: number;
    totalScore: number;
    bestStreak: number;
    categoryStats: {
      outline: { played: number; won: number };
      capital: { played: number; won: number };
      flag: { played: number; won: number };
    };
  };
}

const userSchema = new Schema<IUser>({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  avatar: { type: String, default: 'default_avatar.png' },
  stats: {
    gamesPlayed: { type: Number, default: 0 },
    gamesWon: { type: Number, default: 0 },
    totalScore: { type: Number, default: 0 },
    bestStreak: { type: Number, default: 0 },
    categoryStats: {
      outline: { played: { type: Number, default: 0 }, won: { type: Number, default: 0 } },
      capital: { played: { type: Number, default: 0 }, won: { type: Number, default: 0 } },
      flag: { played: { type: Number, default: 0 }, won: { type: Number, default: 0 } }
    }
  }
}, { timestamps: true });

export const User = model<IUser>('User', userSchema);