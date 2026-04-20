import { Project } from '@/types';

export const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
];

export const CROP_TYPES = [
  'Rice',
  'Wheat',
  'Cotton',
  'Sugarcane',
  'Maize',
  'Pulses',
  'Soybean',
  'Groundnut',
  'Sunflower',
  'Tea',
  'Coffee',
  'Rubber',
  'Coconut',
  'Vegetables',
  'Fruits',
  'Spices',
  'Millets',
  'Jute',
  'Tobacco',
];

export const SOIL_TYPES = [
  'Alluvial',
  'Black (Regur)',
  'Red',
  'Laterite',
  'Desert',
  'Mountain',
  'Saline',
  'Peaty',
];

export const IRRIGATION_TYPES = [
  'Drip Irrigation',
  'Sprinkler',
  'Canal',
  'Tube Well',
  'Rainfed',
  'Micro Irrigation',
];

/**
 * Keep this export to avoid breaking existing imports.
 * Do NOT use this as the data source anymore.
 * Your pages should fetch projects from backend APIs.
 */
export const MOCK_PROJECTS: Project[] = [];