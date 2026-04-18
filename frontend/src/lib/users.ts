import { User, UserRole } from '@/types';
import { authService } from './auth';
import { storage } from './storage';

export interface StoredUser extends User {
  passwordHash?: string;
}

const USERS_KEY = 'agriinvest_users_v1';

function hashPassword(pw: string): string {
  // Lightweight hash for demo-only. Replace with backend hashing.
  let h = 0;
  for (let i = 0; i < pw.length; i++) h = (h * 31 + pw.charCodeAt(i)) >>> 0;
  return `h_${h}`;
}

export const userService = {
  list(): StoredUser[] {
    return storage.getJSON<StoredUser[]>(USERS_KEY, []);
  },

  findByEmailOrPhone(email: string, phone: string): StoredUser | undefined {
    return this.list().find(u => u.email.toLowerCase() === email.toLowerCase() || u.phone === phone);
  },

  getById(id: string): User | undefined {
    const found = this.list().find(u => u.id === id);
    if (!found) return undefined;
    const { passwordHash, ...user } = found;
    return user;
  },

  upsertUser(user: User, passwordHash?: string) {
    const users = this.list();
    const idx = users.findIndex(u => u.id === user.id);
    const next: StoredUser = idx >= 0
      ? { ...users[idx], ...user }
      : { ...user };

    if (passwordHash !== undefined) {
      next.passwordHash = passwordHash;
    }

    if (idx >= 0) {
      users[idx] = next;
      storage.setJSON(USERS_KEY, users);
    } else {
      storage.setJSON(USERS_KEY, [...users, next]);
    }

    const currentUser = authService.getCurrentUser();
    if (currentUser?.id === user.id) {
      authService.updateUser({ ...currentUser, ...user });
    }
  },

  register(params: { name: string; email: string; phone: string; password: string; role: UserRole }): { ok: true; user: User } | { ok: false; error: string } {
    const existing = this.findByEmailOrPhone(params.email, params.phone);
    if (existing) {
      const which = existing.email.toLowerCase() === params.email.toLowerCase() && existing.phone === params.phone
        ? 'Email and phone'
        : existing.email.toLowerCase() === params.email.toLowerCase()
          ? 'Email'
          : 'Phone number';
      return { ok: false, error: `${which} already exist. Please sign in.` };
    }

    const user: User = {
      id: `user_${Date.now()}`,
      name: params.name,
      email: params.email,
      phone: params.phone,
      role: params.role,
      verified: true,
      walletBalance: 0,
      wallet: { balance: 0, principal: 0, profits: 0, refunds: 0, sip: 0 }
    };

    const stored: StoredUser = { ...user, passwordHash: hashPassword(params.password) };
    const users = this.list();
    storage.setJSON(USERS_KEY, [...users, stored]);

    return { ok: true, user };
  },

  login(params: { phoneOrEmail: string; password: string }): { ok: true; user: User } | { ok: false; error: string } {
    const users = this.list();
    const key = params.phoneOrEmail.trim().toLowerCase();
    const found = users.find(u => u.email.toLowerCase() === key || u.phone === params.phoneOrEmail.trim());
    if (!found) return { ok: false, error: 'Username, email or phone number incorrect.' };
    if (!found.passwordHash || found.passwordHash !== hashPassword(params.password)) {
      return { ok: false, error: 'Password incorrect.' };
    }

    const { passwordHash, ...user } = found;
    return { ok: true, user };
  },

  updateUser(user: User) {
    this.upsertUser(user);
  }
};
