import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiClient } from '../services/userAxiosInstance';

interface AuthState {
  isAuthenticated: boolean
  email: string | null
  setAuth: (auth: boolean, email?: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: !!localStorage.getItem('accessToken'),
      email: localStorage.getItem('userEmail'),
      
      setAuth: (auth, email) => {
        const updates: Partial<AuthState> = { isAuthenticated: auth }
        if (email) {
          updates.email = email
          localStorage.setItem('userEmail', email)
        }
        set(updates)
      },

      logout: async() => {
        await apiClient.post('/logout')
        localStorage.removeItem('auth-store');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('userEmail');
        set({ isAuthenticated: false, email: null })
      },
    }),
    {
      name: 'auth-store',
    }
  )
)
