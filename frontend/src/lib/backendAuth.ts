import { User } from '@/types';
import { apiRequest } from './api';

type AuthApiUser = Pick<User, 'id' | 'name' | 'email' | 'phone' | 'role'> & {
  verified?: boolean;
  walletBalance?: number;
};

type AuthApiResponse = {
  message: string;
  token?: string;
  user?: AuthApiUser;
};

export type RegisterPayload = {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: User['role'];
  otpId: string;
  otp: string;
};

export type LoginPayload = {
  identifier: string;
  password: string;
  otpId: string;
  otp: string;
};

function toUser(user?: AuthApiUser): User {
  if (!user) {
    throw new Error('User details missing in auth response');
  }

  const walletBalance = user.walletBalance ?? 0;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    verified: user.verified ?? true,
    walletBalance,
    wallet: { balance: walletBalance, principal: 0, profits: 0, refunds: 0, sip: 0 },
  };
}

export const backendAuthService = {
  async requestOtp(target: string): Promise<{ otpId: string; otp?: string; message: string }> {
    return apiRequest({
      url: '/api/auth/request-otp',
      method: 'POST',
      data: { target },
      withAuth: false,
    });
  },

  async verifyOtp(otpId: string, otp: string): Promise<{ message: string }> {
    return apiRequest({
      url: '/api/auth/verify-otp',
      method: 'POST',
      data: { otpId, otp },
      withAuth: false,
    });
  },

  async register(payload: RegisterPayload): Promise<{ message: string; token: string; user: User }> {
    const data = await apiRequest<AuthApiResponse>({
      url: '/api/auth/register',
      method: 'POST',
      data: payload,
      withAuth: false,
    });

    return {
      message: data.message,
      token: data.token || `token_${Date.now()}`,
      user: toUser(data.user),
    };
  },

  async login(payload: LoginPayload): Promise<{ message: string; token: string; user: User }> {
    const data = await apiRequest<AuthApiResponse>({
      url: '/api/auth/login',
      method: 'POST',
      data: payload,
      withAuth: false,
    });

    return {
      message: data.message,
      token: data.token || `token_${Date.now()}`,
      user: toUser(data.user),
    };
  },
};
