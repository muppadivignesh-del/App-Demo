import { useState, useEffect, useMemo } from 'react';
import AppLayout from '../components/layout/AppLayout';
import { useAuth } from '../context/AuthContext';
import { useCrops } from '../context/CropContext';
import { fetchWeatherForLocation } from '../services/weatherService';
import { marketAPI } from '../services/marketAPI';
import { SOIL_TYPES, WATER_AVAILABILITY } from '../constants/farmConstants';

// Agronomic crop database calibrated for Indian agro-climatic zones
const CROP_DATABASE = [
  {
    name: 'Tomato',
    icon: '🍅',
    category: 'Vegetables',
    suitableSoils: ['Loamy', 'Sandy Loam', 'Red Sandy', 'Alluvial'],
    suitableWater: ['Borewell', 'Canal', 'River'],
    waterNeed: 'Medium',
    waterRequirementLevel: 'medium',
    durationDays: '90 - 110 Days',
    durationCategory: 'short',
    yieldPerAcre: '200 - 280 Quintals',
    estProfitPerAcre: '₹75,000 - ₹1,25,000',
    profitScore: 88,
    marketDemand: 'High',
    weatherTempRange: [18, 33],
    advice: 'Stake vines early. Mulch to retain soil moisture and reduce blossom-end rot.',
    pests: ['Fruit Borer', 'Whitefly', 'Early Blight'],
    reasonWhy: 'High consumer market demand with strong retail pricing in APMC mandis. Matches well with loamy and sandy soils under drip irrigation.',
  },
  {
    name: 'Chilli',
    icon: '🌶️',
    category: 'Spices / Cash Crop',
    suitableSoils: ['Black Cotton', 'Loamy', 'Red Sandy', 'Sandy Loam'],
    suitableWater: ['Borewell', 'Canal', 'River', 'Pond'],
    waterNeed: 'Medium',
    waterRequirementLevel: 'medium',
    durationDays: '130 - 150 Days',
    durationCategory: 'medium',
    yieldPerAcre: '16 - 22 Quintals (Dry)',
    estProfitPerAcre: '₹85,000 - ₹1,40,000',
    profitScore: 92,
    marketDemand: 'High',
    weatherTempRange: [20, 35],
    advice: 'Seedling root dip in Trichoderma. Yellow sticky traps for thrips management.',
    pests: ['Thrips', 'Mites', 'Fruit Borer'],
    reasonWhy: 'Excellent cash crop for regional agro-climates with strong export and spice mill demand. Thrives in well-drained loamy or black soil.',
  },
  {
    name: 'Moong Dal',
    icon: '🍲',
    category: 'Pulses / Short Duration',
    suitableSoils: ['Loamy', 'Alluvial', 'Black Cotton', 'Red Sandy'],
    suitableWater: ['Rain-fed', 'Borewell', 'Limited'],
    waterNeed: 'Low',
    waterRequirementLevel: 'low',
    durationDays: '60 - 70 Days',
    durationCategory: 'short',
    yieldPerAcre: '6 - 9 Quintals',
    estProfitPerAcre: '₹28,000 - ₹45,000',
    profitScore: 75,
    marketDemand: 'High',
    weatherTempRange: [22, 36],
    advice: 'Shortest 65-day duration pulse crop. Enriches soil fertility through atmospheric nitrogen fixation.',
    pests: ['Yellow Mosaic Virus', 'Pod Borer'],
    reasonWhy: 'Lowest water requirement with short duration turnaround. High MSP and excellent soil rejuvenation before subsequent cropping.',
  },
  {
    name: 'Cotton',
    icon: '🌱',
    category: 'Fiber / Commercial',
    suitableSoils: ['Black Cotton', 'Alluvial', 'Clay'],
    suitableWater: ['Borewell', 'Canal', 'Rain-fed'],
    waterNeed: 'Medium',
    waterRequirementLevel: 'medium',
    durationDays: '150 - 180 Days',
    durationCategory: 'long',
    yieldPerAcre: '10 - 15 Quintals',
    estProfitPerAcre: '₹55,000 - ₹95,000',
    profitScore: 82,
    marketDemand: 'High',
    weatherTempRange: [21, 38],
    advice: 'Deep summer ploughing and pheromone traps for pink bollworm management.',
    pests: ['Pink Bollworm', 'Aphids', 'Whitefly'],
    reasonWhy: 'Deep root system ideal for Black Cotton soil moisture retention. High trading volume in regional mandis above government MSP.',
  },
  {
    name: 'Onion',
    icon: '🧅',
    category: 'Vegetables / Bulbs',
    suitableSoils: ['Loamy', 'Alluvial', 'Red Sandy'],
    suitableWater: ['Borewell', 'Canal', 'River'],
    waterNeed: 'Medium',
    waterRequirementLevel: 'medium',
    durationDays: '110 - 130 Days',
    durationCategory: 'medium',
    yieldPerAcre: '100 - 140 Quintals',
    estProfitPerAcre: '₹60,000 - ₹1,15,000',
    profitScore: 86,
    marketDemand: 'High',
    weatherTempRange: [15, 32],
    advice: 'Stop watering 12-15 days before harvest for superior bulb drying and shelf life.',
    pests: ['Onion Thrips', 'Purple Blotch'],
    reasonWhy: 'High retail market liquidity and strong historical price peaks. Moderate water need with consistent wholesale demand.',
  },
  {
    name: 'Groundnut',
    icon: '🥜',
    category: 'Oilseeds / Legumes',
    suitableSoils: ['Red Sandy', 'Sandy Loam', 'Loamy'],
    suitableWater: ['Rain-fed', 'Borewell', 'Canal'],
    waterNeed: 'Low-Medium',
    waterRequirementLevel: 'low',
    durationDays: '105 - 120 Days',
    durationCategory: 'medium',
    yieldPerAcre: '12 - 18 Quintals',
    estProfitPerAcre: '₹40,000 - ₹68,000',
    profitScore: 78,
    marketDemand: 'Medium',
    weatherTempRange: [20, 34],
    advice: 'Apply gypsum at 200 kg/acre at flowering stage for dense pod filling and kernel weight.',
    pests: ['Tikka Disease', 'Leaf Miner', 'White Grub'],
    reasonWhy: 'Very resilient to dry spells with modest water requirements. Excellent nitrogen fixation for sandy and loamy soils.',
  },
  {
    name: 'Turmeric',
    icon: '💛',
    category: 'Spices / High Value',
    suitableSoils: ['Loamy', 'Red Sandy', 'Alluvial'],
    suitableWater: ['Borewell', 'Canal'],
    waterNeed: 'High',
    waterRequirementLevel: 'high',
    durationDays: '210 - 240 Days',
    durationCategory: 'long',
    yieldPerAcre: '20 - 28 Quintals (Cured)',
    estProfitPerAcre: '₹1,10,000 - ₹1,80,000',
    profitScore: 95,
    marketDemand: 'High',
    weatherTempRange: [20, 35],
    advice: 'Ridge and furrow planting prevents rhizome root rot. Organic mulch preserves moisture.',
    pests: ['Rhizome Rot', 'Shoot Borer'],
    reasonWhy: 'Highest estimated gross return per acre for irrigated farms with deep loamy soil. Growing domestic and international export bids.',
  },
  {
    name: 'Wheat',
    icon: '🌾',
    category: 'Food Grain',
    suitableSoils: ['Alluvial', 'Loamy', 'Clay'],
    suitableWater: ['Canal', 'Borewell'],
    waterNeed: 'Medium',
    waterRequirementLevel: 'medium',
    durationDays: '120 - 135 Days',
    durationCategory: 'medium',
    yieldPerAcre: '18 - 25 Quintals',
    estProfitPerAcre: '₹35,000 - ₹55,000',
    profitScore: 72,
    marketDemand: 'High',
    weatherTempRange: [12, 28],
    advice: 'Crown root initiation (CRI at 21 days) is critical. Do not skip first irrigation.',
    pests: ['Yellow Rust', 'Termites', 'Aphids'],
    reasonWhy: 'Guaranteed government MSP purchase and stable consumption demand. Predictable cultivation cycle and costs.',
  },
  {
    name: 'Maize',
    icon: '🌽',
    category: 'Coarse Cereal / Fodder',
    suitableSoils: ['Loamy', 'Sandy Loam', 'Alluvial', 'Red Sandy'],
    suitableWater: ['Borewell', 'Canal', 'Rain-fed'],
    waterNeed: 'Medium',
    waterRequirementLevel: 'medium',
    durationDays: '95 - 110 Days',
    durationCategory: 'short',
    yieldPerAcre: '22 - 30 Quintals',
    estProfitPerAcre: '₹32,000 - ₹52,000',
    profitScore: 76,
    marketDemand: 'Medium',
    weatherTempRange: [18, 35],
    advice: 'Ensure adequate drainage; maize is sensitive to waterlogging at seedling stage.',
    pests: ['Fall Armyworm', 'Stem Borer'],
    reasonWhy: 'Rapid growth cycle with strong demand from regional poultry feed millers. Tolerates varying soil moisture conditions.',
  },
];

// Q&A answers for agronomic assistant tab
const ADVISOR_KNOWLEDGE = [
  {
    keywords: ['leaf curl', 'curl', 'chilli disease', 'tomato disease'],
    title: 'Integrated Leaf Curl Management',
    response: `Leaf curl virus is vector-transmitted by whiteflies and thrips:
1. **Preventive Spray**: Spray Neem oil (10,000 ppm) at 3 ml/litre of water every 7-10 days.
2. **Sticky Traps**: Place 8-10 yellow and blue sticky traps per acre at crop canopy height.
3. **Targeted Control**: If pest threshold exceeds 5 whiteflies/leaf, spray Diafenthiuron 50% WP (1.2 g/L) or Imidacloprid 17.8% SL (0.5 ml/L).
4. **Sanitation**: Uproot severely stunted viral plants immediately to protect adjoining beds.`,
  },
  {
    keywords: ['fertilizer', 'urea', 'dap', 'npk', 'dosage', 'manure'],
    title: 'Scientific NPK Application Schedule',
    response: `Balanced nutrient management prevents lodging and boosts yields:
1. **Basal Dose**: Apply all Phosphorus (DAP/SSP), 50% Potash (MOP), and 25% Nitrogen at sowing.
2. **First Top Dressing**: Apply 50% Nitrogen (Urea) 30-35 days after planting during peak vegetative growth.
3. **Second Top Dressing**: Apply remaining 25% Nitrogen + 50% Potash at flower initiation and pod/fruit filling.
4. **Organic Foundation**: Incorporate 5-6 tonnes of well-rotted FYM or 1 tonne vermicompost during final field preparation.`,
  },
  {
    keywords: ['drip', 'irrigation', 'water', 'frequency', 'summer'],
    title: 'Micro-Irrigation & Water Conservation',
    response: `Drip irrigation improves crop water efficiency by 30-40%:
1. **Operating Window**: Run 1.5 - 2.5 hours every alternate day based on soil moisture and ambient temperature.
2. **Optimal Timing**: Early morning (6:00 AM - 9:00 AM) or late evening to minimize surface evaporation.
3. **Mulching**: 25-micron silver-black plastic mulch or straw mulch cuts soil moisture loss by up to 45%.
4. **Critical Stages**: Keep root zones consistently moist during flowering and fruit setting.`,
  },
  {
    keywords: ['pest', 'borer', 'caterpillar', 'spray', 'insects', 'bollworm'],
    title: 'Integrated Pest Management (IPM)',
    response: `Integrated bio-chemical pest control:
1. **Pheromone Traps**: Install 5 traps per acre for early pest detection.
2. **Bio-Agents**: Spray *Bacillus thuringiensis* (Bt) at 2 g/L or *Beauveria bassiana* for early instar caterpillars.
3. **Targeted Spray**: For fruit/pod borer, apply Emamectin Benzoate 5% SG at 0.5 g/litre of water.
4. **Harvest Interval**: Maintain mandatory 7-day waiting period between chemical spray and harvesting.`,
  },
];

const CATEGORY_FILTERS = [
  { id: 'all', label: '⭐ All Recommended' },
  { id: 'high_demand', label: '🌾 High Demand' },
  { id: 'low_water', label: '💧 Low Water Need' },
  { id: 'short_duration', label: '⚡ Short Duration' },
  { id: 'weather_suitable', label: '🌦 Weather Suitable' },
  { id: 'high_profit', label: '📈 High Potential Returns' },
];

const CropAdvisorPage = () => {
  const { farmer } = useAuth();
  const { activeCrops } = useCrops();

  const farmerSoilDefault = farmer?.soilType || farmer?.landDetails?.soilType || 'Loamy';
  const farmerWaterDefault = farmer?.waterAvailability || farmer?.landDetails?.waterAvailability || 'Borewell';
  const farmerAreaDefault = farmer?.landArea || farmer?.landDetails?.totalArea || 2.5;
  const districtDefault = farmer?.location?.district || farmer?.district || 'Guntur';
  const stateDefault = farmer?.location?.state || farmer?.state || 'Andhra Pradesh';

  // Interactive inputs state
  const [soilType, setSoilType] = useState(farmerSoilDefault);
  const [waterAvailability, setWaterAvailability] = useState(farmerWaterDefault);
  const [landArea, setLandArea] = useState(farmerAreaDefault);
  const [weatherData, setWeatherData] = useState(null);
  const [marketDataList, setMarketDataList] = useState([]);

  // Active view tab
  const [activeTab, setActiveTab] = useState('advisor'); // 'advisor' | 'chat' | 'calculator'
  const [categoryFilter, setCategoryFilter] = useState('all');

  // AI Chat state
  const [chatQuery, setChatQuery] = useState('');
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: `Hello ${farmer?.name?.split(' ')[0] || 'Farmer'}! 👋 I am your AgroSelf Decision Support Advisor. I have loaded your farm profile (${soilType} soil, ${waterAvailability} water, ${landArea} acres). How can I assist your crop planning today?`,
      time: 'Just now',
    },
  ]);

  // Fertilizer calculator state
  const [calcCrop, setCalcCrop] = useState('Tomato');
  const [calcAcres, setCalcAcres] = useState(landArea || 1);

  // Load weather and market data on mount
  useEffect(() => {
    let isMounted = true;
    fetchWeatherForLocation(districtDefault, stateDefault).then((res) => {
      if (isMounted) setWeatherData(res);
    });
    marketAPI.getAllMarketData().then((res) => {
      if (isMounted && res.data?.data?.marketData) {
        setMarketDataList(res.data.data.marketData);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [districtDefault, stateDefault]);

  // Rule-based recommendation engine incorporating all 6 required categories
  const scoredRecommendations = useMemo(() => {
    const currentTemp = weatherData?.current?.temp ?? 29;
    const rainProb = weatherData?.current?.rainProbability ?? 25;

    return CROP_DATABASE.map((crop) => {
      let score = 65;
      const matchedMarket = marketDataList.find(
        (m) => m.cropName.toLowerCase() === crop.name.toLowerCase()
      );

      // 1. Soil Suitability (+15)
      const soilMatch = crop.suitableSoils.includes(soilType);
      if (soilMatch) score += 15;

      // 2. Water Suitability (+12)
      const waterMatch = crop.suitableWater.includes(waterAvailability);
      if (waterMatch) score += 12;

      // 3. Market Demand (+8)
      const hasHighDemand =
        crop.marketDemand === 'High' || matchedMarket?.demandLevel === 'High';
      if (hasHighDemand) score += 8;

      // 4. Weather Suitability (+8)
      const isWeatherSuitable =
        currentTemp >= crop.weatherTempRange[0] &&
        currentTemp <= crop.weatherTempRange[1] &&
        (rainProb < 75 || crop.waterRequirementLevel !== 'low');
      if (isWeatherSuitable) score += 8;

      // 5. Short duration boost if limited water
      if (waterAvailability === 'Rain-fed' || waterAvailability === 'Limited') {
        if (crop.waterRequirementLevel === 'low') score += 10;
        if (crop.durationCategory === 'short') score += 6;
      }

      // 6. Crop rotation bonus: if farmer is already growing this crop, slightly de-prioritize for disease rotation
      const currentlyGrowing = activeCrops.some(
        (c) => c.cropName.toLowerCase() === crop.name.toLowerCase()
      );
      if (currentlyGrowing) score -= 4;

      const finalScore = Math.min(99, Math.max(60, score));

      // Category tags mapping
      const badges = [];
      if (finalScore >= 90) badges.push('⭐ Recommended Option');
      if (hasHighDemand) badges.push('🌾 High Demand');
      if (crop.waterRequirementLevel === 'low') badges.push('💧 Low Water Requirement');
      if (crop.durationCategory === 'short') badges.push('⚡ Short Duration');
      if (isWeatherSuitable) badges.push('🌦 Weather Suitable');
      if (crop.profitScore >= 85) badges.push('📈 High Potential Returns');

      return {
        ...crop,
        score: finalScore,
        marketPrice: matchedMarket ? `₹${matchedMarket.pricePerKg}/kg` : null,
        badges,
        hasHighDemand,
        isLowWater: crop.waterRequirementLevel === 'low',
        isShortDuration: crop.durationCategory === 'short',
        isWeatherSuitable,
        isHighProfit: crop.profitScore >= 85,
        isTopMatch: finalScore >= 90,
      };
    }).sort((a, b) => b.score - a.score);
  }, [soilType, waterAvailability, weatherData, marketDataList, activeCrops]);

  // Filtered by selected category pill
  const filteredCrops = useMemo(() => {
    if (categoryFilter === 'all') return scoredRecommendations;
    if (categoryFilter === 'high_demand') return scoredRecommendations.filter((c) => c.hasHighDemand);
    if (categoryFilter === 'low_water') return scoredRecommendations.filter((c) => c.isLowWater);
    if (categoryFilter === 'short_duration') return scoredRecommendations.filter((c) => c.isShortDuration);
    if (categoryFilter === 'weather_suitable') return scoredRecommendations.filter((c) => c.isWeatherSuitable);
    if (categoryFilter === 'high_profit') return scoredRecommendations.filter((c) => c.isHighProfit);
    return scoredRecommendations;
  }, [scoredRecommendations, categoryFilter]);

  const handleGetRecommendations = (e) => {
    if (e) e.preventDefault();
    setAnalyzed(true);
  };

  const handleSendMessage = (customText) => {
    const textToSend = (customText || chatQuery).trim();
    if (!textToSend) return;

    const userMsg = { sender: 'user', text: textToSend, time: 'Just now' };
    setMessages((prev) => [...prev, userMsg]);
    if (!customText) setChatQuery('');

    const lower = textToSend.toLowerCase();
    const match = ADVISOR_KNOWLEDGE.find((item) =>
      item.keywords.some((k) => lower.includes(k))
    );

    let replyText = '';
    if (match) {
      replyText = `**${match.title}**\n\n${match.response}`;
    } else {
      replyText = `For **${soilType} soil** and **${waterAvailability} irrigation** in ${districtDefault}:\n\nBased on regional agronomic datasets, prioritize certified seeds with Trichoderma bio-seed treatment. Maintain balanced NPK nutrition and scout early for sucking pests. You can ask me specific questions about fertilizer dosage, pest remedies, or watering schedules!`;
    }

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { sender: 'ai', text: replyText, time: 'Just now' },
      ]);
    }, 350);
  };

  // NPK calculation for Tab 3
  const npkFormulas = {
    Tomato: { urea: 130, dap: 110, mop: 85 },
    Chilli: { urea: 140, dap: 130, mop: 100 },
    Cotton: { urea: 150, dap: 120, mop: 90 },
    Onion: { urea: 110, dap: 110, mop: 120 },
    Groundnut: { urea: 25, dap: 90, mop: 65 },
    Wheat: { urea: 130, dap: 130, mop: 65 },
    Turmeric: { urea: 180, dap: 130, mop: 200 },
    'Moong Dal': { urea: 20, dap: 85, mop: 35 },
    Maize: { urea: 140, dap: 120, mop: 75 },
  };

  const currentNPK = npkFormulas[calcCrop] || npkFormulas.Tomato;
  const ureaTotal = Math.round(currentNPK.urea * (parseFloat(calcAcres) || 1));
  const dapTotal = Math.round(currentNPK.dap * (parseFloat(calcAcres) || 1));
  const mopTotal = Math.round(currentNPK.mop * (parseFloat(calcAcres) || 1));

  return (
    <AppLayout
      title="AI Crop Advisor"
      subtitle="Agronomic decision-support tool tailored to your local soil, water & climate"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

        {/* ── Sub Navigation Tabs ── */}
        <div style={{ display: 'flex', background: '#e2e8e2', padding: '0.25rem', borderRadius: '12px', gap: '0.25rem' }}>
          <button
            type="button"
            id="tab-suitability"
            className={`btn btn-sm ${activeTab === 'advisor' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('advisor')}
            style={{ flex: 1, borderRadius: '10px', fontSize: '0.82rem', fontWeight: 700 }}
          >
            🌾 Decision Support
          </button>
          <button
            type="button"
            id="tab-chat"
            className={`btn btn-sm ${activeTab === 'chat' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('chat')}
            style={{ flex: 1, borderRadius: '10px', fontSize: '0.82rem', fontWeight: 700 }}
          >
            💬 Agronomist Q&A
          </button>
          <button
            type="button"
            id="tab-fertilizer"
            className={`btn btn-sm ${activeTab === 'calculator' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('calculator')}
            style={{ flex: 1, borderRadius: '10px', fontSize: '0.82rem', fontWeight: 700 }}
          >
            🧪 Fertilizer Calculator
          </button>
        </div>

        {/* ── TAB 1: DECISION SUPPORT RECOMMENDATION ENGINE ── */}
        {activeTab === 'advisor' && (
          <>
            {/* Input Cards: Soil, Water, Land, Current Weather */}
            <div className="card" style={{ padding: '1.25rem' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                🚜 Farm Conditions & Meteorological Inputs
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                Pre-filled from your profile and regional weather. Adjust any parameter and click [ Get Recommendations ].
              </p>

              <form onSubmit={handleGetRecommendations} id="advisor-inputs-form">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                  {/* Soil Type Card */}
                  <div style={{ background: '#f8faf8', padding: '0.75rem', borderRadius: '12px', border: '1px solid #e2e8e2' }}>
                    <label htmlFor="advisor-soil" style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                      🟤 Soil Type
                    </label>
                    <select
                      id="advisor-soil"
                      className="form-input form-select"
                      value={soilType}
                      onChange={(e) => setSoilType(e.target.value)}
                      style={{ fontSize: '0.85rem', padding: '0.45rem 0.65rem' }}
                    >
                      {SOIL_TYPES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  {/* Water Availability Card */}
                  <div style={{ background: '#f8faf8', padding: '0.75rem', borderRadius: '12px', border: '1px solid #e2e8e2' }}>
                    <label htmlFor="advisor-water" style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                      💧 Water Availability
                    </label>
                    <select
                      id="advisor-water"
                      className="form-input form-select"
                      value={waterAvailability}
                      onChange={(e) => setWaterAvailability(e.target.value)}
                      style={{ fontSize: '0.85rem', padding: '0.45rem 0.65rem' }}
                    >
                      {WATER_AVAILABILITY.map((w) => (
                        <option key={w} value={w}>{w}</option>
                      ))}
                    </select>
                  </div>

                  {/* Land Area Card */}
                  <div style={{ background: '#f8faf8', padding: '0.75rem', borderRadius: '12px', border: '1px solid #e2e8e2' }}>
                    <label htmlFor="advisor-area" style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                      🌾 Land Area (Acres)
                    </label>
                    <input
                      id="advisor-area"
                      type="number"
                      className="form-input"
                      value={landArea}
                      onChange={(e) => setLandArea(e.target.value)}
                      min="0.1"
                      step="0.5"
                      style={{ fontSize: '0.85rem', padding: '0.45rem 0.65rem' }}
                    />
                  </div>

                  {/* Weather Snapshot Card */}
                  <div style={{ background: '#f8faf8', padding: '0.75rem', borderRadius: '12px', border: '1px solid #e2e8e2' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                      🌦 Current Weather ({districtDefault})
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.35rem 0' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {weatherData ? `${weatherData.current?.temp}°C · ${weatherData.current?.condition}` : '29°C · Clear'}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#0284c7', fontWeight: 600 }}>
                        ☂️ {weatherData?.current?.rainProbability ?? 20}% Rain
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  id="get-recommendations-btn"
                  className="btn btn-primary btn-full btn-lg"
                  style={{ marginTop: '1rem' }}
                >
                  🤖 Get Crop Recommendations
                </button>
              </form>
            </div>

            {/* ── Category Filter Pills ── */}
            <div>
              <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
                {CATEGORY_FILTERS.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryFilter(cat.id)}
                    style={{
                      flexShrink: 0,
                      fontSize: '0.76rem',
                      padding: '0.35rem 0.8rem',
                      borderRadius: '16px',
                      border: categoryFilter === cat.id ? '1.5px solid #1e6b3c' : '1px solid #d1d5db',
                      background: categoryFilter === cat.id ? '#1e6b3c' : '#ffffff',
                      color: categoryFilter === cat.id ? '#ffffff' : '#374151',
                      fontWeight: categoryFilter === cat.id ? 700 : 500,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Recommendation Results ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Suitability Results ({filteredCrops.length} Crops)
                </h3>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Evaluated against {soilType} Soil & {waterAvailability} Water
                </span>
              </div>

              {filteredCrops.map((crop) => (
                <div
                  key={crop.name}
                  className="card recommendation-card"
                  style={{
                    borderRadius: '16px',
                    padding: '1.25rem',
                    border: crop.score >= 90 ? '1.5px solid #2d7d46' : '1px solid #e5e7eb',
                    background: crop.score >= 90 ? '#fafffc' : '#ffffff',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontSize: '2.4rem' }}>{crop.icon}</span>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                          <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                            {crop.name}
                          </h4>
                          {crop.score >= 90 && (
                            <span style={{ fontSize: '0.65rem', background: '#dcfce7', color: '#166534', padding: '0.12rem 0.5rem', borderRadius: '10px', fontWeight: 800 }}>
                              ⭐ BEST OVERALL
                            </span>
                          )}
                          {crop.marketPrice && (
                            <span style={{ fontSize: '0.7rem', color: '#166534', fontWeight: 700, background: '#f0fdf4', padding: '0.1rem 0.4rem', borderRadius: '6px' }}>
                              Mandi: {crop.marketPrice}
                            </span>
                          )}
                        </div>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0.1rem 0 0' }}>
                          {crop.category} · Duration: {crop.durationDays}
                        </p>
                      </div>
                    </div>

                    <div
                      style={{
                        background: crop.score >= 90 ? '#dcfce7' : crop.score >= 75 ? '#dbeafe' : '#fef9c3',
                        color: crop.score >= 90 ? '#166534' : crop.score >= 75 ? '#1e40af' : '#854d0e',
                        fontWeight: 800,
                        fontSize: '0.85rem',
                        padding: '0.25rem 0.7rem',
                        borderRadius: '12px',
                        textAlign: 'center',
                      }}
                    >
                      {crop.score}% Match
                    </div>
                  </div>

                  {/* Category Tags */}
                  <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', margin: '0.65rem 0' }}>
                    {crop.badges.map((b) => (
                      <span
                        key={b}
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          padding: '0.15rem 0.5rem',
                          borderRadius: '8px',
                          background: '#f1f5f2',
                          color: '#235c36',
                          border: '1px solid #d8e2d9',
                        }}
                      >
                        {b}
                      </span>
                    ))}
                  </div>

                  {/* Why this crop was recommended */}
                  <div
                    style={{
                      background: '#f8faf8',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '10px',
                      border: '1px solid #e2e8e2',
                      margin: '0.5rem 0',
                    }}
                  >
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-primary)', margin: 0, lineHeight: 1.45 }}>
                      <strong>Why Recommended:</strong> {crop.reasonWhy}
                    </p>
                  </div>

                  {/* Key agronomic metrics */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: '0.5rem',
                      margin: '0.65rem 0',
                      background: '#ffffff',
                      border: '1px solid #f0f0f0',
                      padding: '0.6rem',
                      borderRadius: '10px',
                      textAlign: 'center',
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Water Need</span>
                      <p style={{ fontSize: '0.82rem', fontWeight: 700, margin: '0.1rem 0 0', color: 'var(--text-primary)' }}>
                        {crop.waterNeed}
                      </p>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Est. Yield / Acre</span>
                      <p style={{ fontSize: '0.82rem', fontWeight: 700, margin: '0.1rem 0 0', color: 'var(--text-primary)' }}>
                        {crop.yieldPerAcre}
                      </p>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>High Potential Profit</span>
                      <p style={{ fontSize: '0.82rem', fontWeight: 700, margin: '0.1rem 0 0', color: '#166534' }}>
                        {crop.estProfitPerAcre}*
                      </p>
                    </div>
                  </div>

                  {/* Agronomic advisory tip */}
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4, margin: '0.35rem 0 0' }}>
                    💡 <strong>Field Practice:</strong> {crop.advice}
                  </p>
                </div>
              ))}
            </div>

            {/* Mandatory Non-Guaranteed Profit Disclaimer */}
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '0.75rem', fontStyle: 'italic' }}>
              * DISCLAIMER: All profit ranges and crop yields are estimated based on regional historical averages and available market datasets. Actual returns depend on local weather, soil biology, pest occurrences, and market price fluctuations.
            </p>
          </>
        )}

        {/* ── TAB 2: AGRONOMIST Q&A CHAT ── */}
        {activeTab === 'chat' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {/* Quick Prompt Pills */}
            <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '0.2rem' }}>
              {[
                '🌱 Best crops for my soil & water',
                '🐛 How to control leaf curl & thrips?',
                '🧪 NPK fertilizer schedule for 1 acre',
                '💧 Smart drip irrigation frequency',
              ].map((p, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSendMessage(p)}
                  style={{
                    flexShrink: 0,
                    fontSize: '0.75rem',
                    padding: '0.35rem 0.75rem',
                    borderRadius: '20px',
                    border: '1px solid #d1d5db',
                    background: '#ffffff',
                    cursor: 'pointer',
                  }}
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Message Thread */}
            <div
              className="card"
              style={{
                minHeight: '340px',
                maxHeight: '460px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                padding: '1rem',
              }}
            >
              {messages.map((m, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    justifyContent: m.sender === 'user' ? 'flex-end' : 'flex-start',
                  }}
                >
                  <div
                    className={m.sender === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}
                    style={{
                      maxWidth: '82%',
                      padding: '0.75rem 1rem',
                      borderRadius: m.sender === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      background: m.sender === 'user' ? '#173d24' : '#f1f5f2',
                      color: m.sender === 'user' ? '#ffffff' : '#1a3d25',
                      fontSize: '0.84rem',
                      lineHeight: 1.5,
                      whiteSpace: 'pre-line',
                    }}
                  >
                    {m.text}
                    <span
                      style={{
                        display: 'block',
                        fontSize: '0.65rem',
                        opacity: 0.7,
                        marginTop: '0.35rem',
                        textAlign: m.sender === 'user' ? 'right' : 'left',
                      }}
                    >
                      {m.time}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Input Row */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              style={{ display: 'flex', gap: '0.5rem' }}
            >
              <input
                type="text"
                id="chat-input"
                className="form-input"
                placeholder="Ask about pest control, fertilizers, soil prep..."
                value={chatQuery}
                onChange={(e) => setChatQuery(e.target.value)}
                style={{ flex: 1, borderRadius: '12px' }}
              />
              <button
                type="submit"
                id="send-chat-btn"
                className="btn btn-primary"
                style={{ borderRadius: '12px', padding: '0 1.25rem' }}
              >
                Send
              </button>
            </form>
          </div>
        )}

        {/* ── TAB 3: FERTILIZER CALCULATOR ── */}
        {activeTab === 'calculator' && (
          <div className="card" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
              🧪 NPK Fertilizer Dosage Estimator
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Calculate baseline Urea, DAP, and MOP requirements for your crop acreage.
            </p>

            <div className="form-row-2">
              <div className="form-group" style={{ flex: 2 }}>
                <label htmlFor="calc-crop" className="form-label">Crop</label>
                <select
                  id="calc-crop"
                  className="form-input form-select"
                  value={calcCrop}
                  onChange={(e) => setCalcCrop(e.target.value)}
                >
                  {Object.keys(npkFormulas).map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ flex: 1 }}>
                <label htmlFor="calc-acres" className="form-label">Land Area (Acres)</label>
                <input
                  id="calc-acres"
                  type="number"
                  className="form-input"
                  value={calcAcres}
                  onChange={(e) => setCalcAcres(e.target.value)}
                  min="0.5"
                  step="0.5"
                />
              </div>
            </div>

            {/* Results Grid */}
            <div
              className="npk-result-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '0.75rem',
                marginTop: '1.25rem',
                textAlign: 'center',
              }}
            >
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '1rem 0.5rem', borderRadius: '12px' }}>
                <p style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 700, margin: 0 }}>Urea (Nitrogen)</p>
                <p style={{ fontSize: '1.35rem', fontWeight: 800, color: '#14532d', margin: '0.35rem 0 0.1rem' }}>
                  {ureaTotal} kg
                </p>
                <p style={{ fontSize: '0.68rem', color: '#166534', margin: 0 }}>~{Math.ceil(ureaTotal / 45)} bags (45kg)</p>
              </div>

              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '1rem 0.5rem', borderRadius: '12px' }}>
                <p style={{ fontSize: '0.75rem', color: '#1e40af', fontWeight: 700, margin: 0 }}>DAP (Phosphorus)</p>
                <p style={{ fontSize: '1.35rem', fontWeight: 800, color: '#1e3a8a', margin: '0.35rem 0 0.1rem' }}>
                  {dapTotal} kg
                </p>
                <p style={{ fontSize: '0.68rem', color: '#1e40af', margin: 0 }}>~{Math.ceil(dapTotal / 50)} bags (50kg)</p>
              </div>

              <div style={{ background: '#fefce8', border: '1px solid #fef08a', padding: '1rem 0.5rem', borderRadius: '12px' }}>
                <p style={{ fontSize: '0.75rem', color: '#854d0e', fontWeight: 700, margin: 0 }}>MOP (Potash)</p>
                <p style={{ fontSize: '1.35rem', fontWeight: 800, color: '#713f12', margin: '0.35rem 0 0.1rem' }}>
                  {mopTotal} kg
                </p>
                <p style={{ fontSize: '0.68rem', color: '#854d0e', margin: 0 }}>~{Math.ceil(mopTotal / 50)} bags (50kg)</p>
              </div>
            </div>

            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '1rem', fontStyle: 'italic' }}>
              * Baseline agronomic dosage. Soil test reports (pH and organic carbon) supersede these generic recommendations.
            </p>
          </div>
        )}

      </div>
    </AppLayout>
  );
};

export default CropAdvisorPage;
