import { create } from 'zustand';
import type { UserSession } from './types';

interface AuthState {
  token: string | null;
  user: UserSession | null;
  setSession: (token: string, user: UserSession) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  setSession: (token, user) => set({ token, user }),
  logout: () => set({ token: null, user: null }),
}));
