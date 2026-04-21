import { ENABLE_LOCAL_FALLBACKS, apiRequest, buildQuery } from "./api";
import { storage } from "./storage";

const PARTNER_PROFILE_KEY = "agriinvest_partner_profiles_v1";

export type WorkerRequestStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface PartnerProfileRecord {
  userId: string;
  headline: string;
  bio: string;
  experienceYears: number;
  skills: string[];
  districts: string;
  aadhaarNumber: string;
  aadhaarFileName: string;
  certificateFileNames: string[];
  additionalDocumentNames: string[];
  bankProofFileName: string;
  upiId: string;
  paytmNumber: string;
  photoDataUrl: string;
  updatedAt: string;
  completionPercent: number;
  readyForProjects: boolean;
  adminRemarks?: string;
}

export interface PartnerProfileDetails {
  userId: string;
  headline?: string;
  bio?: string;
  experienceYears?: number;
  skills: string[];
  districts: string[];
  aadhaarNumber?: string;
  aadhaarFileName?: string;
  certificateFileNames: string[];
  additionalDocumentNames: string[];
  bankProofFileName?: string;
  upiId?: string;
  paytmNumber?: string;
  photoDataUrl?: string;
  completionPercent?: number;
  readyForProjects?: boolean;
  updatedAt?: string;
  adminRemarks?: string;
}

export interface WorkerProjectRequest extends PartnerProfileDetails {
  id?: string;
  projectId: string;
  projectTitle?: string;
  farmerId?: string;
  farmerName?: string;
  partnerId: string;
  partnerName?: string;
  message?: string;
  status: WorkerRequestStatus;
  reviewedAt?: string;
  createdAt?: string;
}

export interface WorkerRequestReviewPayload {
  adminRemarks?: string;
}

type CreateWorkerRequestInput = {
  projectId: string;
  partnerId: string;
  message?: string;
  partnerProfile: PartnerProfileRecord;
};

function listPartnerProfiles(): PartnerProfileRecord[] {
  return storage.getJSON<PartnerProfileRecord[]>(PARTNER_PROFILE_KEY, []);
}

function savePartnerProfiles(profiles: PartnerProfileRecord[]) {
  storage.setJSON(PARTNER_PROFILE_KEY, profiles);
}

function completionPercent(profile: Omit<PartnerProfileRecord, "completionPercent" | "readyForProjects">) {
  let points = 0;

  if (profile.headline.trim()) points += 15;
  if (profile.bio.trim()) points += 15;
  if (profile.photoDataUrl) points += 15;
  if (profile.skills.length > 0) points += 10;
  if (profile.experienceYears > 0) points += 10;
  if (profile.districts.trim()) points += 10;
  if (profile.aadhaarNumber.trim() && profile.aadhaarFileName.trim()) points += 15;
  if (profile.certificateFileNames.length > 0) points += 5;
  if (profile.additionalDocumentNames.length > 0 || profile.bankProofFileName.trim()) points += 5;

  return Math.min(100, points);
}

function normalizeProfile(
  profile: Omit<PartnerProfileRecord, "completionPercent" | "readyForProjects">
): PartnerProfileRecord {
  const percent = completionPercent(profile);
  const readyForProjects = Boolean(
    profile.photoDataUrl &&
      profile.aadhaarNumber.trim() &&
      profile.aadhaarFileName.trim() &&
      profile.certificateFileNames.length > 0 &&
      profile.skills.length > 0 &&
      percent >= 80
  );

  return {
    ...profile,
    completionPercent: percent,
    readyForProjects,
  };
}

function normalizeApiProfile(payload: any, fallbackUserId = ""): PartnerProfileRecord {
  const districts = Array.isArray(payload?.districts)
    ? payload.districts
    : typeof payload?.districts === "string"
      ? payload.districts.split(",")
      : [];

  return normalizeProfile({
    userId: payload?.userId || fallbackUserId,
    headline: payload?.headline || "",
    bio: payload?.bio || "",
    experienceYears: Number(payload?.experienceYears || 0),
    skills: Array.isArray(payload?.skills) ? payload.skills.filter(Boolean) : [],
    districts: districts.map((item: string) => String(item).trim()).filter(Boolean).join(", "),
    aadhaarNumber: payload?.aadhaarNumber || "",
    aadhaarFileName: payload?.aadhaarFileName || "",
    certificateFileNames: Array.isArray(payload?.certificateFileNames) ? payload.certificateFileNames.filter(Boolean) : [],
    additionalDocumentNames: Array.isArray(payload?.additionalDocumentNames) ? payload.additionalDocumentNames.filter(Boolean) : [],
    bankProofFileName: payload?.bankProofFileName || "",
    upiId: payload?.upiId || "",
    paytmNumber: payload?.paytmNumber || "",
    photoDataUrl: payload?.photoDataUrl || "",
    updatedAt: payload?.updatedAt || new Date().toISOString(),
    adminRemarks: payload?.adminRemarks || "",
  });
}

function upsertPartnerProfileLocal(profile: PartnerProfileRecord): PartnerProfileRecord {
  const all = listPartnerProfiles();
  const normalized = normalizeProfile({
    ...profile,
    updatedAt: profile.updatedAt || new Date().toISOString(),
    adminRemarks: profile.adminRemarks || "",
  });
  const index = all.findIndex((item) => item.userId === profile.userId);

  if (index >= 0) {
    all[index] = normalized;
  } else {
    all.unshift(normalized);
  }

  savePartnerProfiles(all);
  return normalized;
}

function replacePartnerProfilesForAdmin(profiles: PartnerProfileRecord[]) {
  const existing = listPartnerProfiles();
  const incomingIds = new Set(profiles.map((profile) => profile.userId));
  savePartnerProfiles([
    ...profiles,
    ...existing.filter((profile) => !incomingIds.has(profile.userId)),
  ]);
}

function profileToPayload(profile: PartnerProfileRecord): PartnerProfileDetails {
  return {
    userId: profile.userId,
    headline: profile.headline,
    bio: profile.bio,
    experienceYears: profile.experienceYears,
    skills: profile.skills,
    districts: profile.districts
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    aadhaarNumber: profile.aadhaarNumber,
    aadhaarFileName: profile.aadhaarFileName,
    certificateFileNames: profile.certificateFileNames,
    additionalDocumentNames: profile.additionalDocumentNames,
    bankProofFileName: profile.bankProofFileName,
    upiId: profile.upiId,
    paytmNumber: profile.paytmNumber,
    photoDataUrl: profile.photoDataUrl,
    completionPercent: profile.completionPercent,
    readyForProjects: profile.readyForProjects,
    updatedAt: profile.updatedAt,
    adminRemarks: profile.adminRemarks,
  };
}

function normalizeWorkerRequest(payload: any): WorkerProjectRequest {
  const profile = payload?.partnerProfile || payload || {};

  return {
    userId: profile.userId || payload?.partnerId || "",
    headline: profile.headline || "",
    bio: profile.bio || "",
    experienceYears: profile.experienceYears || 0,
    skills: profile.skills || [],
    districts: profile.districts || [],
    aadhaarNumber: profile.aadhaarNumber || "",
    aadhaarFileName: profile.aadhaarFileName || "",
    certificateFileNames: profile.certificateFileNames || [],
    additionalDocumentNames: profile.additionalDocumentNames || [],
    bankProofFileName: profile.bankProofFileName || "",
    upiId: profile.upiId || "",
    paytmNumber: profile.paytmNumber || "",
    photoDataUrl: profile.photoDataUrl || "",
    completionPercent: profile.completionPercent || 0,
    readyForProjects: Boolean(profile.readyForProjects),
    updatedAt: profile.updatedAt || payload?.updatedAt || "",
    adminRemarks: payload?.adminRemarks || "",
    id: payload?.id,
    projectId: payload?.projectId || "",
    projectTitle: payload?.projectTitle || "",
    farmerId: payload?.farmerId || "",
    farmerName: payload?.farmerName || "",
    partnerId: payload?.partnerId || profile.userId || "",
    partnerName: payload?.partnerName || "",
    message: payload?.message || "",
    status: (payload?.status as WorkerRequestStatus) || "PENDING",
    reviewedAt: payload?.reviewedAt || "",
    createdAt: payload?.createdAt || "",
  };
}

export function getPartnerProfile(userId: string): PartnerProfileRecord {
  const existing = listPartnerProfiles().find((profile) => profile.userId === userId);

  if (existing) {
    return normalizeProfile({
      ...existing,
      updatedAt: existing.updatedAt || new Date().toISOString(),
      adminRemarks: existing.adminRemarks || "",
    });
  }

  return normalizeProfile({
    userId,
    headline: "",
    bio: "",
    experienceYears: 0,
    skills: [],
    districts: "",
    aadhaarNumber: "",
    aadhaarFileName: "",
    certificateFileNames: [],
    additionalDocumentNames: [],
    bankProofFileName: "",
    upiId: "",
    paytmNumber: "",
    photoDataUrl: "",
    updatedAt: new Date().toISOString(),
    adminRemarks: "",
  });
}

export function savePartnerProfile(profile: PartnerProfileRecord): PartnerProfileRecord {
  return upsertPartnerProfileLocal(profile);
}

export async function fetchPartnerProfile(userId: string): Promise<PartnerProfileRecord> {
  try {
    const response = await apiRequest<any>({
      method: "GET",
      url: `/api/partner-profiles/${encodeURIComponent(userId)}`,
    });

    return upsertPartnerProfileLocal(normalizeApiProfile(response, userId));
  } catch {
    return getPartnerProfile(userId);
  }
}

export async function persistPartnerProfile(profile: PartnerProfileRecord): Promise<PartnerProfileRecord> {
  try {
    const response = await apiRequest<any>({
      method: "PUT",
      url: `/api/partner-profiles/${encodeURIComponent(profile.userId)}`,
      data: profileToPayload(profile),
    });

    return upsertPartnerProfileLocal(normalizeApiProfile(response, profile.userId));
  } catch (error) {
    if (!ENABLE_LOCAL_FALLBACKS) {
      throw error;
    }
    return upsertPartnerProfileLocal(profile);
  }
}

export function listPartnerProfilesForAdmin(): PartnerProfileRecord[] {
  return listPartnerProfiles()
    .map((profile) =>
      normalizeProfile({
        ...profile,
        updatedAt: profile.updatedAt || new Date().toISOString(),
        adminRemarks: profile.adminRemarks || "",
      })
    )
    .sort((left, right) => {
      const leftTime = new Date(left.updatedAt || 0).getTime();
      const rightTime = new Date(right.updatedAt || 0).getTime();
      return rightTime - leftTime;
    });
}

export async function fetchPartnerProfilesForAdmin(): Promise<PartnerProfileRecord[]> {
  try {
    const response = await apiRequest<any[]>({
      method: "GET",
      url: "/api/partner-profiles",
    });

    const normalized = (response || []).map((item) => normalizeApiProfile(item));
    replacePartnerProfilesForAdmin(normalized);
    return normalized;
  } catch {
    return listPartnerProfilesForAdmin();
  }
}

export function isPartnerProfileComplete(userId: string) {
  return getPartnerProfile(userId).readyForProjects;
}

export async function createWorkerRequest(input: CreateWorkerRequestInput): Promise<WorkerProjectRequest> {
  const response = await apiRequest<any>({
    method: "POST",
    url: "/api/partner-requests",
    data: {
      projectId: input.projectId,
      partnerId: input.partnerId,
      message: input.message,
      partnerProfile: profileToPayload(input.partnerProfile),
    },
  });

  return normalizeWorkerRequest(response);
}

export async function listAdminWorkerRequests(status?: WorkerRequestStatus | "ALL"): Promise<WorkerProjectRequest[]> {
  const query = buildQuery({
    status: status && status !== "ALL" ? status : undefined,
  });

  const response = await apiRequest<any[]>({
    method: "GET",
    url: `/api/partner-requests${query}`,
  });

  return (response || []).map(normalizeWorkerRequest);
}

export async function listPartnerWorkerRequests(partnerId: string): Promise<WorkerProjectRequest[]> {
  const response = await apiRequest<any[]>({
    method: "GET",
    url: `/api/partner-requests?partnerId=${encodeURIComponent(partnerId)}`,
  });

  return (response || []).map(normalizeWorkerRequest);
}

export async function getAdminWorkerRequestDetails(requestId: string): Promise<WorkerProjectRequest> {
  const response = await apiRequest<any>({
    method: "GET",
    url: `/api/partner-requests/${requestId}`,
  });

  return normalizeWorkerRequest(response);
}

export async function approveWorkerRequest(
  requestId: string,
  payload: WorkerRequestReviewPayload = {}
): Promise<WorkerProjectRequest> {
  const response = await apiRequest<any>({
    method: "PUT",
    url: `/api/partner-requests/${requestId}/approve`,
    data: payload,
  });

  return normalizeWorkerRequest(response);
}

export async function rejectWorkerRequest(
  requestId: string,
  payload: WorkerRequestReviewPayload = {}
): Promise<WorkerProjectRequest> {
  const response = await apiRequest<any>({
    method: "PUT",
    url: `/api/partner-requests/${requestId}/reject`,
    data: payload,
  });

  return normalizeWorkerRequest(response);
}
