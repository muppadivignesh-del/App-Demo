export const GROWTH_STAGES = [
  { id: 'Planting', label: 'Planting', icon: '🌱', description: 'Seeds are being sown' },
  { id: 'Seedling', label: 'Seedling', icon: '🌿', description: 'Young plants emerging' },
  { id: 'Vegetative', label: 'Vegetative', icon: '🍃', description: 'Leaves and stems growing' },
  { id: 'Flowering', label: 'Flowering', icon: '🌸', description: 'Flowers developing' },
  { id: 'Fruit Development', label: 'Fruit Dev.', icon: '🫑', description: 'Fruits forming' },
  { id: 'Harvest', label: 'Harvest', icon: '🌾', description: 'Ready to harvest' },
];

export const GROWTH_STAGE_ORDER = GROWTH_STAGES.map((s) => s.id);

export const getNextStage = (currentStage) => {
  const idx = GROWTH_STAGE_ORDER.indexOf(currentStage);
  if (idx === -1 || idx === GROWTH_STAGE_ORDER.length - 1) return null;
  return GROWTH_STAGE_ORDER[idx + 1];
};

export const getStageIndex = (stage) => GROWTH_STAGE_ORDER.indexOf(stage);
