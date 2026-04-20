import { apiRequest } from "./api";
import { storage } from "./storage";

const ROLE_SIP_KEY = "agriinvest_role_sips_v2";

export type SipInterval = "DAILY" | "WEEKLY" | "FIFTEEN_DAYS" | "MONTHLY";
export type SipStatus = "ACTIVE" | "STOPPED" | "COMPLETED" | "PAUSED";

export interface SipPayload {
  userId: string;
  projectId: string;
  amount: number;
  role: string;
  tenureYears: number;
  goalLabel?: string;
  termsAccepted: boolean;
  interval: SipInterval;
  autoDebitEnabled?: boolean;
}

export interface SipRecord extends SipPayload {
  id?: string;
  status?: SipStatus;
  nextDebitDate?: string;
  startDate?: string;
  endDate?: string;
  createdAt?: string;
  updatedAt?: string;
  subscriptionId?: string;
  recurringReferenceId?: string;
  autoDebitEnabled?: boolean;
  provider?: string;
  expectedAnnualReturn?: number;
  estimatedMaturity?: number;
  autoDebitStatus?: string;
}

export interface RoleSipPlan {
  id: string;
  userId: string;
  role: string;
  monthlyAmount: number;
  tenureYears: number;
  goalLabel: string;
  termsAccepted: boolean;
  status: SipStatus;
  provider: string;
  expectedAnnualReturn: number;
  estimatedMaturity: number;
  createdAt: string;
  nextDebitDate: string;
  interval: SipInterval;
  autoDebitEnabled?: boolean;
  autoDebitStatus?: string;
}

export interface CreateRoleSipPlanInput {
  userId: string;
  role: string;
  monthlyAmount: number;
  tenureYears: number;
  goalLabel?: string;
  termsAccepted: boolean;
  interval?: SipInterval;
  autoDebitEnabled?: boolean;
}

export const SIP_TERMS = [
  "Minimum SIP amount is Rs. 50 for students, farmers, investors, and agri-partners.",
  "Supported auto-debit intervals are daily, weekly, every 15 days, and monthly.",
  "You can choose 1 year, 3 year, or 5 year SIP terms similar to popular UPI apps.",
  "Projected returns are indicative and depend on project payouts, profit cycles, and wallet credits.",
];

function nowIso() {
  return new Date().toISOString();
}

function makeId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function addInterval(date: Date, interval: SipInterval) {
  const next = new Date(date);
  switch (interval) {
    case "DAILY":
      next.setDate(next.getDate() + 1);
      break;
    case "WEEKLY":
      next.setDate(next.getDate() + 7);
      break;
    case "FIFTEEN_DAYS":
      next.setDate(next.getDate() + 15);
      break;
    case "MONTHLY":
    default:
      next.setMonth(next.getMonth() + 1);
      break;
  }
  return next;
}

function expectedAnnualReturnForRole(role: string) {
  switch ((role || "").toUpperCase()) {
    case "FARMER":
      return 11;
    case "AGRI_PARTNER":
      return 12;
    case "ADMIN":
      return 10;
    default:
      return 14;
  }
}

function estimateMaturity(amount: number, tenureYears: number, annualReturn: number, interval: SipInterval) {
  const periodsPerYear =
    interval === "DAILY" ? 365 : interval === "WEEKLY" ? 52 : interval === "FIFTEEN_DAYS" ? 24 : 12;
  const periods = tenureYears * periodsPerYear;
  const periodicRate = annualReturn / periodsPerYear / 100;

  if (!periodicRate) {
    return Math.round(amount * periods * 100) / 100;
  }

  const maturity =
    amount * ((Math.pow(1 + periodicRate, periods) - 1) / periodicRate) * (1 + periodicRate);
  return Math.round(maturity * 100) / 100;
}

function normalizeSipRecord(payload: Partial<SipRecord>): SipRecord {
  const nextDebitValue = payload.nextDebitDate ?? payload.startDate;
  return {
    userId: payload.userId || "",
    projectId: payload.projectId || "",
    amount: Number(payload.amount || 0),
    role: payload.role || "",
    tenureYears: Number(payload.tenureYears || 0),
    goalLabel: payload.goalLabel || "",
    termsAccepted: Boolean(payload.termsAccepted),
    interval: (payload.interval as SipInterval) || "MONTHLY",
    id: payload.id,
    status: (payload.status as SipStatus) || "ACTIVE",
    nextDebitDate: nextDebitValue ? new Date(nextDebitValue as any).toISOString() : "",
    startDate: payload.startDate ? new Date(payload.startDate as any).toISOString() : "",
    endDate: payload.endDate ? new Date(payload.endDate as any).toISOString() : "",
    createdAt: payload.createdAt ? new Date(payload.createdAt as any).toISOString() : payload.startDate ? new Date(payload.startDate as any).toISOString() : "",
    updatedAt: payload.updatedAt ? new Date(payload.updatedAt as any).toISOString() : "",
    subscriptionId: payload.subscriptionId || "",
    recurringReferenceId: payload.recurringReferenceId || "",
    autoDebitEnabled: payload.autoDebitEnabled ?? true,
    provider: payload.provider || "AgriInvest Secure SIP",
    expectedAnnualReturn: Number(payload.expectedAnnualReturn || 0),
    estimatedMaturity: Number(payload.estimatedMaturity || 0),
    autoDebitStatus: payload.autoDebitStatus || "",
  };
}

function rolePlanFromSipRecord(record: SipRecord): RoleSipPlan {
  const annualReturn = Number(record.expectedAnnualReturn || expectedAnnualReturnForRole(record.role));
  return {
    id: record.id || makeId("sip"),
    userId: record.userId,
    role: record.role,
    monthlyAmount: Number(record.amount || 0),
    tenureYears: Number(record.tenureYears || 1),
    goalLabel: record.goalLabel?.trim() || "Goal-based savings",
    termsAccepted: Boolean(record.termsAccepted),
    status: (record.status as SipStatus) || "ACTIVE",
    provider: record.provider || "AgriInvest Secure SIP",
    expectedAnnualReturn: annualReturn,
    estimatedMaturity: Number(
      record.estimatedMaturity ||
      estimateMaturity(Number(record.amount || 0), Number(record.tenureYears || 1), annualReturn, record.interval || "MONTHLY")
    ),
    createdAt: record.createdAt || nowIso(),
    nextDebitDate: record.nextDebitDate || addInterval(new Date(), record.interval || "MONTHLY").toISOString(),
    interval: record.interval || "MONTHLY",
    autoDebitEnabled: record.autoDebitEnabled ?? true,
    autoDebitStatus: record.autoDebitStatus || ((record.autoDebitEnabled ?? true) ? "SCHEDULED" : "DISABLED"),
  };
}

function listRoleSipPlansInternal() {
  return storage.getJSON<RoleSipPlan[]>(ROLE_SIP_KEY, []);
}

function saveRoleSipPlans(plans: RoleSipPlan[]) {
  storage.setJSON(ROLE_SIP_KEY, plans);
}

function replaceRoleSipPlansForUser(userId: string, plans: RoleSipPlan[]) {
  const others = listRoleSipPlansInternal().filter((plan) => plan.userId !== userId);
  saveRoleSipPlans([...plans, ...others]);
}

export async function createSip(payload: SipPayload): Promise<SipRecord> {
  const response = await apiRequest<SipRecord>({
    method: "POST",
    url: "/api/sips",
    data: payload,
  });

  return normalizeSipRecord(response);
}

export async function listSips(userId?: string): Promise<SipRecord[]> {
  const url = userId ? `/api/sips?userId=${encodeURIComponent(userId)}` : "/api/sips";
  const response = await apiRequest<SipRecord[]>({
    method: "GET",
    url,
  });

  return (response || []).map(normalizeSipRecord);
}

export async function stopSip(sipId: string): Promise<SipRecord> {
  const response = await apiRequest<SipRecord>({
    method: "POST",
    url: `/api/sips/${sipId}/stop`,
  });

  return normalizeSipRecord(response);
}

export async function syncRoleSipPlansFromBackend(userId: string): Promise<RoleSipPlan[]> {
  const records = await listSips(userId);
  const plans = records.map(rolePlanFromSipRecord);
  replaceRoleSipPlansForUser(userId, plans);
  return plans;
}

export function createRoleSipPlan(input: CreateRoleSipPlanInput): RoleSipPlan {
  const amount = Number(input.monthlyAmount || 0);
  const tenureYears = Number(input.tenureYears || 0);
  const interval = input.interval || "MONTHLY";
  const autoDebitEnabled = input.autoDebitEnabled ?? true;

  if (amount < 50) {
    throw new Error("Minimum SIP amount is Rs. 50.");
  }

  if (![1, 3, 5].includes(tenureYears)) {
    throw new Error("Choose a 1 year, 3 year, or 5 year SIP term.");
  }

  if (!input.termsAccepted) {
    throw new Error("Please accept the SIP terms and conditions.");
  }

  const createdAt = nowIso();
  const nextDebitDate = addInterval(new Date(), interval).toISOString();
  const expectedAnnualReturn = expectedAnnualReturnForRole(input.role);

  const plan: RoleSipPlan = {
    id: makeId("sip"),
    userId: input.userId,
    role: input.role,
    monthlyAmount: amount,
    tenureYears,
    goalLabel: input.goalLabel?.trim() || "Goal-based savings",
    termsAccepted: true,
    status: "ACTIVE",
    provider: "AgriInvest Secure SIP",
    expectedAnnualReturn,
    estimatedMaturity: estimateMaturity(amount, tenureYears, expectedAnnualReturn, interval),
    createdAt,
    nextDebitDate,
    interval,
    autoDebitEnabled,
    autoDebitStatus: autoDebitEnabled ? "SCHEDULED" : "DISABLED",
  };

  const existing = listRoleSipPlansInternal();
  saveRoleSipPlans([plan, ...existing]);

  void createSip({
    userId: input.userId,
    projectId: `wallet_sip_${input.userId}`,
    amount,
    role: input.role,
    tenureYears,
    goalLabel: plan.goalLabel,
    termsAccepted: true,
    interval,
    autoDebitEnabled,
  }).catch(() => {
    // Local SIP view should still work even if backend sync is temporarily unavailable.
  });

  return plan;
}

export function getUserSipPlans(userId?: string): RoleSipPlan[] {
  const allPlans = listRoleSipPlansInternal();
  if (!userId) {
    return allPlans;
  }

  return allPlans.filter((plan) => plan.userId === userId);
}
