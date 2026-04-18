import { Investment, Project } from '@/types';
import { storage } from './storage';

const KEY_PREFIX = 'agriinvest_investments_'; // per user

export function listInvestments(userId: string): any[] {
  return storage.getJSON<any[]>(`${KEY_PREFIX}${userId}`, []);
}

export function addInvestment(userId: string, investment: any) {
  const existing = listInvestments(userId);
  storage.setJSON(`${KEY_PREFIX}${userId}`, [investment, ...existing]);
}

export function exportInvestmentsCSV(investments: any[]): string {
  const headers = [
    'id','projectId','projectTitle','cropType','status','type','amount','expectedROI','expectedReturn','actualROI','createdAt'
  ];
  const rows = investments.map(i => headers.map(h => JSON.stringify(i?.[h] ?? '')).join(','));
  return [headers.join(','), ...rows].join('\n');
}
