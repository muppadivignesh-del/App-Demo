/**
 * Agronomic & Financial Crop Profit Calculation Utilities
 */

export const AREA_TO_ACRES = {
  acres: 1,
  hectares: 2.47105,
  guntas: 0.025, // 1 acre = 40 guntas
  bigha: 0.625,  // Standard Indian bigha
};

export const CROP_PROFIT_BENCHMARKS = {
  Tomato: {
    expectedYieldPerAcre: 8000,
    sellingPricePerKg: 25,
    seedCost: 4000,
    fertilizerCost: 6500,
    labourCost: 8000,
    irrigationCost: 2500,
    pesticideCost: 3500,
    otherCosts: 2500,
    icon: '🍅',
    category: 'Vegetables',
  },
  Chilli: {
    expectedYieldPerAcre: 1800,
    sellingPricePerKg: 45,
    seedCost: 3500,
    fertilizerCost: 7000,
    labourCost: 9500,
    irrigationCost: 3000,
    pesticideCost: 4500,
    otherCosts: 2500,
    icon: '🌶️',
    category: 'Spices',
  },
  Cotton: {
    expectedYieldPerAcre: 1000,
    sellingPricePerKg: 65,
    seedCost: 3200,
    fertilizerCost: 6000,
    labourCost: 8500,
    irrigationCost: 2000,
    pesticideCost: 5000,
    otherCosts: 2000,
    icon: '🌱',
    category: 'Commercial',
  },
  Onion: {
    expectedYieldPerAcre: 7000,
    sellingPricePerKg: 28,
    seedCost: 4500,
    fertilizerCost: 5500,
    labourCost: 7500,
    irrigationCost: 2500,
    pesticideCost: 2500,
    otherCosts: 3000,
    icon: '🧅',
    category: 'Vegetables',
  },
  Potato: {
    expectedYieldPerAcre: 9000,
    sellingPricePerKg: 18,
    seedCost: 12000,
    fertilizerCost: 7000,
    labourCost: 7000,
    irrigationCost: 3000,
    pesticideCost: 3000,
    otherCosts: 4000,
    icon: '🥔',
    category: 'Vegetables',
  },
  Rice: {
    expectedYieldPerAcre: 2400,
    sellingPricePerKg: 35,
    seedCost: 2000,
    fertilizerCost: 5000,
    labourCost: 7000,
    irrigationCost: 4000,
    pesticideCost: 2500,
    otherCosts: 2500,
    icon: '🍚',
    category: 'Grains',
  },
  Wheat: {
    expectedYieldPerAcre: 2000,
    sellingPricePerKg: 24,
    seedCost: 2200,
    fertilizerCost: 4500,
    labourCost: 5000,
    irrigationCost: 3000,
    pesticideCost: 1500,
    otherCosts: 1800,
    icon: '🌾',
    category: 'Grains',
  },
  Groundnut: {
    expectedYieldPerAcre: 1200,
    sellingPricePerKg: 60,
    seedCost: 4500,
    fertilizerCost: 4000,
    labourCost: 6000,
    irrigationCost: 2500,
    pesticideCost: 2000,
    otherCosts: 2000,
    icon: '🥜',
    category: 'Oilseeds',
  },
  Maize: {
    expectedYieldPerAcre: 2500,
    sellingPricePerKg: 20,
    seedCost: 2500,
    fertilizerCost: 4500,
    labourCost: 4500,
    irrigationCost: 2000,
    pesticideCost: 1800,
    otherCosts: 1700,
    icon: '🌽',
    category: 'Grains',
  },
  Turmeric: {
    expectedYieldPerAcre: 2200,
    sellingPricePerKg: 120,
    seedCost: 14000,
    fertilizerCost: 8000,
    labourCost: 12000,
    irrigationCost: 4000,
    pesticideCost: 3500,
    otherCosts: 4500,
    icon: '💛',
    category: 'Spices',
  },
  Sugarcane: {
    expectedYieldPerAcre: 35000,
    sellingPricePerKg: 4,
    seedCost: 8000,
    fertilizerCost: 10000,
    labourCost: 12000,
    irrigationCost: 8000,
    pesticideCost: 3000,
    otherCosts: 5000,
    icon: '🎋',
    category: 'Commercial',
  },
  Soybean: {
    expectedYieldPerAcre: 1100,
    sellingPricePerKg: 48,
    seedCost: 3000,
    fertilizerCost: 4000,
    labourCost: 5000,
    irrigationCost: 1500,
    pesticideCost: 2500,
    otherCosts: 2000,
    icon: '🌿',
    category: 'Oilseeds',
  },
  'Moong Dal': {
    expectedYieldPerAcre: 500,
    sellingPricePerKg: 90,
    seedCost: 1800,
    fertilizerCost: 2500,
    labourCost: 4000,
    irrigationCost: 1200,
    pesticideCost: 2000,
    otherCosts: 1500,
    icon: '🍲',
    category: 'Pulses',
  },
  Brinjal: {
    expectedYieldPerAcre: 6500,
    sellingPricePerKg: 22,
    seedCost: 2500,
    fertilizerCost: 5500,
    labourCost: 7000,
    irrigationCost: 2500,
    pesticideCost: 3500,
    otherCosts: 2000,
    icon: '🍆',
    category: 'Vegetables',
  },
};

/**
 * Calculate complete crop profit, revenue, cost breakdown, ROI and break-even metrics
 */
export const calculateProfit = ({
  landArea = 1,
  areaUnit = 'acres',
  costBasis = 'per_acre', // 'per_acre' | 'total'
  expectedYieldPerAcre = 0,
  sellingPricePerKg = 0,
  seedCost = 0,
  fertilizerCost = 0,
  labourCost = 0,
  irrigationCost = 0,
  pesticideCost = 0,
  otherCosts = 0,
}) => {
  const numericArea = Math.max(0.01, parseFloat(landArea) || 1);
  const areaMultiplier = AREA_TO_ACRES[areaUnit] || 1;
  const normalizedAreaInAcres = numericArea * areaMultiplier;

  // Expected production
  const yieldPerAcre = Math.max(0, parseFloat(expectedYieldPerAcre) || 0);
  const totalYield = yieldPerAcre * normalizedAreaInAcres;

  // Expected Gross Revenue
  const pricePerKg = Math.max(0, parseFloat(sellingPricePerKg) || 0);
  const expectedRevenue = totalYield * pricePerKg;

  // Base costs entered
  const rawSeed = Math.max(0, parseFloat(seedCost) || 0);
  const rawFertilizer = Math.max(0, parseFloat(fertilizerCost) || 0);
  const rawLabour = Math.max(0, parseFloat(labourCost) || 0);
  const rawIrrigation = Math.max(0, parseFloat(irrigationCost) || 0);
  const rawPesticide = Math.max(0, parseFloat(pesticideCost) || 0);
  const rawOther = Math.max(0, parseFloat(otherCosts) || 0);

  // If costBasis is 'per_acre', scale by normalized acres; if 'total', treat sum as whole farm cost
  const costScale = costBasis === 'per_acre' ? normalizedAreaInAcres : 1;

  const totalSeedCost = rawSeed * costScale;
  const totalFertilizerCost = rawFertilizer * costScale;
  const totalLabourCost = rawLabour * costScale;
  const totalIrrigationCost = rawIrrigation * costScale;
  const totalPesticideCost = rawPesticide * costScale;
  const totalOtherCosts = rawOther * costScale;

  const totalCost =
    totalSeedCost +
    totalFertilizerCost +
    totalLabourCost +
    totalIrrigationCost +
    totalPesticideCost +
    totalOtherCosts;

  // Financial performance indicators
  const estimatedProfit = expectedRevenue - totalCost;
  const profitPerAcre = normalizedAreaInAcres > 0 ? estimatedProfit / normalizedAreaInAcres : 0;
  const profitMargin = expectedRevenue > 0 ? (estimatedProfit / expectedRevenue) * 100 : 0;
  const roi = totalCost > 0 ? (estimatedProfit / totalCost) * 100 : 0;

  // Break-even metrics
  const breakEvenPricePerKg = totalYield > 0 ? totalCost / totalYield : 0;
  const breakEvenYield = pricePerKg > 0 ? totalCost / pricePerKg : 0;

  return {
    landArea: numericArea,
    areaUnit,
    costBasis,
    normalizedAreaInAcres: Math.round(normalizedAreaInAcres * 100) / 100,
    totalYield: Math.round(totalYield),
    expectedRevenue: Math.round(expectedRevenue),
    totalCost: Math.round(totalCost),
    costBreakdown: {
      seed: Math.round(totalSeedCost),
      fertilizer: Math.round(totalFertilizerCost),
      labour: Math.round(totalLabourCost),
      irrigation: Math.round(totalIrrigationCost),
      pesticide: Math.round(totalPesticideCost),
      other: Math.round(totalOtherCosts),
    },
    estimatedProfit: Math.round(estimatedProfit),
    profitPerAcre: Math.round(profitPerAcre),
    profitMargin: Math.round(profitMargin * 10) / 10,
    roi: Math.round(roi * 10) / 10,
    breakEvenPricePerKg: Math.round(breakEvenPricePerKg * 10) / 10,
    breakEvenYield: Math.round(breakEvenYield),
    isProfitable: estimatedProfit >= 0,
  };
};

/**
 * Format Indian currency: ₹1,50,000
 */
export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) return '₹0';
  const isNegative = amount < 0;
  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Math.abs(amount));
  return isNegative ? `-${formatted}` : formatted;
};

/**
 * Format number with Indian comma notation (1,00,000)
 */
export const formatIndianNumber = (num) => {
  if (num === null || num === undefined || isNaN(num)) return '0';
  return new Intl.NumberFormat('en-IN').format(num);
};
