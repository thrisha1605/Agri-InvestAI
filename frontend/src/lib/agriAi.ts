import { apiRequest } from "@/lib/api";

export type CropRecommendationRequest = {
  N: number;
  P: number;
  K: number;
  temperature: number;
  humidity: number;
  rainfall: number;
  ph: number;
};

export type CropRecommendationResponse = {
  crop: string;
  recommendedCrop: string;
  confidence: number;
  topPredictions: Array<{ crop: string; confidence: number }>;
};

export type CropAnalysisRequest = {
  cropType: string;
  soilType: string;
  acres: number;
  temperature?: number;
  humidity?: number;
  rainfall?: number;
  ph?: number;
  N?: number;
  P?: number;
  K?: number;
};

export type CropAnalysisResponse = {
  crop: string;
  cropCode: string;
  suitabilityScore: number;
  scoringBreakdown: Record<string, number>;
  baselineYieldPerAcreQuintal: number;
  expectedYield: number;
  yieldUnit: string;
  referencePricePerQuintal: number;
  costPerAcre: number;
  costEstimate: number;
  revenueEstimate: number;
  profitEstimate: number;
  riskLevel: string;
  waterUsageLevel: string;
  recommendedActions: string[];
  alternativeCrops: Array<{ crop: string; cropCode: string; score: number }>;
  aiRecommendation?: CropRecommendationResponse;
  aiRecommendationError?: string;
};

export type DiseaseDetectionResponse = {
  disease: string;
  rawLabel: string;
  confidence: number;
  crop: string;
  severity: string;
  treatment: string[];
  prevention: string[];
  topPredictions: Array<{ label: string; rawLabel: string; confidence: number }>;
};

export type EsgFormInput = {
  waterUsage: number;
  fertilizerType: "ORGANIC" | "INTEGRATED" | "CHEMICAL";
  pesticideLevel: "LOW" | "MEDIUM" | "HIGH";
  renewableEnergy: number;
  workersEmployed: number;
  fairWages: boolean;
  communityBenefit: number;
  documentsUploaded?: number;
  transparencyScore: number;
  trustScore: number;
};

export type EsgSummary = {
  environmentalScore: number;
  socialScore: number;
  governanceScore: number;
  finalESGScore: number;
  label: string;
};

export type WaterInvestmentPlan = {
  waterSource?: string;
  needsWaterInvestment: boolean;
  waterGapDetected: boolean;
  waterCost: number;
  costRangeMin: number;
  costRangeMax: number;
  label: string;
  recommendation: string;
  breakdown: Record<string, number>;
};

export async function recommendCrop(
  payload: CropRecommendationRequest,
): Promise<CropRecommendationResponse> {
  return apiRequest<CropRecommendationResponse>({
    method: "POST",
    url: "/api/ai/crop",
    data: payload,
    timeout: 30000,
    withAuth: false,
  });
}

export async function analyzeCrop(
  payload: CropAnalysisRequest,
): Promise<CropAnalysisResponse> {
  return apiRequest<CropAnalysisResponse>({
    method: "POST",
    url: "/api/ai/crop-analysis",
    data: payload,
    timeout: 30000,
    withAuth: false,
  });
}

export async function detectDisease(
  file: File,
): Promise<DiseaseDetectionResponse> {
  const formData = new FormData();
  formData.append("image", file);

  return apiRequest<DiseaseDetectionResponse>({
    method: "POST",
    url: "/api/ai/disease",
    data: formData,
    timeout: 60000,
    headers: {
      "Content-Type": "multipart/form-data",
    },
    withAuth: false,
  });
}

export async function scoreEsg(payload: EsgFormInput): Promise<EsgSummary> {
  return apiRequest<EsgSummary>({
    method: "POST",
    url: "/api/ai/esg-score",
    data: payload,
    timeout: 30000,
    withAuth: false,
  });
}

export async function fetchProjectInsights(payload: Record<string, unknown>) {
  return apiRequest<Record<string, unknown>>({
    method: "POST",
    url: "/api/ai/project-insights",
    data: payload,
    timeout: 30000,
    withAuth: false,
  });
}

export function getWaterInvestmentPlan(waterSource?: string): WaterInvestmentPlan {
  const normalized = String(waterSource || "").toUpperCase();
  const needsWaterInvestment =
    !normalized || normalized === "NONE" || normalized === "NO_WATER";

  return {
    waterSource,
    needsWaterInvestment,
    waterGapDetected: needsWaterInvestment,
    waterCost: needsWaterInvestment ? 120000 : 0,
    costRangeMin: needsWaterInvestment ? 110000 : 0,
    costRangeMax: needsWaterInvestment ? 180000 : 0,
    label: needsWaterInvestment
      ? "Water infrastructure required"
      : "Existing water source available",
    recommendation: needsWaterInvestment
      ? "Borewell installation with pump and pipes is recommended."
      : "Existing water access covers the current irrigation plan.",
    breakdown: needsWaterInvestment
      ? {
          drilling: 90000,
          pump: 20000,
          pipes: 10000,
        }
      : {},
  };
}

export function calculateLocalEsgSummary(
  payload: EsgFormInput,
): EsgSummary {
  const environmentalScore = round(
    average(
      scoreWaterUsage(payload.waterUsage),
      scoreFertilizerType(payload.fertilizerType),
      scorePesticideLevel(payload.pesticideLevel),
      clamp(payload.renewableEnergy),
    ),
  );

  const socialScore = round(
    average(
      Math.min(100, 20 + payload.workersEmployed * 14),
      payload.fairWages ? 90 : 35,
      clamp(payload.communityBenefit),
    ),
  );

  const governanceScore = round(
    average(
      Math.min(100, ((payload.documentsUploaded || 0) / 6) * 100),
      clamp(payload.transparencyScore),
      clamp(payload.trustScore),
    ),
  );

  const finalESGScore = round(
    environmentalScore * 0.4 +
      socialScore * 0.3 +
      governanceScore * 0.3,
  );

  return {
    environmentalScore,
    socialScore,
    governanceScore,
    finalESGScore,
    label:
      finalESGScore >= 75
        ? "Excellent"
        : finalESGScore >= 50
          ? "Medium"
          : "Poor",
  };
}

function scoreWaterUsage(value: number) {
  if (value <= 120000) return 95;
  if (value <= 180000) return 80;
  if (value <= 250000) return 65;
  if (value <= 320000) return 50;
  return 30;
}

function scoreFertilizerType(value: string) {
  if (value === "ORGANIC") return 95;
  if (value === "INTEGRATED") return 78;
  return 40;
}

function scorePesticideLevel(value: string) {
  if (value === "LOW") return 90;
  if (value === "MEDIUM") return 65;
  return 35;
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, Number(value || 0)));
}

function average(...values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function round(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
