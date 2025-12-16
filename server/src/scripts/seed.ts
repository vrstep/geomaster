import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Quiz } from '../models/Quiz.js';
import { User } from '../models/User.js';
import { Room } from '../models/Room.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://admin:password123@mongo:27017/geomaster?authSource=admin';

const seedData = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('🌱 Connected to MongoDB for seeding...');

    // 1. Clear existing data
    await Quiz.deleteMany({});
    await Room.deleteMany({});
    await User.deleteMany({}); // Optional: Clear users if you want a fresh start
    console.log('🧹 Cleared existing Quizzes and Rooms.');

    // 2. Create Capitals Quiz
    const capitalsQuiz = new Quiz({
      title: 'World Capitals',
      type: 'CAPITALS',
      questions: [
        {
          questionText: 'What is the capital of France?',
          imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Paris_Night.jpg/1024px-Paris_Night.jpg',
          options: ['Berlin', 'Madrid', 'Paris', 'Rome'],
          correctAnswer: 'Paris'
        },
        {
          questionText: 'What is the capital of Japan?',
          options: ['Seoul', 'Beijing', 'Tokyo', 'Bangkok'],
          correctAnswer: 'Tokyo'
        },
        // Add more questions as needed to reach 10
      ]
    });

    // 3. Create Flags Quiz
    const flagsQuiz = new Quiz({
      title: 'World Flags',
      type: 'FLAGS',
      questions: [
        {
          questionText: 'Which country does this flag belong to?',
          imageUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/a/a4/Flag_of_the_United_States.svg/1200px-Flag_of_the_United_States.svg.png',
          options: ['USA', 'UK', 'Liberia', 'Malaysia'],
          correctAnswer: 'USA'
        }
      ]
    });

    await Quiz.insertMany([capitalsQuiz, flagsQuiz]);
    console.log('✅ Database seeded with Quizzes!');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
};

seedData();