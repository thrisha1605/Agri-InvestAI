export type UserRole = 'FARMER' | 'INVESTOR' | 'AGRI_PARTNER' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  verified: boolean;
  walletBalance: number;
  wallet?: WalletState;
}

export interface Project {
  id: string;
  farmerId: string;
  farmerName: string;
  title: string;
  description: string;
  location: string;
  state: string;
  cropType: string;
  acreage: number;
  fundingGoal: number;
  fundedAmount: number;
  timeline: string;
  status: 'PENDING' | 'APPROVED' | 'LIVE' | 'FUNDED' | 'COMPLETED' | 'CLOSED';
  esgScore: number;
  riskScore: number;
  expectedYield: number;
  expectedROI: number;
  images: string[];
  tags: string[];
  soilType: string;
  irrigationType: string;
  createdAt: string;
  approvedAt?: string;
}

export interface Investment {
  id: string;
  investorId: string;
  projectId: string;
  amount: number;
  type: 'ONETIME' | 'SIP';
  status: 'CREATED' | 'VERIFIED' | 'FAILED' | 'REFUNDED';
  paymentId: string;
  createdAt: string;
}

export interface CropPrediction {
  id: string;
  userId: string;
  soilPH: number;
  rainfall: number;
  temperature: number;
  humidity: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  recommendedCrop: string;
  confidence: number;
  alternativeCrops: string[];
  createdAt: string;
}

export interface DiseaseDetection {
  id: string;
  userId: string;
  imageUrl: string;
  detectedDisease: string;
  confidence: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  treatment: string;
  createdAt: string;
}

export interface SIPPlan {
  id: string;
  investorId: string;
  projectId: string;
  monthlyAmount: number;
  duration: number;
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';
  nextPaymentDate: string;
  totalPaid: number;
  createdAt: string;
}

export interface Settlement {
  id: string;
  projectId: string;
  revenue: number;
  expenses: number;
  netProfit: number;
  distributedProfit: number;
  status: 'PENDING' | 'DISTRIBUTED' | 'COMPLETED';
  createdAt: string;
}

export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  transactions: WalletTransaction[];
}

export interface WalletTransaction {
  id: string;
  type: 'PRINCIPAL' | 'PROFIT' | 'REFUND' | 'WITHDRAWAL';
  amount: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
  description: string;
}


export interface WalletState {
  balance: number;
  principal: number;
  profits: number;
  refunds: number;
  sip: number;
}

export type WalletTxnType =
  | 'ADD_MONEY'
  | 'INVESTMENT'
  | 'PROFIT_CREDIT'
  | 'REFUND'
  | 'SIP_DEBIT'
  | 'SALARY_CREDIT'
  | 'WITHDRAWAL_REQUEST'
  | 'WITHDRAWAL_SETTLED';

export interface WalletTransaction {
  id: string;
  userId: string;
  type: WalletTxnType;
  amount: number; // positive for credit, negative for debit
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  note?: string;
  refId?: string; // orderId/paymentId/investmentId
  createdAt: string;
  meta?: Record<string, any>;
}

export interface ProjectMilestone {
  id: string;
  projectId: string;
  name: 'PLANTING' | 'IRRIGATION' | 'FERTILIZATION' | 'PEST_CONTROL' | 'HARVEST';
  status: 'PENDING' | 'IN_PROGRESS' | 'DONE';
  targetDate?: string;
  completedAt?: string;
  notes?: string;
  photos?: { id: string; url: string; caption?: string; createdAt: string }[];
  expenses?: { id: string; label: string; amount: number; date: string }[];
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  text?: string;
  fileUrl?: string;
  createdAt: string;
}
