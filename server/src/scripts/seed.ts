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
    await User.deleteMany({});
    console.log('🧹 Cleared existing data.');

    // 2. Create 3 Test Users
    const users = await User.create([
      {
        username: 'GeoMaster',
        email: 'geomaster@test.com',
        passwordHash: 'password123',
        avatar: 'avatar1.png',
        stats: {
          gamesPlayed: 15,
          gamesWon: 8,
          totalScore: 12500,
          bestStreak: 7,
          categoryStats: {
            outline: { played: 5, won: 2 },
            capital: { played: 7, won: 4 },
            flag: { played: 3, won: 2 }
          }
        }
      },
      {
        username: 'QuizWhiz',
        email: 'quizwhiz@test.com',
        passwordHash: 'password123',
        avatar: 'avatar2.png',
        stats: {
          gamesPlayed: 10,
          gamesWon: 5,
          totalScore: 8900,
          bestStreak: 5,
          categoryStats: {
            outline: { played: 3, won: 1 },
            capital: { played: 5, won: 3 },
            flag: { played: 2, won: 1 }
          }
        }
      },
      {
        username: 'MapExplorer',
        email: 'mapexplorer@test.com',
        passwordHash: 'password123',
        avatar: 'avatar3.png',
        stats: {
          gamesPlayed: 8,
          gamesWon: 3,
          totalScore: 6200,
          bestStreak: 4,
          categoryStats: {
            outline: { played: 4, won: 2 },
            capital: { played: 3, won: 1 },
            flag: { played: 1, won: 0 }
          }
        }
      }
    ]);
    console.log('✅ Created 3 test users');

    // 3. Create Capitals Quiz with 10 questions
    const capitalsQuiz = new Quiz({
      title: 'World Capitals',
      type: 'CAPITALS',
      questions: [
        {
          questionText: 'What is the capital of France?',
          imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Paris_Night.jpg/640px-Paris_Night.jpg',
          options: ['Berlin', 'Madrid', 'Paris', 'Rome'],
          correctAnswer: 'Paris'
        },
        {
          questionText: 'What is the capital of Japan?',
          options: ['Seoul', 'Beijing', 'Tokyo', 'Bangkok'],
          correctAnswer: 'Tokyo'
        },
        {
          questionText: 'What is the capital of Australia?',
          options: ['Sydney', 'Melbourne', 'Canberra', 'Brisbane'],
          correctAnswer: 'Canberra'
        },
        {
          questionText: 'What is the capital of Brazil?',
          options: ['Rio de Janeiro', 'São Paulo', 'Brasília', 'Salvador'],
          correctAnswer: 'Brasília'
        },
        {
          questionText: 'What is the capital of Canada?',
          options: ['Toronto', 'Vancouver', 'Montreal', 'Ottawa'],
          correctAnswer: 'Ottawa'
        },
        {
          questionText: 'What is the capital of Egypt?',
          options: ['Cairo', 'Alexandria', 'Giza', 'Luxor'],
          correctAnswer: 'Cairo'
        },
        {
          questionText: 'What is the capital of Germany?',
          options: ['Munich', 'Hamburg', 'Berlin', 'Frankfurt'],
          correctAnswer: 'Berlin'
        },
        {
          questionText: 'What is the capital of India?',
          options: ['Mumbai', 'New Delhi', 'Bangalore', 'Kolkata'],
          correctAnswer: 'New Delhi'
        },
        {
          questionText: 'What is the capital of South Korea?',
          options: ['Busan', 'Seoul', 'Incheon', 'Daegu'],
          correctAnswer: 'Seoul'
        },
        {
          questionText: 'What is the capital of Turkey?',
          options: ['Istanbul', 'Ankara', 'Izmir', 'Bursa'],
          correctAnswer: 'Ankara'
        }
      ]
    });

    // 4. Create Flags Quiz with 10 questions
    const flagsQuiz = new Quiz({
      title: 'World Flags',
      type: 'FLAGS',
      questions: [
        {
          questionText: 'Which country does this flag belong to?',
          imageUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/a/a4/Flag_of_the_United_States.svg/640px-Flag_of_the_United_States.svg.png',
          options: ['USA', 'Liberia', 'Malaysia', 'Chile'],
          correctAnswer: 'USA'
        },
        {
          questionText: 'Which country does this flag belong to?',
          imageUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/c/c3/Flag_of_France.svg/640px-Flag_of_France.svg.png',
          options: ['Netherlands', 'France', 'Russia', 'Luxembourg'],
          correctAnswer: 'France'
        },
        {
          questionText: 'Which country does this flag belong to?',
          imageUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/9/9e/Flag_of_Japan.svg/640px-Flag_of_Japan.svg.png',
          options: ['South Korea', 'China', 'Japan', 'Bangladesh'],
          correctAnswer: 'Japan'
        },
        {
          questionText: 'Which country does this flag belong to?',
          imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/Flag_of_Germany.svg/640px-Flag_of_Germany.svg.png',
          options: ['Belgium', 'Germany', 'Austria', 'Netherlands'],
          correctAnswer: 'Germany'
        },
        {
          questionText: 'Which country does this flag belong to?',
          imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Flag_of_the_People%27s_Republic_of_China.svg/640px-Flag_of_the_People%27s_Republic_of_China.svg.png',
          options: ['Vietnam', 'China', 'North Korea', 'Myanmar'],
          correctAnswer: 'China'
        },
        {
          questionText: 'Which country does this flag belong to?',
          imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Flag_of_Brazil.svg/640px-Flag_of_Brazil.svg.png',
          options: ['Portugal', 'Brazil', 'Cape Verde', 'Mozambique'],
          correctAnswer: 'Brazil'
        },
        {
          questionText: 'Which country does this flag belong to?',
          imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/Flag_of_Canada_%28Pantone%29.svg/640px-Flag_of_Canada_%28Pantone%29.svg.png',
          options: ['Canada', 'Peru', 'Austria', 'Lebanon'],
          correctAnswer: 'Canada'
        },
        {
          questionText: 'Which country does this flag belong to?',
          imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Flag_of_India.svg/640px-Flag_of_India.svg.png',
          options: ['Ireland', 'Italy', 'India', 'Mexico'],
          correctAnswer: 'India'
        },
        {
          questionText: 'Which country does this flag belong to?',
          imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Flag_of_Australia.svg/640px-Flag_of_Australia.svg.png',
          options: ['New Zealand', 'Australia', 'Fiji', 'United Kingdom'],
          correctAnswer: 'Australia'
        },
        {
          questionText: 'Which country does this flag belong to?',
          imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Flag_of_Russia.svg/640px-Flag_of_Russia.svg.png',
          options: ['Slovenia', 'Slovakia', 'Russia', 'Serbia'],
          correctAnswer: 'Russia'
        }
      ]
    });

    // 5. Create Borders Quiz with 10 questions
    const bordersQuiz = new Quiz({
      title: 'Country Borders',
      type: 'BORDERS',
      questions: [
        {
          questionText: 'Which country does this outline belong to?',
          imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Italy_location_map.svg/640px-Italy_location_map.svg.png',
          options: ['Greece', 'Spain', 'Italy', 'Croatia'],
          correctAnswer: 'Italy'
        },
        {
          questionText: 'Which country does this outline belong to?',
          options: ['Thailand', 'Vietnam', 'Myanmar', 'Laos'],
          correctAnswer: 'Thailand'
        },
        {
          questionText: 'Which country does this outline belong to?',
          options: ['Argentina', 'Chile', 'Peru', 'Colombia'],
          correctAnswer: 'Chile'
        },
        {
          questionText: 'Which country does this outline belong to?',
          options: ['Sweden', 'Finland', 'Norway', 'Denmark'],
          correctAnswer: 'Norway'
        },
        {
          questionText: 'Which country does this outline belong to?',
          options: ['Egypt', 'Sudan', 'Libya', 'Algeria'],
          correctAnswer: 'Egypt'
        },
        {
          questionText: 'Which country does this outline belong to?',
          options: ['South Africa', 'Nigeria', 'Kenya', 'Ethiopia'],
          correctAnswer: 'South Africa'
        },
        {
          questionText: 'Which country does this outline belong to?',
          options: ['Turkey', 'Iran', 'Iraq', 'Saudi Arabia'],
          correctAnswer: 'Turkey'
        },
        {
          questionText: 'Which country does this outline belong to?',
          options: ['Indonesia', 'Philippines', 'Malaysia', 'Papua New Guinea'],
          correctAnswer: 'Indonesia'
        },
        {
          questionText: 'Which country does this outline belong to?',
          options: ['Poland', 'Ukraine', 'Romania', 'Hungary'],
          correctAnswer: 'Poland'
        },
        {
          questionText: 'Which country does this outline belong to?',
          options: ['Mexico', 'Colombia', 'Venezuela', 'Peru'],
          correctAnswer: 'Mexico'
        }
      ]
    });

    await Quiz.insertMany([capitalsQuiz, flagsQuiz, bordersQuiz]);
    console.log('✅ Database seeded with 3 quizzes (10 questions each)!');
    
    console.log('\n📊 Summary:');
    console.log(`- Users created: ${users.length}`);
    console.log('- Quizzes created: 3 (CAPITALS, FLAGS, BORDERS)');
    console.log('- Questions per quiz: 10');
    console.log('\n🔐 Test credentials:');
    console.log('Email: geomaster@test.com | Password: password123');
    console.log('Email: quizwhiz@test.com | Password: password123');
    console.log('Email: mapexplorer@test.com | Password: password123');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
};

seedData();