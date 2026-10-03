import { useState, useEffect } from 'react';
import AppLayout from '../components/layout/AppLayout';
import Alert from '../components/common/Alert';
import { useAuth } from '../context/AuthContext';
import { useCrops } from '../context/CropContext';
import { fetchWeatherForLocation } from '../services/weatherService';
import { cropAPI } from '../services/cropAPI';
import { COMMON_CROPS } from '../constants/farmConstants';
import { GROWTH_STAGES } from '../constants/growthStages';

const SOIL_MOISTURE_OPTIONS = [
  { id: 'wet', label: 'Wet / Saturated', desc: 'Water pools on surface' },
  { id: 'moist', label: 'Adequately Moist', desc: 'Holds ball shape when squeezed' },
  { id: 'slightly_dry', label: 'Slightly Dry', desc: 'Surface is dry, moist 2" below' },
  { id: 'dry', label: 'Dry / Cracking', desc: 'Soil crumbles, visible fissures' },
];

const LAST_WATERED_OPTIONS = [
  { id: 'today', label: 'Today', daysAgo: 0 },
  { id: 'yesterday', label: 'Yesterday', daysAgo: 1 },
  { id: '2_days', label: '2 Days Ago', daysAgo: 2 },
  { id: '3_days', label: '3 Days Ago', daysAgo: 3 },
  { id: '4_plus', label: '4+ Days Ago', daysAgo: 5 },
];

const SmartIrrigationPage = () => {
  const { farmer } = useAuth();
  const { activeCrops } = useCrops();

  const district = farmer?.location?.district || farmer?.district || 'Guntur';
  const state = farmer?.location?.state || farmer?.state || 'Andhra Pradesh';

  // Weather state
  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(true);

  // Form state
  const [selectedCropName, setSelectedCropName] = useState(
    activeCrops[0]?.cropName || COMMON_CROPS[0]
  );
  const [growthStage, setGrowthStage] = useState(
    activeCrops[0]?.currentGrowthStage || 'Vegetative'
  );
  const [lastWatered, setLastWatered] = useState('2_days');
  const [soilMoisture, setSoilMoisture] = useState('slightly_dry');
  const [irrigationMethod, setIrrigationMethod] = useState(
    farmer?.irrigationType || farmer?.landDetails?.irrigationType || 'Drip'
  );

  // Result state
  const [result, setResult] = useState(null);
  const [logSuccess, setLogSuccess] = useState('');

  // Fetch weather for location
  useEffect(() => {
    let isMounted = true;
    fetchWeatherForLocation(district, state).then((data) => {
      if (isMounted) {
        setWeather(data);
        setWeatherLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [district, state]);

  // Sync crop growth stage when crop selection changes
  const handleCropChange = (cropName) => {
    setSelectedCropName(cropName);
    const matched = activeCrops.find((c) => c.cropName === cropName);
    if (matched?.currentGrowthStage) {
      setGrowthStage(matched.currentGrowthStage);
    }
    setResult(null);
  };

  // Rule-based irrigation estimation engine
  const handleAnalyze = (e) => {
    if (e) e.preventDefault();

    const rainProb = weather?.current?.rainProbability ?? 20;
    const rainExpected = weather?.current?.expectedRainfall ?? 0;
    const temp = weather?.current?.temp ?? 29;
    const daysSinceWatered = LAST_WATERED_OPTIONS.find((o) => o.id === lastWatered)?.daysAgo ?? 2;

    let recommendation = '';
    let status = 'normal'; // 'skip' | 'normal' | 'urgent'
    let badgeText = 'Normal Irrigation';
    let durationEstimate = '1.5 - 2 Hours';
    let advicePoints = [];

    // Rule 1: High rain likelihood
    if (rainProb >= 65 || rainExpected >= 8) {
      status = 'skip';
      badgeText = 'Skip / Postpone Watering';
      recommendation = `Rain is likely (${rainProb}% probability, ~${rainExpected} mm expected). Avoid unnecessary watering and check soil moisture before irrigation to prevent waterlogging and root hypoxia.`;
      durationEstimate = '0 Hours (Rely on Rainfall)';
      advicePoints = [
        'Rain forecast covers natural crop evapotranspiration.',
        'Ensure drainage outlets are open to avoid standing water.',
        'Re-evaluate 24 hours after rainfall stops.',
      ];
    }
    // Rule 2: Soil is already wet or moist
    else if (soilMoisture === 'wet' || (soilMoisture === 'moist' && daysSinceWatered <= 1)) {
      status = 'skip';
      badgeText = 'Adequate Moisture — Hold';
      recommendation = 'Soil moisture is currently sufficient. Hold irrigation for another 24 hours to prevent root rot and conserve water.';
      durationEstimate = '0 Hours';
      advicePoints = [
        'Root zone has ample moisture reserves.',
        'Allow aeration to foster vigorous root elongation.',
        'Check soil again tomorrow morning.',
      ];
    }
    // Rule 3: Flowering or Fruit Development + dry conditions
    else if (
      (growthStage === 'Flowering' || growthStage === 'Fruit Development') &&
      (soilMoisture === 'dry' || soilMoisture === 'slightly_dry' || daysSinceWatered >= 2)
    ) {
      status = 'urgent';
      badgeText = 'Critical Reproductive Watering';
      recommendation = `Crop is in high-water-demand ${growthStage} stage. Moisture deficit now can cause flower shedding or reduced fruit weight. Rain probability is low (${rainProb}%). Water promptly in the early morning.`;
      durationEstimate = '2.5 - 3 Hours (Drip) or 4-5 cm (Flood)';
      advicePoints = [
        'Moisture stress during flowering directly lowers final harvest yields.',
        temp > 34
          ? `High ambient temperature (${temp}°C) increases transpiration. Water between 6:00 AM - 9:00 AM.`
          : 'Irrigate during morning hours to avoid fungal humidity overnight.',
        'Incorporate water-soluble potassium if running fertigation.',
      ];
    }
    // Rule 4: Dry soil + Low rain
    else if (soilMoisture === 'dry' || daysSinceWatered >= 3) {
      status = 'urgent';
      badgeText = 'Irrigation Recommended';
      recommendation = `Rain probability is low (${rainProb}%). Soil is dry at root depth. Consider watering to avoid vegetative wilting and stunting.`;
      durationEstimate = '2 - 2.5 Hours';
      advicePoints = [
        'Apply scheduled irrigation to replenish root zone.',
        'Check emitter lines for clogs if using drip systems.',
        'Mulching can preserve up to 40% of this applied water.',
      ];
    }
    // Rule 5: Standard maintenance cycle
    else {
      status = 'normal';
      badgeText = 'Standard Maintenance Cycle';
      recommendation = `Rain probability is low (${rainProb}%). Check soil moisture and consider watering if the soil feels dry beneath the top layer.`;
      durationEstimate = '1.5 - 2 Hours';
      advicePoints = [
        'Maintain normal irrigation schedule for this stage.',
        'Monitor temperature trends over the next 48 hours.',
      ];
    }

    setResult({
      status,
      badgeText,
      cropName: selectedCropName,
      growthStage,
      rainProb,
      rainExpected,
      temp,
      recommendation,
      durationEstimate,
      advicePoints,
      analyzedAt: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    });
  };

  // Quick log watering action
  const handleQuickLog = async () => {
    try {
      const activeMatch = activeCrops.find((c) => c.cropName === selectedCropName);
      const cropId = activeMatch?._id || 'general';
      await cropAPI.logWatering(cropId, {
        wateredAt: new Date().toISOString(),
        method: irrigationMethod,
        notes: `Smart Irrigation advisory recommendation applied for ${selectedCropName} (${growthStage})`,
      });
      setLogSuccess(`Watering logged successfully for ${selectedCropName}!`);
      setTimeout(() => setLogSuccess(''), 4000);
    } catch {
      setLogSuccess('Watering logged locally.');
      setTimeout(() => setLogSuccess(''), 4000);
    }
  };

  return (
    <AppLayout
      title="Smart Irrigation Advisory"
      subtitle="Precision watering guidance based on crop stage & local meteorology"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

        {/* ── Weather & Microclimate Context Banner ── */}
        <div
          className="card"
          style={{
            background: 'linear-gradient(135deg, #173d24 0%, #235c36 100%)',
            color: '#ffffff',
            borderRadius: '16px',
            padding: '1.25rem',
            boxShadow: '0 4px 16px rgba(23,61,36,0.15)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', opacity: 0.85 }}>
                LOCAL WEATHER CONTEXT · {district}
              </span>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, margin: '0.15rem 0', color: '#ffffff' }}>
                {weatherLoading ? 'Loading meteorological data...' : `${weather?.current?.temp}°C · ${weather?.current?.condition}`}
              </h2>
              <p style={{ fontSize: '0.8rem', opacity: 0.85, margin: 0 }}>
                {weather?.statusMessage || 'Live Meteorological Data'}
              </p>
            </div>
            <span style={{ fontSize: '2.4rem' }}>{weather?.current?.icon || '💧'}</span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '0.5rem',
              marginTop: '1rem',
              paddingTop: '0.75rem',
              borderTop: '1px solid rgba(255,255,255,0.15)',
              textAlign: 'center',
            }}
          >
            <div>
              <p style={{ fontSize: '0.7rem', opacity: 0.8 }}>Rain Probability</p>
              <p style={{ fontSize: '1.05rem', fontWeight: 800, margin: '0.1rem 0 0' }}>
                ☂️ {weather?.current?.rainProbability ?? 20}%
              </p>
            </div>
            <div>
              <p style={{ fontSize: '0.7rem', opacity: 0.8 }}>Expected Rainfall</p>
              <p style={{ fontSize: '1.05rem', fontWeight: 800, margin: '0.1rem 0 0' }}>
                🌧️ {weather?.current?.expectedRainfall ?? 0} mm
              </p>
            </div>
            <div>
              <p style={{ fontSize: '0.7rem', opacity: 0.8 }}>Relative Humidity</p>
              <p style={{ fontSize: '1.05rem', fontWeight: 800, margin: '0.1rem 0 0' }}>
                💧 {weather?.current?.humidity ?? 65}%
              </p>
            </div>
          </div>
        </div>

        {logSuccess && <Alert type="success">{logSuccess}</Alert>}

        {/* ── Input Parameters Form ── */}
        <form onSubmit={handleAnalyze} id="irrigation-form" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card">
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1rem' }}>
              🌾 Farm Conditions & Crop Parameters
            </h3>

            {/* Crop Selector */}
            <div className="form-group">
              <label htmlFor="irrigation-crop-select" className="form-label">
                Select Crop {activeCrops.length > 0 && '(From Your Active Farmland)'}
              </label>
              <select
                id="irrigation-crop-select"
                className="form-input form-select"
                value={selectedCropName}
                onChange={(e) => handleCropChange(e.target.value)}
              >
                {activeCrops.length > 0 && (
                  <optgroup label="My Active Crops">
                    {activeCrops.map((c) => (
                      <option key={c._id} value={c.cropName}>
                        🌱 {c.cropName} ({c.landArea} {c.areaUnit})
                      </option>
                    ))}
                  </optgroup>
                )}
                <optgroup label="Standard Crops">
                  {COMMON_CROPS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Growth Stage */}
            <div className="form-group">
              <label htmlFor="irrigation-stage-select" className="form-label">Current Growth Stage</label>
              <select
                id="irrigation-stage-select"
                className="form-input form-select"
                value={growthStage}
                onChange={(e) => setGrowthStage(e.target.value)}
              >
                {GROWTH_STAGES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.icon} {s.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Last Watered & Irrigation System */}
            <div className="form-row-2">
              <div className="form-group" style={{ flex: 1 }}>
                <label htmlFor="last-watered-select" className="form-label">Last Watered</label>
                <select
                  id="last-watered-select"
                  className="form-input form-select"
                  value={lastWatered}
                  onChange={(e) => setLastWatered(e.target.value)}
                >
                  {LAST_WATERED_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ flex: 1 }}>
                <label htmlFor="irrigation-method-select" className="form-label">Irrigation System</label>
                <select
                  id="irrigation-method-select"
                  className="form-input form-select"
                  value={irrigationMethod}
                  onChange={(e) => setIrrigationMethod(e.target.value)}
                >
                  <option value="Drip">Drip Irrigation</option>
                  <option value="Sprinkler">Sprinkler</option>
                  <option value="Canal / Flood">Canal / Flood</option>
                  <option value="Furrow">Furrow / Basin</option>
                  <option value="Manual">Manual Watering</option>
                </select>
              </div>
            </div>

            {/* Soil Moisture Condition */}
            <div className="form-group">
              <label className="form-label">Current Root-Zone Soil Moisture</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                {SOIL_MOISTURE_OPTIONS.map((opt) => (
                  <div
                    key={opt.id}
                    onClick={() => setSoilMoisture(opt.id)}
                    style={{
                      padding: '0.65rem 0.85rem',
                      borderRadius: '12px',
                      border: soilMoisture === opt.id ? '2px solid #2d7d46' : '1px solid var(--neutral-200)',
                      background: soilMoisture === opt.id ? '#f2faf5' : 'white',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <p style={{ fontSize: '0.84rem', fontWeight: 700, margin: 0, color: soilMoisture === opt.id ? '#173d24' : 'var(--text-primary)' }}>
                      {soilMoisture === opt.id ? '🔘 ' : '⚪ '}{opt.label}
                    </p>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '0.15rem 0 0' }}>
                      {opt.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              id="analyze-irrigation-btn"
              className="btn btn-primary btn-full btn-lg"
              style={{ marginTop: '0.5rem' }}
            >
              💧 Calculate Irrigation Recommendation
            </button>
          </div>
        </form>

        {/* ── Irrigation Recommendation Result ── */}
        {result && (
          <div
            className="card fade-in"
            id="irrigation-result-card"
            style={{
              borderLeft: `5px solid ${
                result.status === 'skip'
                  ? '#3b82f6'
                  : result.status === 'urgent'
                  ? '#ea580c'
                  : '#16a34a'
              }`,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    padding: '0.2rem 0.6rem',
                    borderRadius: '16px',
                    background:
                      result.status === 'skip'
                        ? '#dbeafe'
                        : result.status === 'urgent'
                        ? '#ffedd5'
                        : '#dcfce7',
                    color:
                      result.status === 'skip'
                        ? '#1e40af'
                        : result.status === 'urgent'
                        ? '#c2410c'
                        : '#166534',
                  }}
                >
                  {result.badgeText}
                </span>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.5rem', marginBottom: '0.2rem' }}>
                  Recommendation for {result.cropName}
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Stage: {result.growthStage} · Analyzed at {result.analyzedAt}
                </p>
              </div>

              <span style={{ fontSize: '2.5rem' }}>
                {result.status === 'skip' ? '🌧️' : result.status === 'urgent' ? '⚠️' : '✅'}
              </span>
            </div>

            {/* Recommendation Narrative */}
            <div
              style={{
                background: 'var(--neutral-50)',
                padding: '0.85rem 1rem',
                borderRadius: '12px',
                margin: '1rem 0',
                border: '1px solid var(--neutral-150)',
              }}
            >
              <p style={{ fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: 1.5, margin: 0, fontWeight: 500 }}>
                {result.recommendation}
              </p>
            </div>

            {/* Key Guidance Points */}
            <div style={{ marginBottom: '1rem' }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Actionable Field Guidance
              </h4>
              <ul style={{ paddingLeft: '1.2rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                {result.advicePoints.map((pt, i) => (
                  <li key={i} style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    {pt}
                  </li>
                ))}
              </ul>
            </div>

            {/* Metrics Snapshot */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '0.5rem',
                padding: '0.75rem',
                borderRadius: '12px',
                background: '#f8faf8',
                border: '1px solid #e2e8e2',
                textAlign: 'center',
                marginBottom: '1rem',
              }}
            >
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Recommended Run</span>
                <p style={{ fontSize: '0.9rem', fontWeight: 800, margin: '0.1rem 0 0', color: 'var(--text-primary)' }}>
                  {result.durationEstimate}
                </p>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Rain Probability</span>
                <p style={{ fontSize: '0.9rem', fontWeight: 800, margin: '0.1rem 0 0', color: '#0284c7' }}>
                  {result.rainProb}%
                </p>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Method</span>
                <p style={{ fontSize: '0.9rem', fontWeight: 800, margin: '0.1rem 0 0', color: 'var(--text-primary)' }}>
                  {irrigationMethod}
                </p>
              </div>
            </div>

            {/* Quick Action Button */}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                id="log-water-quick-btn"
                className="btn btn-outline"
                style={{ flex: 1 }}
                onClick={handleQuickLog}
              >
                💧 Record Watering Log
              </button>
            </div>

            {/* Mandatory Disclaimer */}
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '1rem', fontStyle: 'italic' }}>
              * ESTIMATE ONLY: Weather forecasts and soil percolation rates vary by field location. Always inspect physical soil moisture before starting pumps.
            </p>
          </div>
        )}

      </div>
    </AppLayout>
  );
};

export default SmartIrrigationPage;
