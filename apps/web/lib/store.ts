import { create } from 'zustand';
import type { UserSession } from './types';

interface AuthState {
  user: UserSession | null;
  setUser: (user: UserSession | null) => void;
}

// Profile display only. Credentials and tokens stay on the server.
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}));
