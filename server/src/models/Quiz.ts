import { Schema, model, Document } from 'mongoose';

export interface IQuestion {
  questionText: string;
  imageUrl?: string; 
  options: string[];
  correctAnswer: string;
}

export interface IQuiz extends Document {
  title: string;
  type: 'CAPITALS' | 'FLAGS' | 'BORDERS';
  questions: IQuestion[];
  createdBy: Schema.Types.ObjectId;
}

const quizSchema = new Schema<IQuiz>({
  title: { type: String, required: true },
  type: { type: String, enum: ['CAPITALS', 'FLAGS', 'BORDERS'], required: true },
  questions: [{
    questionText: { type: String, required: true },
    imageUrl: String,
    options: [{ type: String, required: true }],
    correctAnswer: { type: String, required: true }
  }],
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export const Quiz = model<IQuiz>('Quiz', quizSchema);