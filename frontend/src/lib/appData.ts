import type { User } from "../types";
import { apiRequest, buildQuery } from "./api";
import { authService } from "./auth";
import {
  approveWorkerRequest as approveWorkerRequestApi,
  createWorkerRequest,
  getAdminWorkerRequestDetails as getAdminWorkerRequestDetailsApi,
  listAdminWorkerRequests as listAdminWorkerRequestsApi,
  listPartnerWorkerRequests as listPartnerWorkerRequestsApi,
  WorkerProjectRequest,
  WorkerRequestStatus,
  rejectWorkerRequest as rejectWorkerRequestApi,
} from "./partnerProfile";
import { getPartnerProfile } from "./partnerProfile";
import { storage } from "./storage";
import { getWallet, walletService } from "./wallet";
import { userService } from "./users";

const PROJECTS_KEY = "agriinvest_projects_v4";
const INVESTMENTS_KEY = "agriinvest_all_investments_v4";
const INVESTMENTS_BY_USER_PREFIX = "agriinvest_investments_user_v4_";
const PROGRESS_KEY = "agriinvest_progress_v4";
const WITHDRAWALS_KEY = "agriinvest_withdrawals_v4";
const PARTNER_REQUESTS_KEY = "agriinvest_partner_requests_v4";
const PARTNER_SALARIES_KEY = "agriinvest_partner_salaries_v4";
const INVESTOR_RETURNS_KEY = "agriinvest_investor_returns_v4";
const SETTLEMENTS_KEY = "agriinvest_settlements_v4";
const COMPLETED_DEMO_PROJECT_ID = "demo-completed-vineyard-2026";
const DEMO_PROJECT_IMAGE_URLS = [
  "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1500651230702-0e2d8a49d4ad?auto=format&fit=crop&w=1200&q=80",
];

export type { WorkerProjectRequest, WorkerRequestStatus } from "./partnerProfile";
export type FarmerWithdrawalStatus = "REQUESTED" | "DISBURSED" | "REJECTED";

export interface MilestoneItem {
  key: string;
  title: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED";
  notes?: string;
  image?: string;
  updatedAt?: string;
}

export interface AppProject {
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
  fundingPercent: number;
  timeline: string;
  soilType: string;
  irrigationType: string;
  expectedRevenue: number;
  estimatedExpenses: number;
  expectedROI: number;
  expectedYield: number;
  esgScore: number;
  approvalStage: string;
  approvalStatus: string;
  projectStatus: string;
  status: string;
  progress: number;
  currentStage: string;
  helperNeeded: boolean;
  workerRequestStatus: string;
  workerRequestReason?: string;
  workerRequestCount: number;
  helperRequestStatus: string;
  monthlySalary: number;
  assignedPartnerId?: string;
  assignedPartnerName?: string;
  completionRequested?: boolean;
  rejectionReason?: string;
  adminRemarks?: string;
  images: string[];
  tags: string[];
  documents: any[];
  progressPhotos: any[];
  milestones: MilestoneItem[];
  createdAt: string;
  [key: string]: any;
}

export interface AppInvestment {
  id: string;
  investorId: string;
  investorName: string;
  projectId: string;
  projectTitle: string;
  farmerId?: string;
  farmerName?: string;
  amount: number;
  type: string;
  status: string;
  paymentMethod?: string;
  paymentId?: string;
  transactionId?: string;
  paymentStatus?: string;
  expectedROI?: number;
  expectedReturn?: number;
  actualROI?: number | null;
  actualReturn?: number | null;
  cropType?: string;
  timeline?: string;
  createdAt: string;
  [key: string]: any;
}

export interface ProjectProgressUpdate {
  id: string;
  projectId: string;
  farmerId: string;
  milestoneKey: string;
  stage: string;
  title?: string;
  progress: number;
  notes: string;
  image?: string;
  visibleToInvestor?: boolean;
  visibleToPartner?: boolean;
  visibleToAdmin?: boolean;
  cropHealth?: string;
  proofName?: string;
  date?: string;
  createdAt: string;
  status?: string;
}

export interface FarmerWithdrawal {
  id: string;
  projectId: string;
  projectTitle?: string;
  farmerId: string;
  farmerName?: string;
  milestoneKey: string;
  amount: number;
  reason: string;
  status: string;
  proofImage?: string;
  adminRemark?: string;
  payoutReference?: string;
  createdAt: string;
  reviewedAt?: string;
}

export interface PartnerSalaryRecord {
  id: string;
  projectId: string;
  partnerId: string;
  partnerName: string;
  amount: number;
  month: string;
  status: string;
  payoutReference?: string;
  createdAt: string;
}

export interface InvestorReturnRecord {
  id: string;
  projectId: string;
  investorId: string;
  investorName: string;
  investedAmount: number;
  returnAmount: number;
  status: string;
  payoutReference?: string;
  createdAt: string;
}

type SettlementSummary = {
  projectId: string;
  totalProfit: number;
  platformFee: number;
  totalPartnerSalary: number;
  investorPool: number;
  farmerShare: number;
  monthsWorked: number;
};

const PROJECT_MILESTONES: Array<{ key: string; title: string }> = [
  { key: "LAND_PREPARATION", title: "Land Preparation" },
  { key: "SEED_SELECTION", title: "Seed Selection" },
  { key: "SOWING_PLANTING", title: "Sowing / Planting" },
  { key: "IRRIGATION_SETUP", title: "Irrigation Setup" },
  { key: "FERTILIZATION", title: "Fertilization" },
  { key: "PEST_DISEASE_CONTROL", title: "Pest / Disease Control" },
  { key: "CROP_GROWTH", title: "Crop Growth Monitoring" },
  { key: "HARVESTING", title: "Harvesting" },
  { key: "STORAGE_DISTRIBUTION", title: "Storage / Distribution" },
  { key: "SALE_COMPLETED", title: "Sale Completed" },
  { key: "PROFIT_CALCULATION", title: "Profit Calculation" },
];

function nowIso() {
  return new Date().toISOString();
}

function makeId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function roundMoney(value: number) {
  return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
}

function toNumber(value: any, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function deepProjectSource(payload: any) {
  if (!payload || typeof payload !== "object") return {};
  const attributes = payload.attributes && typeof payload.attributes === "object" ? payload.attributes : {};
  return { ...attributes, ...payload };
}

function deriveApprovalStage(status: string) {
  switch ((status || "").toUpperCase()) {
    case "REJECTED":
      return "REJECTED";
    case "VERIFIED":
      return "VERIFIED";
    case "APPROVED":
    case "LIVE":
    case "FUNDED":
    case "COMPLETED":
      return "APPROVED";
    default:
      return "SENT_FOR_APPROVAL";
  }
}

function deriveProjectStatus(status: string) {
  switch ((status || "").toUpperCase()) {
    case "COMPLETED":
      return "COMPLETED";
    case "FUNDED":
      return "READY_TO_START";
    case "LIVE":
      return "OPEN_FOR_FUNDING";
    case "IN_PROGRESS":
    case "HARVESTING":
    case "SALE_COMPLETED":
    case "PROFIT_CALCULATED":
      return status.toUpperCase();
    default:
      return "NOT_STARTED";
  }
}

function normalizeMilestones(input: any): MilestoneItem[] {
  const existing = Array.isArray(input) ? input : [];
  const map = new Map<string, any>();
  existing.forEach((item) => {
    if (item?.key) map.set(String(item.key), item);
  });

  return PROJECT_MILESTONES.map((milestone) => {
    const stored = map.get(milestone.key) || {};
    return {
      key: milestone.key,
      title: stored.title || milestone.title,
      status: stored.status || "PENDING",
      notes: stored.notes || "",
      image: stored.image || "",
      updatedAt: stored.updatedAt || "",
    };
  });
}

function normalizeProject(payload: any): AppProject {
  const raw = deepProjectSource(payload);
  const fundingGoal = toNumber(raw.fundingGoal ?? raw.targetAmount);
  const fundedAmount = toNumber(raw.fundedAmount ?? raw.raisedAmount ?? raw.investorTotalAmount);
  const approvalStage = String(
    raw.approvalStage ||
      (raw.approvalStatus === "PENDING" ? "SENT_FOR_APPROVAL" : raw.approvalStatus) ||
      deriveApprovalStage(raw.status)
  );
  const projectStatus = String(raw.projectStatus || deriveProjectStatus(raw.status));
  const milestones = normalizeMilestones(raw.milestones);
  const progress =
    raw.progress !== undefined
      ? toNumber(raw.progress)
      : milestones.length
        ? Math.round((milestones.filter((item) => item.status === "COMPLETED").length / milestones.length) * 100)
        : 0;

  return {
    ...raw,
    id: String(raw.id || makeId("project")),
    farmerId: String(raw.farmerId || ""),
    farmerName: String(raw.farmerName || ""),
    title: String(raw.title || "Untitled Project"),
    description: String(raw.description || ""),
    location: String(raw.location || ""),
    state: String(raw.state || ""),
    cropType: String(raw.cropType || ""),
    acreage: toNumber(raw.acreage),
    fundingGoal,
    fundedAmount,
    fundingPercent: raw.fundingPercent !== undefined ? toNumber(raw.fundingPercent) : fundingGoal > 0 ? Math.round((fundedAmount / fundingGoal) * 100) : 0,
    timeline: String(raw.timeline || ""),
    soilType: String(raw.soilType || ""),
    irrigationType: String(raw.irrigationType || ""),
    expectedRevenue: toNumber(raw.expectedRevenue),
    estimatedExpenses: toNumber(raw.estimatedExpenses ?? raw.expectedExpenses ?? fundingGoal),
    expectedROI: toNumber(raw.expectedROI),
    expectedYield: toNumber(raw.expectedYield),
    esgScore: toNumber(raw.esgScore ?? raw.esg),
    approvalStage,
    approvalStatus: String(raw.approvalStatus || (approvalStage === "SENT_FOR_APPROVAL" ? "PENDING" : approvalStage)),
    projectStatus,
    status: String(raw.status || projectStatus),
    progress,
    currentStage: String(raw.currentStage || ""),
    helperNeeded: Boolean(raw.helperNeeded),
    workerRequestStatus: String(raw.workerRequestStatus || "OPEN"),
    workerRequestReason: String(raw.workerRequestReason || ""),
    workerRequestCount: toNumber(raw.workerRequestCount),
    helperRequestStatus: String(raw.helperRequestStatus || (raw.helperNeeded ? "OPEN" : "CLOSED")),
    monthlySalary: toNumber(raw.monthlySalary ?? raw.monthlyPartnerSalary),
    assignedPartnerId: raw.assignedPartnerId ? String(raw.assignedPartnerId) : "",
    assignedPartnerName: raw.assignedPartnerName ? String(raw.assignedPartnerName) : "",
    completionRequested: Boolean(raw.completionRequested),
    rejectionReason: raw.rejectionReason ? String(raw.rejectionReason) : "",
    adminRemarks: raw.adminRemarks ? String(raw.adminRemarks) : "",
    images: Array.isArray(raw.images)
      ? raw.images
          .map((img: any) => {
            if (!img) return null;
            if (typeof img === "string") return img;
            if (typeof img === "object") return img.imageUrl || img.url || null;
            return null;
          })
          .filter((img: any): img is string => typeof img === "string" && img.trim().length > 0)
      : [],
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    documents: Array.isArray(raw.documents) ? raw.documents : [],
    progressPhotos: Array.isArray(raw.progressPhotos) ? raw.progressPhotos : [],
    milestones,
    createdAt: String(raw.createdAt || nowIso()),
  };
}

function buildCompletedDemoProject(): AppProject {
  return normalizeProject({
    id: COMPLETED_DEMO_PROJECT_ID,
    farmerId: "demo_farmer_mahesh",
    farmerName: "Mahesh Reddy",
    title: "Completed Premium Grape Harvest - Nandi Hills Block A",
    description:
      "A fully completed 6-acre premium grape cultivation project with drip irrigation, field supervision, verified harvest sale, and investor settlement already distributed. This demo listing shows a realistic completed project state for admin, investor, and farmer review.",
    location: "Nandi Hills",
    state: "Karnataka",
    cropType: "Grapes",
    acreage: 6,
    fundingGoal: 850000,
    fundedAmount: 850000,
    fundingPercent: 100,
    timeline: "Sep 2025 - Mar 2026",
    soilType: "Red Loam",
    irrigationType: "Drip Irrigation",
    expectedRevenue: 1280000,
    estimatedExpenses: 850000,
    expectedROI: 23,
    expectedYield: 108,
    esgScore: 84,
    riskLevel: "LOW",
    approvalStage: "APPROVED",
    approvalStatus: "APPROVED",
    projectStatus: "COMPLETED",
    status: "COMPLETED",
    progress: 100,
    currentStage: "PROFIT_CALCULATION",
    helperNeeded: true,
    workerRequestStatus: "ASSIGNED",
    helperRequestStatus: "CLOSED",
    monthlySalary: 18000,
    assignedPartnerId: "demo_partner_suresh",
    assignedPartnerName: "Suresh Gowda",
    completionRequested: false,
    investorCount: 4,
    investorTotalAmount: 850000,
    totalProfit: 430000,
    platformFee: 12900,
    totalPartnerSalary: 108000,
    investorPool: 185460,
    farmerShare: 123640,
    needsWaterInvestment: false,
    waterCost: 0,
    waterInvestmentLabel: "Existing water source available",
    images: DEMO_PROJECT_IMAGE_URLS,
    documents: [
      {
        label: "Land Overview Photo",
        fileName: "nandi-hills-block-a-overview.jpg",
        fileUrl: DEMO_PROJECT_IMAGE_URLS[0],
        fileType: "image/jpeg",
      },
      {
        label: "Cultivation Progress Photo",
        fileName: "vine-row-drip-irrigation.jpg",
        fileUrl: DEMO_PROJECT_IMAGE_URLS[1],
        fileType: "image/jpeg",
      },
      {
        label: "Harvest Field Verification Photo",
        fileName: "harvest-ready-vines.jpg",
        fileUrl: DEMO_PROJECT_IMAGE_URLS[2],
        fileType: "image/jpeg",
      },
    ],
    progressPhotos: [
      {
        id: "demo-progress-1",
        title: "Land prepared and drip lines installed",
        imageUrl: DEMO_PROJECT_IMAGE_URLS[0],
        uploadedAt: "05 Sep 2025",
        note: "Initial field setup completed with trenching and drip layout.",
      },
      {
        id: "demo-progress-2",
        title: "Canopy development stage",
        imageUrl: DEMO_PROJECT_IMAGE_URLS[1],
        uploadedAt: "17 Dec 2025",
        note: "Healthy mid-season crop growth with monitored irrigation schedule.",
      },
      {
        id: "demo-progress-3",
        title: "Harvest and packing completion",
        imageUrl: DEMO_PROJECT_IMAGE_URLS[2],
        uploadedAt: "28 Mar 2026",
        note: "Harvest completed and sale invoices verified for settlement.",
      },
    ],
    projectInsights: {
      cropAnalysis: {
        crop: "Grapes",
        cropCode: "grapes",
        suitabilityScore: 89,
        baselineYieldPerAcreQuintal: 18,
        expectedYield: 108,
        yieldUnit: "quintal",
        referencePricePerQuintal: 11850,
        costPerAcre: 141667,
        costEstimate: 850000,
        revenueEstimate: 1280000,
        profitEstimate: 430000,
        riskLevel: "LOW",
        waterUsageLevel: "MEDIUM",
        recommendedActions: [
          "Continue pruning and canopy sanitation between cycles.",
          "Maintain drip scheduling based on evapotranspiration reports.",
          "Use verified packhouse records for the next sale cycle.",
        ],
      },
      waterAnalysis: {
        waterSource: "Borewell + Farm Pond",
        needsWaterInvestment: false,
        waterGapDetected: false,
        waterCost: 0,
        costRangeMin: 0,
        costRangeMax: 0,
        label: "Existing water source available",
        recommendation: "Existing borewell and storage pond supported the completed cycle.",
        breakdown: {},
      },
      esgBreakdown: {
        environmentalScore: 82,
        socialScore: 85,
        governanceScore: 86,
        finalESGScore: 84.2,
        label: "Excellent",
      },
      totalInvestment: 850000,
      expectedRevenue: 1280000,
      investorAlerts: [
        "Completed project",
        "Returns distributed",
        "Field verification images available",
      ],
    },
    cropAnalysis: {
      suitabilityScore: 89,
      expectedYield: 108,
      profitEstimate: 430000,
      riskLevel: "LOW",
    },
    waterAnalysis: {
      label: "Existing water source available",
      recommendation: "Existing borewell and storage pond supported the completed cycle.",
      waterCost: 0,
      needsWaterInvestment: false,
    },
    esgBreakdown: {
      environmentalScore: 82,
      socialScore: 85,
      governanceScore: 86,
      finalESGScore: 84.2,
      label: "Excellent",
    },
    investorAlerts: [
      "Completed project",
      "Returns distributed",
      "Field verification images available",
    ],
    investorSummary: {
      investorCount: 4,
      totalInvested: 850000,
      averageTicket: 212500,
      investors: [
        {
          investmentId: "demo-invest-1",
          investorId: "demo_investor_anjali",
          investorName: "Anjali Sharma",
          amount: 250000,
          type: "ONETIME",
          paymentMethod: "UPI",
          status: "SETTLED",
          createdAt: "2025-09-12T09:15:00.000Z",
        },
        {
          investmentId: "demo-invest-2",
          investorId: "demo_investor_rohit",
          investorName: "Rohit Verma",
          amount: 200000,
          type: "ONETIME",
          paymentMethod: "BANK_TRANSFER",
          status: "SETTLED",
          createdAt: "2025-09-14T11:20:00.000Z",
        },
        {
          investmentId: "demo-invest-3",
          investorId: "demo_investor_meera",
          investorName: "Meera Nair",
          amount: 150000,
          type: "SIP",
          paymentMethod: "SIP",
          status: "SETTLED",
          createdAt: "2025-10-02T07:45:00.000Z",
        },
        {
          investmentId: "demo-invest-4",
          investorId: "demo_investor_arjun",
          investorName: "Arjun Patel",
          amount: 250000,
          type: "ONETIME",
          paymentMethod: "WALLET",
          status: "SETTLED",
          createdAt: "2025-10-10T16:05:00.000Z",
        },
      ],
    },
    tags: ["Completed", "Grapes", "Verified Harvest", "Low Risk", "Drip Irrigation"],
    createdAt: "2025-09-03T08:00:00.000Z",
  });
}

function ensureDemoProjects(projects: AppProject[]) {
  if (projects.some((project) => project.id === COMPLETED_DEMO_PROJECT_ID)) {
    return projects;
  }

  return [buildCompletedDemoProject(), ...projects];
}

function normalizeInvestment(payload: any): AppInvestment {
  const projectId = String(payload?.projectId || "");
  const project = projectId ? listProjectsInternal().find((item) => item.id === projectId) : null;
  const investorId = String(payload?.investorId || payload?.userId || "");
  const storedInvestor = investorId ? userService.getById(investorId) : undefined;
  const currentUser = authService.getCurrentUser();
  return {
    ...payload,
    id: String(payload?.id || makeId("investment")),
    investorId,
    investorName: String(payload?.investorName || (currentUser?.id === investorId ? currentUser.name : storedInvestor?.name || "")),
    projectId,
    projectTitle: String(payload?.projectTitle || project?.title || ""),
    farmerId: payload?.farmerId ? String(payload.farmerId) : String(project?.farmerId || ""),
    farmerName: payload?.farmerName ? String(payload.farmerName) : String(project?.farmerName || ""),
    amount: toNumber(payload?.amount),
    type: String(payload?.type || payload?.investmentType || (String(payload?.paymentMethod || "").toUpperCase() === "SIP" ? "SIP" : "ONETIME")),
    status: String(payload?.status || payload?.paymentStatus || "VERIFIED"),
    paymentMethod: payload?.paymentMethod ? String(payload.paymentMethod) : "",
    paymentId: payload?.paymentId ? String(payload.paymentId) : "",
    transactionId: payload?.transactionId ? String(payload.transactionId) : "",
    paymentStatus: payload?.paymentStatus ? String(payload.paymentStatus) : "",
    expectedROI: payload?.expectedROI !== undefined ? toNumber(payload.expectedROI) : payload?.expectedRoi !== undefined ? toNumber(payload.expectedRoi) : undefined,
    expectedReturn: payload?.expectedReturn !== undefined ? toNumber(payload.expectedReturn) : undefined,
    actualROI: payload?.actualROI !== undefined ? toNumber(payload.actualROI) : payload?.actualRoi !== undefined ? toNumber(payload.actualRoi) : null,
    actualReturn: payload?.actualReturn !== undefined ? toNumber(payload.actualReturn) : payload?.profit !== undefined ? toNumber(payload.profit) : null,
    cropType: payload?.cropType ? String(payload.cropType) : String(project?.cropType || ""),
    timeline: payload?.timeline ? String(payload.timeline) : String(project?.timeline || ""),
    projectStatus: payload?.projectStatus ? String(payload.projectStatus) : String(project?.projectStatus || project?.status || ""),
    createdAt: String(payload?.createdAt || nowIso()),
  };
}

function normalizeWithdrawalStatus(status?: string) {
  const value = String(status || "REQUESTED").toUpperCase();
  if (value === "PENDING") return "REQUESTED";
  return value;
}

function normalizeProgressUpdate(payload: any): ProjectProgressUpdate {
  return {
    id: String(payload?.id || makeId("progress")),
    projectId: String(payload?.projectId || ""),
    farmerId: String(payload?.farmerId || ""),
    milestoneKey: String(payload?.milestoneKey || ""),
    stage: String(payload?.stage || payload?.title || payload?.milestoneKey || ""),
    title: payload?.title ? String(payload.title) : String(payload?.stage || payload?.milestoneKey || ""),
    progress: toNumber(payload?.progress),
    notes: String(payload?.notes || ""),
    image: payload?.image ? String(payload.image) : payload?.proofImage ? String(payload.proofImage) : "",
    visibleToInvestor: payload?.visibleToInvestor ?? true,
    visibleToPartner: payload?.visibleToPartner ?? true,
    visibleToAdmin: payload?.visibleToAdmin ?? true,
    cropHealth: payload?.cropHealth ? String(payload.cropHealth) : "",
    proofName: payload?.proofName ? String(payload.proofName) : "",
    date: String(payload?.date || payload?.createdAt || new Date().toISOString().slice(0, 10)),
    createdAt: String(payload?.createdAt || payload?.date || nowIso()),
    status: String(payload?.status || "PENDING"),
  };
}

function normalizeWithdrawal(payload: any): FarmerWithdrawal {
  return {
    id: String(payload?.id || makeId("withdrawal")),
    projectId: String(payload?.projectId || ""),
    projectTitle: payload?.projectTitle ? String(payload.projectTitle) : "",
    farmerId: String(payload?.farmerId || ""),
    farmerName: payload?.farmerName ? String(payload.farmerName) : "",
    milestoneKey: String(payload?.milestoneKey || ""),
    amount: toNumber(payload?.amount),
    reason: String(payload?.reason || ""),
    status: normalizeWithdrawalStatus(payload?.status),
    proofImage: payload?.proofImage ? String(payload.proofImage) : "",
    adminRemark: payload?.adminRemark ? String(payload.adminRemark) : "",
    payoutReference: payload?.payoutReference ? String(payload.payoutReference) : "",
    createdAt: String(payload?.createdAt || payload?.date || nowIso()),
    reviewedAt: payload?.reviewedAt ? String(payload.reviewedAt) : "",
  };
}

function listProjectsInternal() {
  return storage.getJSON<AppProject[]>(PROJECTS_KEY, []).map(normalizeProject);
}

function saveProjectsInternal(projects: AppProject[]) {
  storage.setJSON(PROJECTS_KEY, projects.map(normalizeProject));
}

function mergeProjectsInternal(
  projects: AppProject[],
  options?: { replaceAll?: boolean; replaceFarmerId?: string }
) {
  const normalizedProjects = projects.map(normalizeProject);

  if (options?.replaceAll) {
    saveProjectsInternal(normalizedProjects);
    return normalizedProjects;
  }

  const existingProjects = listProjectsInternal();
  const mergedProjects =
    options?.replaceFarmerId
      ? [
          ...normalizedProjects,
          ...existingProjects.filter((project) => project.farmerId !== options.replaceFarmerId),
        ]
      : [
          ...normalizedProjects,
          ...existingProjects.filter(
            (project) => !normalizedProjects.some((incoming) => incoming.id === project.id)
          ),
        ];

  saveProjectsInternal(mergedProjects);
  return mergedProjects;
}

function listInvestmentsInternal() {
  return storage.getJSON<AppInvestment[]>(INVESTMENTS_KEY, []).map(normalizeInvestment);
}

function saveInvestmentsInternal(investments: AppInvestment[]) {
  storage.setJSON(INVESTMENTS_KEY, investments.map(normalizeInvestment));
}

function investmentKeyForUser(userId: string) {
  return `${INVESTMENTS_BY_USER_PREFIX}${userId}`;
}

function getUserInvestmentsInternal(userId: string) {
  return storage.getJSON<AppInvestment[]>(investmentKeyForUser(userId), []).map(normalizeInvestment);
}

function saveUserInvestmentsInternal(userId: string, investments: AppInvestment[]) {
  storage.setJSON(investmentKeyForUser(userId), investments.map(normalizeInvestment));
}

function listProgressInternal() {
  return storage.getJSON<ProjectProgressUpdate[]>(PROGRESS_KEY, []).map(normalizeProgressUpdate);
}

function saveProgressInternal(progress: ProjectProgressUpdate[]) {
  storage.setJSON(
    PROGRESS_KEY,
    [...progress]
      .map(normalizeProgressUpdate)
      .sort((a, b) => new Date(b.createdAt || b.date || 0).getTime() - new Date(a.createdAt || a.date || 0).getTime())
  );
}

function listWithdrawalsInternal() {
  return storage.getJSON<FarmerWithdrawal[]>(WITHDRAWALS_KEY, []).map(normalizeWithdrawal);
}

function saveWithdrawalsInternal(withdrawals: FarmerWithdrawal[]) {
  storage.setJSON(WITHDRAWALS_KEY, withdrawals.map(normalizeWithdrawal));
}

function listPartnerRequestsInternal() {
  return storage.getJSON<WorkerProjectRequest[]>(PARTNER_REQUESTS_KEY, []);
}

function savePartnerRequestsInternal(requests: WorkerProjectRequest[]) {
  storage.setJSON(PARTNER_REQUESTS_KEY, requests);
}

function listPartnerSalariesInternal() {
  return storage.getJSON<PartnerSalaryRecord[]>(PARTNER_SALARIES_KEY, []);
}

function savePartnerSalariesInternal(records: PartnerSalaryRecord[]) {
  storage.setJSON(PARTNER_SALARIES_KEY, records);
}

function listInvestorReturnsInternal() {
  return storage.getJSON<InvestorReturnRecord[]>(INVESTOR_RETURNS_KEY, []);
}

function saveInvestorReturnsInternal(records: InvestorReturnRecord[]) {
  storage.setJSON(INVESTOR_RETURNS_KEY, records);
}

function listSettlementsInternal() {
  return storage.getJSON<SettlementSummary[]>(SETTLEMENTS_KEY, []);
}

function saveSettlementsInternal(items: SettlementSummary[]) {
  storage.setJSON(SETTLEMENTS_KEY, items);
}

function upsertProjectLocal(project: AppProject) {
  const projects = listProjectsInternal();
  const index = projects.findIndex((item) => item.id === project.id);
  if (index >= 0) {
    projects[index] = normalizeProject({ ...projects[index], ...project });
  } else {
    projects.unshift(normalizeProject(project));
  }
  saveProjectsInternal(projects);
}

function replaceProjectIdLocal(previousId: string, nextProject: AppProject) {
  const projects = listProjectsInternal().map((project) =>
    project.id === previousId ? normalizeProject(nextProject) : project
  );
  saveProjectsInternal(projects);
}

function upsertPartnerRequestLocal(request: WorkerProjectRequest) {
  const requests = listPartnerRequestsInternal();
  const index = requests.findIndex((item) => item.id === request.id || (item.projectId === request.projectId && item.partnerId === request.partnerId));
  if (index >= 0) {
    requests[index] = { ...requests[index], ...request };
  } else {
    requests.unshift(request);
  }
  savePartnerRequestsInternal(requests);
}

function upsertWithdrawalLocal(withdrawal: FarmerWithdrawal) {
  const withdrawals = listWithdrawalsInternal();
  const index = withdrawals.findIndex((item) => item.id === withdrawal.id);
  if (index >= 0) {
    withdrawals[index] = normalizeWithdrawal({ ...withdrawals[index], ...withdrawal });
  } else {
    withdrawals.unshift(normalizeWithdrawal(withdrawal));
  }
  saveWithdrawalsInternal(withdrawals);
}

function upsertProgressLocal(update: ProjectProgressUpdate) {
  const progress = listProgressInternal();
  const normalized = normalizeProgressUpdate(update);
  const index = progress.findIndex((item) => item.id === normalized.id);
  if (index >= 0) {
    progress[index] = normalized;
  } else {
    progress.unshift(normalized);
  }
  saveProgressInternal(progress);
}

function syncProjectWithBackend(projectId: string, updates: Record<string, any>) {
  void apiRequest<AppProject>({
    method: "PUT",
    url: `/api/projects/${encodeURIComponent(projectId)}`,
    data: updates,
  })
    .then((response) => {
      upsertProjectLocal(normalizeProject(response));
    })
    .catch(() => undefined);
}

function resolveUserForWallet(userId: string, defaults?: Partial<User>): User {
  const currentUser = authService.getCurrentUser();
  if (currentUser?.id === userId) {
    return currentUser;
  }

  const storedUser = userService.getById(userId);
  if (storedUser) {
    return storedUser;
  }

  const wallet = getWallet(userId);
  return {
    id: userId,
    name: defaults?.name || userId,
    email: defaults?.email || "",
    phone: defaults?.phone || "",
    role: (defaults?.role as User["role"]) || "INVESTOR",
    verified: true,
    walletBalance: wallet.balance,
    wallet,
  };
}

function updateProjectFunding(projectId: string, amount: number) {
  const project = getProjectById(projectId);
  if (!project) return;

  const fundedAmount = roundMoney(Number(project.fundedAmount || 0) + Number(amount || 0));
  const fundingPercent = project.fundingGoal > 0 ? Math.round((fundedAmount / project.fundingGoal) * 100) : 0;
  const projectStatus = fundedAmount >= project.fundingGoal ? "READY_TO_START" : "OPEN_FOR_FUNDING";
  updateProject(projectId, {
    fundedAmount,
    raisedAmount: fundedAmount,
    fundingPercent,
    projectStatus,
    status: fundedAmount >= project.fundingGoal ? "FUNDED" : "LIVE",
  });
}

function computeSettlement(project: AppProject, monthsWorked?: number) {
  const totalProfit = Math.max(
    toNumber(project.totalProfit ?? project.expectedRevenue) - toNumber(project.estimatedExpenses),
    0
  );
  const normalizedMonthsWorked = monthsWorked && monthsWorked > 0 ? monthsWorked : 1;
  const totalPartnerSalary = roundMoney(toNumber(project.monthlySalary) * normalizedMonthsWorked);
  const platformFee = roundMoney(totalProfit * 0.03);
  const distributableProfit = roundMoney(Math.max(totalProfit - platformFee - totalPartnerSalary, 0));
  const investorPool = roundMoney(distributableProfit * 0.6);
  const farmerShare = roundMoney(Math.max(distributableProfit - investorPool, 0));
  return { totalProfit, platformFee, totalPartnerSalary, investorPool, farmerShare, monthsWorked: normalizedMonthsWorked };
}

function normalizedApprovalStage(project?: Partial<AppProject> | null) {
  return String(project?.approvalStage || project?.approvalStatus || "").toUpperCase();
}

function normalizedProjectStatus(project?: Partial<AppProject> | null) {
  return String(project?.projectStatus || project?.status || "").toUpperCase();
}

export function isProjectCompleted(project?: Partial<AppProject> | null) {
  return normalizedProjectStatus(project) === "COMPLETED";
}

export function isProjectFundRaised(project?: Partial<AppProject> | null) {
  if (!project) return false;
  const fundingGoal = toNumber(project.fundingGoal);
  const fundedAmount = toNumber(project.fundedAmount ?? project.raisedAmount);
  return fundingGoal > 0 && fundedAmount >= fundingGoal;
}

export function getProjectStatusLabel(project?: Partial<AppProject> | null) {
  if (!project) return "UNKNOWN";
  if (isProjectCompleted(project)) return "COMPLETED";
  if (isProjectFundRaised(project)) return "FUND RAISED";

  const status = normalizedProjectStatus(project);
  return status ? status.replaceAll("_", " ") : "UNKNOWN";
}

export function getInvestmentUnavailableReason(project?: Partial<AppProject> | null) {
  if (!project) return "Project not found.";
  if (normalizedApprovalStage(project) !== "APPROVED") {
    return "Only approved projects can accept investments.";
  }
  if (isProjectCompleted(project)) {
    return "This project is completed.";
  }
  if (isProjectFundRaised(project)) {
    return "This project is already fully funded.";
  }
  return "Investment is not available for this project.";
}

export function canInvestInProject(project?: Partial<AppProject> | null) {
  return normalizedApprovalStage(project) === "APPROVED" && !isProjectCompleted(project) && !isProjectFundRaised(project);
}

export function getPartnerRequestUnavailableReason(project?: Partial<AppProject> | null) {
  if (!project) return "Project not found.";
  if (normalizedApprovalStage(project) !== "APPROVED") {
    return "Only approved projects can accept partner work requests.";
  }
  if (isProjectCompleted(project)) {
    return "This project is completed.";
  }
  if (!project.helperNeeded || String(project.helperRequestStatus || "").toUpperCase() !== "OPEN") {
    return "Partner work requests are closed for this project.";
  }
  return "Partner work request is not available for this project.";
}

export function canPartnerRequestProject(project?: Partial<AppProject> | null) {
  return (
    normalizedApprovalStage(project) === "APPROVED" &&
    !isProjectCompleted(project) &&
    Boolean(project?.helperNeeded) &&
    String(project?.helperRequestStatus || "").toUpperCase() === "OPEN"
  );
}

export function listProjects(): AppProject[] {
  const projects = listProjectsInternal();
  const ensured = ensureDemoProjects(projects);
  if (ensured.length !== projects.length) {
    saveProjectsInternal(ensured);
  }
  return ensured;
}

export function saveProjects(projects: AppProject[]) {
  saveProjectsInternal(ensureDemoProjects(projects.map(normalizeProject)));
}

export async function fetchAllProjects() {
  const response = await apiRequest<any[]>({
    url: "/api/projects",
    method: "GET",
  });

  const normalizedProjects = ensureDemoProjects((response || []).map(normalizeProject));
  mergeProjectsInternal(normalizedProjects, { replaceAll: true });
  return normalizedProjects;
}

export function getProjectById(projectId: string) {
  return listProjectsInternal().find((project) => project.id === projectId) || null;
}

export async function fetchProjectById(projectId: string) {
  const response = await apiRequest<any>({
    method: "GET",
    url: `/api/projects/${encodeURIComponent(projectId)}`,
  });

  const normalized = normalizeProject(response);
  upsertProjectLocal(normalized);
  return normalized;
}

export async function fetchFarmerProjects() {
  const response = await apiRequest<any[]>({
    url: "/api/projects/mine",
    method: "GET",
  });

  const normalizedProjects = (response || []).map(normalizeProject);
  const currentUser = authService.getCurrentUser();

  if (currentUser?.id) {
    mergeProjectsInternal(normalizedProjects, { replaceFarmerId: currentUser.id });
  } else {
    mergeProjectsInternal(normalizedProjects);
  }

  return normalizedProjects;
}

export function getFarmerProjects(farmerId: string) {
  return listProjectsInternal().filter((project) => project.farmerId === farmerId);
}

export async function addProject(project: Partial<AppProject>, user: User): Promise<AppProject> {
  const tempId = project.id || makeId("project");
  const normalized = normalizeProject({
    ...project,
    id: tempId,
    farmerId: user.id,
    farmerName: project.farmerName || user.name,
    status: project.status || "PENDING",
    approvalStage: project.approvalStage || "SENT_FOR_APPROVAL",
    approvalStatus: project.approvalStatus || "PENDING",
    projectStatus: project.projectStatus || "NOT_STARTED",
    fundedAmount: project.fundedAmount || 0,
    raisedAmount: project.fundedAmount || project.raisedAmount || 0,
    fundingPercent: project.fundingPercent || 0,
    createdAt: project.createdAt || nowIso(),
    milestones: project.milestones || normalizeMilestones([]),
  });

  upsertProjectLocal(normalized);

  const savedProject = await apiRequest<AppProject>({
    method: "POST",
    url: "/api/projects/detailed",
    data: normalized,
  });

  replaceProjectIdLocal(tempId, normalizeProject(savedProject));
  return normalizeProject(savedProject);
}

export function updateProject(projectId: string, updates: Partial<AppProject>) {
  const existing = getProjectById(projectId);
  if (!existing) return null;
  const nextProject = normalizeProject({ ...existing, ...updates, id: projectId });
  upsertProjectLocal(nextProject);
  syncProjectWithBackend(projectId, updates as Record<string, any>);
  return nextProject;
}

export async function persistProjectUpdate(projectId: string, updates: Partial<AppProject>) {
  const response = await apiRequest<AppProject>({
    method: "PUT",
    url: `/api/projects/${encodeURIComponent(projectId)}`,
    data: updates,
  });

  const nextProject = normalizeProject(response);
  upsertProjectLocal(nextProject);
  return nextProject;
}

export function startProject(projectId: string) {
  return updateProject(projectId, { projectStatus: "IN_PROGRESS", status: "LIVE", activeStatus: "ACTIVE" });
}

export function listInvestments() {
  return listInvestmentsInternal();
}

export function getInvestorInvestments(userId: string) {
  return getUserInvestmentsInternal(userId);
}

export async function fetchMyInvestments(userId?: string) {
  const resolvedUserId = userId || authService.getCurrentUser()?.id || "";
  const response = await apiRequest<any[]>({
    method: "GET",
    url: "/api/investments/mine",
  });

  const normalized = (response || []).map((investment) =>
    normalizeInvestment({
      ...investment,
      investorId: investment?.investorId || resolvedUserId,
    })
  );

  if (resolvedUserId) {
    saveInvestorInvestments(resolvedUserId, normalized);
  } else {
    const existing = listInvestmentsInternal().filter(
      (investment) => !normalized.some((item) => item.id === investment.id)
    );
    saveInvestmentsInternal([...normalized, ...existing]);
  }

  return normalized;
}

export function saveInvestorInvestments(userId: string, investments: AppInvestment[]) {
  const normalized = investments.map(normalizeInvestment);
  saveUserInvestmentsInternal(userId, normalized);
  const otherInvestments = listInvestmentsInternal().filter((investment) => investment.investorId !== userId);
  saveInvestmentsInternal([...normalized, ...otherInvestments]);
}

export function addInvestment(userId: string, investment: Partial<AppInvestment>) {
  const project = getProjectById(String(investment.projectId || ""));
  if (project && !canInvestInProject(project)) {
    throw new Error(getInvestmentUnavailableReason(project));
  }

  const remainingFunding = project
    ? Math.max(0, roundMoney(Number(project.fundingGoal || 0) - Number(project.fundedAmount || 0)))
    : 0;
  if (project && Number(investment.amount || 0) > remainingFunding) {
    throw new Error(`Only Rs. ${Math.round(remainingFunding).toLocaleString("en-IN")} is left to fund this project.`);
  }

  const normalized = normalizeInvestment({
    ...investment,
    investorId: userId,
    projectTitle: investment.projectTitle || project?.title || "",
    farmerId: investment.farmerId || project?.farmerId || "",
    farmerName: investment.farmerName || project?.farmerName || "",
    type: investment.type || investment.investmentType || "ONETIME",
    status: investment.status || "VERIFIED",
    createdAt: investment.createdAt || nowIso(),
  });

  saveInvestorInvestments(userId, [normalized, ...getUserInvestmentsInternal(userId)]);
  updateProjectFunding(normalized.projectId, normalized.amount);
  return normalized;
}

export async function createInvestment(userId: string, payload: {
  projectId: string;
  amount: number;
  paymentMethod: string;
}) {
  const project = getProjectById(payload.projectId);
  if (project && !canInvestInProject(project)) {
    throw new Error(getInvestmentUnavailableReason(project));
  }

  const remainingFunding = project
    ? Math.max(0, roundMoney(Number(project.fundingGoal || 0) - Number(project.fundedAmount || 0)))
    : 0;
  if (project && Number(payload.amount || 0) > remainingFunding) {
    throw new Error(`Only Rs. ${Math.round(remainingFunding).toLocaleString("en-IN")} is left to fund this project.`);
  }

  const response = await apiRequest<{ investmentId?: string }>({
    method: "POST",
    url: "/api/investments",
    data: {
      projectId: payload.projectId,
      amount: payload.amount,
      paymentMethod: payload.paymentMethod,
    },
  });

  await fetchAllProjects().catch(() => undefined);
  const investments = await fetchMyInvestments(userId).catch(() => []);
  const created = investments.find((investment) => investment.id === response?.investmentId) || investments[0];

  if (created) {
    return created;
  }

  return normalizeInvestment({
    id: response?.investmentId,
    investorId: userId,
    projectId: payload.projectId,
    amount: payload.amount,
    paymentMethod: payload.paymentMethod,
    createdAt: nowIso(),
  });
}

export async function fetchProjectInvestorSummary(projectId: string) {
  const response = await apiRequest<any>({
    method: "GET",
    url: `/api/projects/${encodeURIComponent(projectId)}/investor-summary`,
  });

  const project = getProjectById(projectId);
  const normalizedInvestments = Array.isArray(response?.investors)
    ? response.investors.map((item: any) =>
        normalizeInvestment({
          id: item.investmentId,
          investorId: item.investorId,
          investorName: item.investorName,
          projectId,
          projectTitle: project?.title || response?.projectTitle || "",
          farmerId: project?.farmerId || "",
          farmerName: project?.farmerName || "",
          amount: item.amount,
          type: item.type,
          paymentMethod: item.paymentMethod,
          status: item.status,
          createdAt: item.createdAt,
          projectStatus: project?.projectStatus || project?.status,
        })
      )
    : [];

  if (normalizedInvestments.length > 0) {
    const existing = listInvestmentsInternal().filter(
      (investment) => investment.projectId !== projectId || !normalizedInvestments.some((item) => item.id === investment.id)
    );
    saveInvestmentsInternal([...normalizedInvestments, ...existing]);
  }

  return {
    projectId,
    investorCount: toNumber(response?.investorCount),
    totalInvested: toNumber(response?.totalInvested),
    averageTicket: toNumber(response?.averageTicket),
    investors: normalizedInvestments.length > 0 ? normalizedInvestments.map((item) => ({
      investmentId: item.id,
      investorId: item.investorId,
      investorName: item.investorName || item.investorId,
      amount: item.amount,
      type: item.type,
      paymentMethod: item.paymentMethod,
      status: item.status,
      createdAt: item.createdAt,
    })) : [],
  };
}

export function getProjectInvestorSummary(projectId: string) {
  const investments = listInvestmentsInternal().filter((item) => item.projectId === projectId);
  const totalInvested = roundMoney(investments.reduce((sum, item) => sum + toNumber(item.amount), 0));
  const project = getProjectById(projectId);
  const fallbackSummary = project?.investorSummary || project?.projectInsights?.investorSummary;
  const investorCount = investments.length || toNumber(project?.investorCount ?? fallbackSummary?.investorCount);
  const fallbackTotalInvested = toNumber(project?.investorTotalAmount ?? project?.fundedAmount ?? fallbackSummary?.totalInvested);
  const summaryTotal = investments.length ? totalInvested : fallbackTotalInvested;
  const fallbackInvestors = Array.isArray(fallbackSummary?.investors) ? fallbackSummary.investors : [];
  return {
    projectId,
    investorCount,
    totalInvested: summaryTotal,
    averageTicket: investorCount ? roundMoney(summaryTotal / investorCount) : 0,
    investors: (investments.length ? investments : fallbackInvestors).map((item: any) => ({
      investmentId: item.id || item.investmentId,
      investorId: item.investorId,
      investorName: item.investorName || item.investorId,
      amount: toNumber(item.amount),
      type: item.type || "ONETIME",
      paymentMethod: item.paymentMethod || "",
      status: item.status || "ACTIVE",
      createdAt: item.createdAt || nowIso(),
    })),
  };
}

export function getProjectSettlementSummary(projectId: string) {
  const existing = listSettlementsInternal().find((item) => item.projectId === projectId);
  if (existing) return existing;
  const project = getProjectById(projectId);
  if (!project) return null;
  return { projectId, ...computeSettlement(project, toNumber(project.monthsWorked, 1)) };
}

export function listProgress(projectId?: string) {
  const items = listProgressInternal();
  return projectId ? items.filter((item) => item.projectId === projectId) : items;
}

export async function fetchProjectProgress(projectId: string) {
  const response = await apiRequest<any[]>({
    method: "GET",
    url: `/api/project-tracking/${encodeURIComponent(projectId)}/updates`,
  });

  const normalized = (response || []).map(normalizeProgressUpdate);
  const existing = listProgressInternal();
  const retainedLocal = existing.filter(
    (item) => item.projectId === projectId && !normalized.some((remote) => remote.id === item.id)
  );
  const mergedProjectUpdates = [...normalized, ...retainedLocal].sort(
    (a, b) => new Date(b.createdAt || b.date || 0).getTime() - new Date(a.createdAt || a.date || 0).getTime()
  );

  saveProgressInternal([
    ...mergedProjectUpdates,
    ...existing.filter((item) => item.projectId !== projectId),
  ]);

  return mergedProjectUpdates;
}

export function addProgressUpdate(update: Partial<ProjectProgressUpdate>): ProjectProgressUpdate {
  const next = normalizeProgressUpdate({
    ...update,
    id: String(update.id || makeId("progress")),
    date: update.date || new Date().toISOString().slice(0, 10),
    createdAt: update.createdAt || nowIso(),
  });

  upsertProgressLocal(next);
  void apiRequest({
    method: "POST",
    url: "/api/project-tracking/updates",
    data: {
      id: next.id,
      projectId: next.projectId,
      farmerId: next.farmerId,
      milestoneKey: next.milestoneKey,
      title: next.title || next.stage,
      notes: next.notes,
      date: next.date,
      createdAt: next.createdAt,
      cropHealth: next.cropHealth,
      proofName: next.proofName || "proof-upload",
      proofImage: next.image || "",
    },
  })
    .then((response) => {
      upsertProgressLocal(normalizeProgressUpdate(response));
    })
    .catch(() => undefined);

  return next;
}

export function listWithdrawals(projectId?: string) {
  const withdrawals = listWithdrawalsInternal();
  return projectId ? withdrawals.filter((item) => item.projectId === projectId) : withdrawals;
}

export async function fetchProjectWithdrawals(projectId: string): Promise<FarmerWithdrawal[]> {
  const response = await apiRequest<any[]>({
    method: "GET",
    url: `/api/project-tracking/${encodeURIComponent(projectId)}/withdrawals`,
  });

  const normalized = (response || []).map(normalizeWithdrawal);
  const others = listWithdrawalsInternal().filter((item) => item.projectId !== projectId);
  saveWithdrawalsInternal([...normalized, ...others]);
  return normalized;
}

export async function listAdminWithdrawals(status?: FarmerWithdrawalStatus | "ALL"): Promise<FarmerWithdrawal[]> {
  const query = buildQuery({
    status: status && status !== "ALL" ? (status === "REQUESTED" ? "PENDING" : status) : undefined,
  });

  const response = await apiRequest<any[]>({
    method: "GET",
    url: `/api/project-tracking/withdrawals${query}`,
  });

  const normalized = (response || []).map(normalizeWithdrawal);
  saveWithdrawalsInternal([
    ...normalized,
    ...listWithdrawalsInternal().filter((item) => !normalized.some((request) => request.id === item.id)),
  ]);
  return normalized;
}

export async function addFarmerWithdrawal(withdrawal: Partial<FarmerWithdrawal>) {
  const createdAt = String(withdrawal.createdAt || nowIso());
  const response = await apiRequest<any>({
    method: "POST",
    url: "/api/project-tracking/withdrawals",
    data: {
      projectId: String(withdrawal.projectId || ""),
      farmerId: String(withdrawal.farmerId || ""),
      milestoneKey: String(withdrawal.milestoneKey || ""),
      amount: toNumber(withdrawal.amount),
      reason: String(withdrawal.reason || ""),
      date: createdAt,
    },
  });

  const next = normalizeWithdrawal({
    ...response,
    proofImage: withdrawal.proofImage,
    payoutReference: withdrawal.payoutReference,
  });
  upsertWithdrawalLocal(next);
  return next;
}

export async function approveFarmerWithdrawal(id: string, adminRemark?: string): Promise<FarmerWithdrawal> {
  const response = await apiRequest<any>({
    method: "PUT",
    url: `/api/project-tracking/withdrawals/${encodeURIComponent(id)}/approve`,
    data: { adminRemark },
  });

  const next = normalizeWithdrawal(response);
  upsertWithdrawalLocal(next);
  return next;
}

export async function rejectFarmerWithdrawal(id: string, adminRemark?: string): Promise<FarmerWithdrawal> {
  const response = await apiRequest<any>({
    method: "PUT",
    url: `/api/project-tracking/withdrawals/${encodeURIComponent(id)}/reject`,
    data: { adminRemark },
  });

  const next = normalizeWithdrawal(response);
  upsertWithdrawalLocal(next);
  return next;
}

export function updateFarmerWithdrawalStatus(id: string, status: string, payoutReference?: string) {
  const withdrawals = listWithdrawalsInternal().map((item) =>
    item.id === id
      ? normalizeWithdrawal({
          ...item,
          status,
          payoutReference: payoutReference || item.payoutReference,
          adminRemark: payoutReference || item.adminRemark,
        })
      : item
  );
  saveWithdrawalsInternal(withdrawals);
  if (status === "DISBURSED") {
    void approveFarmerWithdrawal(id, payoutReference).catch(() => undefined);
  }
  if (status === "REJECTED") {
    void rejectFarmerWithdrawal(id, payoutReference).catch(() => undefined);
  }
}

export function listPartnerSalaries() {
  return listPartnerSalariesInternal();
}

export function updatePartnerSalaryStatus(id: string, status: string, payoutReference?: string) {
  savePartnerSalariesInternal(
    listPartnerSalariesInternal().map((item) => (item.id === id ? { ...item, status, payoutReference: payoutReference || item.payoutReference } : item))
  );
}

export function listInvestorReturns() {
  return listInvestorReturnsInternal();
}

export function updateInvestorReturnStatus(id: string, status: string, payoutReference?: string) {
  saveInvestorReturnsInternal(
    listInvestorReturnsInternal().map((item) => (item.id === id ? { ...item, status, payoutReference: payoutReference || item.payoutReference } : item))
  );
}

export function completeProject(projectId: string, overrides?: { totalProfit?: number; monthsWorked?: number }) {
  const project = getProjectById(projectId);
  if (!project) throw new Error("Project not found.");

  const settlement = computeSettlement(
    { ...project, totalProfit: overrides?.totalProfit ?? project.totalProfit },
    overrides?.monthsWorked
  );
  const projectInvestments = listInvestmentsInternal().filter((item) => item.projectId === projectId);
  const totalInvested = projectInvestments.reduce((sum, item) => sum + toNumber(item.amount), 0);

  const nextReturns: InvestorReturnRecord[] = [];
  const otherReturns = listInvestorReturnsInternal().filter((item) => item.projectId !== projectId);
  projectInvestments.forEach((investment, index) => {
    const existingDistributed = nextReturns.reduce((sum, item) => sum + item.returnAmount, 0);
    const share =
      index === projectInvestments.length - 1
        ? roundMoney(settlement.investorPool - existingDistributed)
        : totalInvested > 0
          ? roundMoney((settlement.investorPool * investment.amount) / totalInvested)
          : 0;
    const record: InvestorReturnRecord = {
      id: makeId("return"),
      projectId,
      investorId: investment.investorId,
      investorName: investment.investorName || investment.investorId,
      investedAmount: investment.amount,
      returnAmount: share,
      status: "DISBURSED",
      payoutReference: `ROI_${projectId}_${investment.id}`,
      createdAt: nowIso(),
    };
    nextReturns.push(record);
    if (share > 0) {
      walletService.creditProfit(resolveUserForWallet(investment.investorId, { name: investment.investorName || investment.investorId, role: "INVESTOR" }), share, record.id);
    }
  });
  saveInvestorReturnsInternal([...nextReturns, ...otherReturns]);

  const nextSalaries: PartnerSalaryRecord[] = [];
  const otherSalaries = listPartnerSalariesInternal().filter((item) => item.projectId !== projectId);
  if (project.assignedPartnerId && project.monthlySalary > 0) {
    for (let month = 1; month <= settlement.monthsWorked; month += 1) {
      const record: PartnerSalaryRecord = {
        id: makeId("salary"),
        projectId,
        partnerId: project.assignedPartnerId,
        partnerName: project.assignedPartnerName || project.assignedPartnerId,
        amount: project.monthlySalary,
        month: `Month ${month}`,
        status: "PAID",
        payoutReference: `SALARY_${projectId}_${month}`,
        createdAt: nowIso(),
      };
      nextSalaries.push(record);
      walletService.creditSalary(resolveUserForWallet(project.assignedPartnerId, { name: project.assignedPartnerName || project.assignedPartnerId, role: "AGRI_PARTNER" }), project.monthlySalary, record.id);
    }
  }
  savePartnerSalariesInternal([...nextSalaries, ...otherSalaries]);

  if (settlement.farmerShare > 0) {
    walletService.creditProfit(resolveUserForWallet(project.farmerId, { name: project.farmerName || project.farmerId, role: "FARMER" }), settlement.farmerShare, `farmer_${projectId}`);
  }

  saveSettlementsInternal([{ projectId, ...settlement }, ...listSettlementsInternal().filter((item) => item.projectId !== projectId)]);
  const completedProject = updateProject(projectId, {
    status: "COMPLETED",
    projectStatus: "COMPLETED",
    completionRequested: false,
    helperNeeded: false,
    helperRequestStatus: "CLOSED",
    workerRequestStatus: project.assignedPartnerId ? "COMPLETED" : "CLOSED",
    totalProfit: settlement.totalProfit,
    platformFee: settlement.platformFee,
    totalPartnerSalary: settlement.totalPartnerSalary,
    investorPool: settlement.investorPool,
    farmerShare: settlement.farmerShare,
    fundedAmount: totalInvested || project.fundedAmount,
    raisedAmount: totalInvested || project.fundedAmount,
  });

  void apiRequest({
    method: "POST",
    url: `/api/projects/${encodeURIComponent(projectId)}/complete`,
    data: {
      totalProfit: settlement.totalProfit,
      monthsWorked: settlement.monthsWorked,
      partners:
        project.assignedPartnerId && project.monthlySalary > 0
          ? [{ partnerId: project.assignedPartnerId, partnerName: project.assignedPartnerName, monthlySalary: project.monthlySalary }]
          : [],
    },
  }).catch(() => undefined);

  return { project: completedProject, settlement: { projectId, ...settlement } };
}

export function getPartnerRequestsForPartner(partnerId: string) {
  const local = listPartnerRequestsInternal().filter((request) => request.partnerId === partnerId);
  void listPartnerWorkerRequestsApi(partnerId)
    .then((response) => {
      const others = listPartnerRequestsInternal().filter((request) => request.partnerId !== partnerId);
      savePartnerRequestsInternal([...response, ...others]);
    })
    .catch(() => undefined);
  return local;
}

export async function addPartnerRequest(input: {
  projectId: string;
  projectTitle?: string;
  farmerId?: string;
  farmerName?: string;
  partnerId: string;
  partnerName?: string;
  message?: string;
  salary?: number;
}) {
  const project = getProjectById(input.projectId);
  if (project && !canPartnerRequestProject(project)) {
    throw new Error(getPartnerRequestUnavailableReason(project));
  }

  const response = await createWorkerRequest({
    projectId: input.projectId,
    partnerId: input.partnerId,
    message: input.message,
    partnerProfile: getPartnerProfile(input.partnerId),
  });

  upsertPartnerRequestLocal(response);
  updateProject(input.projectId, { helperNeeded: true, helperRequestStatus: "OPEN", workerRequestStatus: "REQUESTED" });

  return response;
}

export async function listPartnerRequests(status?: WorkerRequestStatus | "ALL"): Promise<WorkerProjectRequest[]> {
  const response = await listAdminWorkerRequestsApi(status);
  savePartnerRequestsInternal([
    ...response,
    ...listPartnerRequestsInternal().filter(
      (existing) =>
        !response.some(
          (request) =>
            (request.id && existing.id && request.id === existing.id) ||
            (request.projectId === existing.projectId && request.partnerId === existing.partnerId)
        )
    ),
  ]);
  return response;
}

export async function getPartnerRequest(requestId: string): Promise<WorkerProjectRequest> {
  const response = await getAdminWorkerRequestDetailsApi(requestId);
  upsertPartnerRequestLocal(response);
  return response;
}

export async function approvePartnerRequest(requestId: string, adminRemarks?: string): Promise<WorkerProjectRequest> {
  const response = await approveWorkerRequestApi(requestId, { adminRemarks });
  upsertPartnerRequestLocal(response);
  updateProject(response.projectId, {
    assignedPartnerId: response.partnerId,
    assignedPartnerName: response.partnerName,
    workerRequestStatus: "ASSIGNED",
    helperRequestStatus: "CLOSED",
    helperNeeded: true,
  });
  return response;
}

export async function rejectPartnerRequest(requestId: string, adminRemarks?: string): Promise<WorkerProjectRequest> {
  const response = await rejectWorkerRequestApi(requestId, { adminRemarks });
  upsertPartnerRequestLocal(response);
  return response;
}

export function getDashboardCounts(user: User) {
  const projects = listProjectsInternal();
  if (user.role === "FARMER") {
    const myProjects = projects.filter((project) => project.farmerId === user.id);
    return {
      totalProjects: myProjects.length,
      approvedProjects: myProjects.filter((project) => project.approvalStage === "APPROVED").length,
      pendingApproval: myProjects.filter((project) => project.approvalStage === "SENT_FOR_APPROVAL").length,
      rejectedProjects: myProjects.filter((project) => project.approvalStage === "REJECTED").length,
    };
  }

  if (user.role === "INVESTOR") {
    const investments = getUserInvestmentsInternal(user.id);
    return {
      totalInvestments: investments.length,
      activeInvestments: investments.filter((investment) => investment.status !== "FAILED").length,
      totalInvested: investments.reduce((sum, item) => sum + item.amount, 0),
      expectedReturns: investments.reduce((sum, item) => sum + toNumber(item.expectedReturn), 0),
    };
  }

  if (user.role === "AGRI_PARTNER") {
    const availableProjects = projects.filter(
      (project) => canPartnerRequestProject(project) && project.assignedPartnerId !== user.id
    );
    const salaries = listPartnerSalariesInternal().filter((salary) => salary.partnerId === user.id);
    return {
      availableProjects: availableProjects.length,
      assignedWork: projects.filter((project) => project.assignedPartnerId === user.id).length,
      totalEarnings: salaries.reduce((sum, item) => sum + toNumber(item.amount), 0),
      pendingRequests: getPartnerRequestsForPartner(user.id).filter((request) => request.status === "PENDING").length,
    };
  }

  return {
    totalProjects: projects.length,
    totalInvestments: listInvestmentsInternal().length,
  };
}
