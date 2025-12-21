import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  username: string;
  avatar?: string;
  email?: string;
  stats?: {
    totalScore: number;
    gamesPlayed: number;
    gamesWon: number;
    bestStreak: number;
    categoryStats?: {
      outline: { played: number; won: number };
      capital: { played: number; won: number };
      flag: { played: number; won: number };
    };
  };
}

interface AuthState {
  token: string | null;
  user: User | null;
  login: (token: string, user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      login: (token, user) => {
        localStorage.setItem('token', token);
        set({ token, user });
      },
      logout: () => {
        localStorage.removeItem('token');
        set({ token: null, user: null });
      },
    }),
    { name: 'auth-storage' }
  )
);