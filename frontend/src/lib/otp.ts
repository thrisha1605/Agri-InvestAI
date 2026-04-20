import { storage } from './storage';

const OTP_KEY_PREFIX = 'agriinvest_otp_'; // per phone/email

export function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function sendOtp(target: string): string {
  const otp = generateOtp();
  storage.setJSON(`${OTP_KEY_PREFIX}${target}`, { otp, createdAt: Date.now() });
  return otp;
}

export function verifyOtp(target: string, otp: string): boolean {
  const record = storage.getJSON<{ otp: string; createdAt: number } | null>(`${OTP_KEY_PREFIX}${target}`, null);
  if (!record) return false;
  // 5 minutes expiry
  const isValid = record.otp === otp && Date.now() - record.createdAt <= 5 * 60 * 1000;
  return isValid;
}
