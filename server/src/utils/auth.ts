import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';

const SECRET = process.env.JWT_SECRET || 'supersecretkey';

export interface TokenPayload {
  userId: string;
  username: string;
}

export const signToken = (user: { _id: Types.ObjectId; username: string }) => {
  return jwt.sign({ userId: user._id, username: user.username }, SECRET, { expiresIn: '7d' });
};

export const verifyToken = (token: string): TokenPayload | null => {
  try {
    return jwt.verify(token, SECRET) as TokenPayload;
  } catch (err) {
    return null;
  }
};