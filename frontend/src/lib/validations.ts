import * as z from 'zod';

export const landDetailsSchema = z.object({
  location: z.string().min(3, 'Location must be at least 3 characters'),
  state: z.string().min(2, 'Please select a state'),
  district: z.string().min(2, 'Please select a district'),
  acreage: z.number().min(0.1, 'Acreage must be at least 0.1 acres').max(10000, 'Maximum 10,000 acres'),
  soilType: z.string().min(2, 'Please select a soil type'),
  soilPH: z.number().min(3, 'pH must be between 3 and 11').max(11, 'pH must be between 3 and 11'),
  temperature: z.number().min(0, 'Temperature must be valid').max(60, 'Temperature must be valid'),
  humidity: z.number().min(0, 'Humidity must be between 0 and 100').max(100, 'Humidity must be between 0 and 100'),
  rainfall: z.number().min(0, 'Rainfall must be valid').max(6000, 'Rainfall must be valid'),
  landOwnership: z.enum(['OWNED', 'LEASED', 'SHARED']),
});

export const cropInfoSchema = z.object({
  cropType: z.string().min(2, 'Please select a crop type'),
  cropVariety: z.string().min(2, 'Please enter crop variety'),
  expectedYield: z.number().min(1, 'Expected yield must be greater than 0'),
  yieldUnit: z.enum(['QUINTAL', 'TON', 'KG']),
  previousCrop: z.string().optional(),
  nitrogen: z.number().min(0, 'Nitrogen cannot be negative').max(250, 'Nitrogen is too high').optional(),
  phosphorus: z.number().min(0, 'Phosphorus cannot be negative').max(250, 'Phosphorus is too high').optional(),
  potassium: z.number().min(0, 'Potassium cannot be negative').max(250, 'Potassium is too high').optional(),
  organicCertified: z.boolean(),
});

export const irrigationTimelineSchema = z.object({
  irrigationMethod: z.enum(['DRIP', 'SPRINKLER', 'FLOOD', 'RAINFED', 'MIXED']),
  waterSource: z.string().min(2, 'Please select water source'),
  plantingDate: z.string().min(1, 'Please select planting date'),
  harvestDate: z.string().min(1, 'Please select harvest date'),
  duration: z.number().min(1, 'Duration must be at least 1 month'),
});

export const fundingSchema = z.object({
  seedsCost: z.number().min(0, 'Amount must be positive'),
  fertilizersCost: z.number().min(0, 'Amount must be positive'),
  pesticidesCost: z.number().min(0, 'Amount must be positive'),
  laborCost: z.number().min(0, 'Amount must be positive'),
  irrigationCost: z.number().min(0, 'Amount must be positive'),
  machineryRental: z.number().min(0, 'Amount must be positive'),
  otherCosts: z.number().min(0, 'Amount must be positive'),
  expectedRevenue: z.number().min(1, 'Expected revenue must be greater than 0'),
  minimumInvestment: z.number().min(1000, 'Minimum investment must be at least ₹1,000'),
});

export const esgFactorsSchema = z.object({
  waterUsage: z.number().min(0, 'Water usage must be positive'),
  fertilizerType: z.enum(['ORGANIC', 'INTEGRATED', 'CHEMICAL']),
  pesticideLevel: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  renewableEnergy: z.number().min(0, 'Renewable energy must be between 0 and 100').max(100, 'Renewable energy must be between 0 and 100'),
  fairWages: z.boolean(),
  workersEmployed: z.number().min(0, 'Workers employed cannot be negative').max(500, 'Workers employed is too high'),
  communityBenefit: z.number().min(0, 'Community benefit must be between 0 and 100').max(100, 'Community benefit must be between 0 and 100'),
  documentsUploaded: z.number().min(0, 'Documents uploaded cannot be negative').max(20, 'Documents uploaded is too high'),
  transparencyScore: z.number().min(0, 'Transparency score must be between 0 and 100').max(100, 'Transparency score must be between 0 and 100'),
  trustScore: z.number().min(0, 'Trust score must be between 0 and 100').max(100, 'Trust score must be between 0 and 100'),
});

export type LandDetailsForm = z.infer<typeof landDetailsSchema>;
export type CropInfoForm = z.infer<typeof cropInfoSchema>;
export type IrrigationTimelineForm = z.infer<typeof irrigationTimelineSchema>;
export type FundingForm = z.infer<typeof fundingSchema>;
export type ESGFactorsForm = z.infer<typeof esgFactorsSchema>;
