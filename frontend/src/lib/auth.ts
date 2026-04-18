import { User } from '@/types';

const AUTH_KEY = 'agriinvest_auth';
const USER_KEY = 'agriinvest_user';

export const authService = {
  isAuthenticated(): boolean {
    return !!localStorage.getItem(AUTH_KEY);
  },

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem(USER_KEY);
    if (!userStr) return null;

    try {
      const parsed = JSON.parse(userStr);
      if (!parsed || typeof parsed !== 'object' || !('id' in parsed) || !('role' in parsed)) {
        this.logout();
        return null;
      }
      return parsed as User;
    } catch {
      this.logout();
      return null;
    }
  },

  login(user: User, token: string): void {
    localStorage.setItem(AUTH_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  logout(): void {
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(USER_KEY);
  },

  updateUser(user: User): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  getToken(): string | null {
    return localStorage.getItem(AUTH_KEY);
  }
};
