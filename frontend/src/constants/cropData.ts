export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
];

export const SOIL_TYPES = [
  { value: 'ALLUVIAL', label: 'Alluvial Soil', description: 'Rich in nutrients, ideal for various crops' },
  { value: 'BLACK', label: 'Black Soil (Regur)', description: 'High moisture retention, perfect for cotton' },
  { value: 'RED', label: 'Red Soil', description: 'Good for groundnut, pulses, millets' },
  { value: 'LATERITE', label: 'Laterite Soil', description: 'Suitable for tea, coffee, cashew' },
  { value: 'DESERT', label: 'Desert Soil', description: 'Low fertility, requires irrigation' },
  { value: 'MOUNTAIN', label: 'Mountain Soil', description: 'Good for horticulture, tea, spices' },
  { value: 'SALINE', label: 'Saline/Alkaline Soil', description: 'Requires special treatment' },
];

export const CROP_TYPES = [
  // Cereals
  { value: 'RICE', label: 'Rice (Paddy)', category: 'Cereals', season: 'Kharif/Rabi' },
  { value: 'WHEAT', label: 'Wheat', category: 'Cereals', season: 'Rabi' },
  { value: 'MAIZE', label: 'Maize (Corn)', category: 'Cereals', season: 'Kharif/Rabi' },
  { value: 'BAJRA', label: 'Bajra (Pearl Millet)', category: 'Cereals', season: 'Kharif' },
  { value: 'JOWAR', label: 'Jowar (Sorghum)', category: 'Cereals', season: 'Kharif/Rabi' },
  
  // Pulses
  { value: 'ARHAR', label: 'Arhar (Tur/Pigeon Pea)', category: 'Pulses', season: 'Kharif' },
  { value: 'MOONG', label: 'Moong (Green Gram)', category: 'Pulses', season: 'Kharif' },
  { value: 'URAD', label: 'Urad (Black Gram)', category: 'Pulses', season: 'Kharif' },
  { value: 'CHANA', label: 'Chana (Chickpea)', category: 'Pulses', season: 'Rabi' },
  { value: 'MASOOR', label: 'Masoor (Lentil)', category: 'Pulses', season: 'Rabi' },
  
  // Cash Crops
  { value: 'COTTON', label: 'Cotton', category: 'Cash Crops', season: 'Kharif' },
  { value: 'SUGARCANE', label: 'Sugarcane', category: 'Cash Crops', season: 'Year-round' },
  { value: 'JUTE', label: 'Jute', category: 'Cash Crops', season: 'Kharif' },
  { value: 'TEA', label: 'Tea', category: 'Cash Crops', season: 'Year-round' },
  { value: 'COFFEE', label: 'Coffee', category: 'Cash Crops', season: 'Year-round' },
  
  // Oilseeds
  { value: 'GROUNDNUT', label: 'Groundnut (Peanut)', category: 'Oilseeds', season: 'Kharif/Rabi' },
  { value: 'MUSTARD', label: 'Mustard', category: 'Oilseeds', season: 'Rabi' },
  { value: 'SUNFLOWER', label: 'Sunflower', category: 'Oilseeds', season: 'Kharif/Rabi' },
  { value: 'SOYBEAN', label: 'Soybean', category: 'Oilseeds', season: 'Kharif' },
  
  // Vegetables
  { value: 'TOMATO', label: 'Tomato', category: 'Vegetables', season: 'Year-round' },
  { value: 'POTATO', label: 'Potato', category: 'Vegetables', season: 'Rabi' },
  { value: 'ONION', label: 'Onion', category: 'Vegetables', season: 'Rabi/Kharif' },
  { value: 'CABBAGE', label: 'Cabbage', category: 'Vegetables', season: 'Rabi' },
  
  // Fruits
  { value: 'MANGO', label: 'Mango', category: 'Fruits', season: 'Perennial' },
  { value: 'BANANA', label: 'Banana', category: 'Fruits', season: 'Year-round' },
  { value: 'POMEGRANATE', label: 'Pomegranate', category: 'Fruits', season: 'Perennial' },
  { value: 'GRAPES', label: 'Grapes', category: 'Fruits', season: 'Perennial' },
];

export const WATER_SOURCES = [
  { value: 'NONE', label: 'No Reliable Water Source' },
  { value: 'BOREWELL', label: 'Borewell' },
  { value: 'WELL', label: 'Open Well' },
  { value: 'CANAL', label: 'Canal Irrigation' },
  { value: 'RIVER', label: 'River' },
  { value: 'POND', label: 'Pond/Tank' },
  { value: 'RAINWATER', label: 'Rainwater Harvesting' },
];

export const IRRIGATION_METHODS = [
  { 
    value: 'DRIP', 
    label: 'Drip Irrigation', 
    description: '90-95% water efficiency, ideal for fruits and vegetables',
    efficiency: 95
  },
  { 
    value: 'SPRINKLER', 
    label: 'Sprinkler System', 
    description: '70-85% water efficiency, good for cereals',
    efficiency: 80
  },
  { 
    value: 'FLOOD', 
    label: 'Flood/Surface Irrigation', 
    description: '40-60% water efficiency, traditional method',
    efficiency: 50
  },
  { 
    value: 'RAINFED', 
    label: 'Rainfed Agriculture', 
    description: 'Depends entirely on monsoon rainfall',
    efficiency: 100
  },
  { 
    value: 'MIXED', 
    label: 'Mixed Methods', 
    description: 'Combination of multiple irrigation methods',
    efficiency: 75
  },
];

export const ESG_OPTIONS = {
  fertilizerTypes: [
    { value: 'ORGANIC', label: 'Organic Inputs', description: 'Compost, bio-inputs, low synthetic dependency' },
    { value: 'INTEGRATED', label: 'Integrated Nutrient Plan', description: 'Balanced use of organic and chemical inputs' },
    { value: 'CHEMICAL', label: 'Chemical Intensive', description: 'Mostly synthetic fertilizers and crop protection' },
  ],
  pesticideLevels: [
    { value: 'LOW', label: 'Low', description: 'Targeted or biological crop protection strategy' },
    { value: 'MEDIUM', label: 'Medium', description: 'Moderate scheduled pesticide program' },
    { value: 'HIGH', label: 'High', description: 'Heavy pesticide dependence and spray frequency' },
  ],
};
