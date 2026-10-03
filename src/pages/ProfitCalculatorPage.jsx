import { profitAPI } from '../services/profitAPI';
import { useState, useEffect, useMemo } from 'react';
import AppLayout from '../components/layout/AppLayout';
import Alert from '../components/common/Alert';
import { useCrops } from '../context/CropContext';
import {
  calculateProfit,
  formatCurrency,
  formatIndianNumber,
  CROP_PROFIT_BENCHMARKS,
} from '../utils/calculatorUtils';
import { COMMON_CROPS, AREA_UNITS } from '../constants/farmConstants';
import { marketAPI } from '../services/marketAPI';

const COST_FIELDS = [
  { name: 'seedCost', label: '🌱 Seed / Seedling Cost (₹)', placeholder: '4000', color: '#16a34a' },
  { name: 'fertilizerCost', label: '🧪 Fertilizer & Nutrients (₹)', placeholder: '6500', color: '#0284c7' },
  { name: 'labourCost', label: '👷 Labour & Machine Hire (₹)', placeholder: '8000', color: '#f59e0b' },
  { name: 'irrigationCost', label: '💧 Irrigation & Electricity (₹)', placeholder: '2500', color: '#06b6d4' },
  { name: 'pesticideCost', label: '🧴 Crop Protection & Spray (₹)', placeholder: '3000', color: '#8b5cf6' },
  { name: 'otherCosts', label: '📦 Packing, Transport & Other (₹)', placeholder: '2000', color: '#64748b' },
];

const POPULAR_CROPS_PRESETS = [
  'Tomato',
  'Chilli',
  'Cotton',
  'Onion',
  'Potato',
  'Rice',
  'Wheat',
  'Groundnut',
  'Maize',
  'Turmeric',
  'Sugarcane',
];

const ProfitCalculatorPage = () => {
  const { activeCrops } = useCrops();

  const [form, setForm] = useState({
    cropName: 'Tomato',
    landArea: '1',
    areaUnit: 'acres',
    costBasis: 'per_acre', // 'per_acre' | 'total'
    expectedYieldPerAcre: '8000',
    sellingPricePerKg: '25',
    seedCost: '4000',
    fertilizerCost: '6500',
    labourCost: '8000',
    irrigationCost: '2500',
    pesticideCost: '3500',
    otherCosts: '2500',
  });

  const [mandiPrice, setMandiPrice] = useState(null);
  const [mandiMarket, setMandiMarket] = useState('');
  const [savedRecords, setSavedRecords] = useState([]);
  const [saveSuccess, setSaveSuccess] = useState('');

  // Load saved estimates from MySQL backend via profitAPI (with offline cache fallback)
  useEffect(() => {
    let isMounted = true;
    profitAPI.getProfitRecords().then((res) => {
      if (isMounted && res.data?.data?.profitRecords) {
        setSavedRecords(res.data.data.profitRecords);
      }
    });
    return () => { isMounted = false; };
  }, []);

  // Fetch Mandi price when cropName changes
  useEffect(() => {
    let isMounted = true;
    if (form.cropName) {
      marketAPI.getMarketDataByCrop(form.cropName).then((res) => {
        if (isMounted && res.data?.data?.marketData) {
          const item = res.data.data.marketData;
          setMandiPrice(item.pricePerKg);
          setMandiMarket(item.market || 'Regional Mandi');
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [form.cropName]);

  // Handle crop change & auto-populate benchmark values
  const handleSelectCrop = (cropName) => {
    const benchmark = CROP_PROFIT_BENCHMARKS[cropName];
    if (benchmark) {
      setForm((prev) => ({
        ...prev,
        cropName,
        expectedYieldPerAcre: String(benchmark.expectedYieldPerAcre),
        sellingPricePerKg: String(benchmark.sellingPricePerKg),
        seedCost: String(benchmark.seedCost),
        fertilizerCost: String(benchmark.fertilizerCost),
        labourCost: String(benchmark.labourCost),
        irrigationCost: String(benchmark.irrigationCost),
        pesticideCost: String(benchmark.pesticideCost),
        otherCosts: String(benchmark.otherCosts),
      }));
    } else {
      setForm((prev) => ({ ...prev, cropName }));
    }
  };

  // Quick load from active farm crop
  const handleLoadActiveCrop = (crop) => {
    const benchmark = CROP_PROFIT_BENCHMARKS[crop.cropName];
    setForm((prev) => ({
      ...prev,
      cropName: crop.cropName,
      landArea: String(crop.landArea || 1),
      areaUnit: crop.areaUnit || 'acres',
      expectedYieldPerAcre: benchmark ? String(benchmark.expectedYieldPerAcre) : prev.expectedYieldPerAcre,
      sellingPricePerKg: benchmark ? String(benchmark.sellingPricePerKg) : prev.sellingPricePerKg,
      seedCost: benchmark ? String(benchmark.seedCost) : prev.seedCost,
      fertilizerCost: benchmark ? String(benchmark.fertilizerCost) : prev.fertilizerCost,
      labourCost: benchmark ? String(benchmark.labourCost) : prev.labourCost,
      irrigationCost: benchmark ? String(benchmark.irrigationCost) : prev.irrigationCost,
      pesticideCost: benchmark ? String(benchmark.pesticideCost) : prev.pesticideCost,
      otherCosts: benchmark ? String(benchmark.otherCosts) : prev.otherCosts,
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  // Live real-time calculation
  const result = useMemo(() => {
    return calculateProfit({
      landArea: parseFloat(form.landArea) || 1,
      areaUnit: form.areaUnit,
      costBasis: form.costBasis,
      expectedYieldPerAcre: parseFloat(form.expectedYieldPerAcre) || 0,
      sellingPricePerKg: parseFloat(form.sellingPricePerKg) || 0,
      seedCost: parseFloat(form.seedCost) || 0,
      fertilizerCost: parseFloat(form.fertilizerCost) || 0,
      labourCost: parseFloat(form.labourCost) || 0,
      irrigationCost: parseFloat(form.irrigationCost) || 0,
      pesticideCost: parseFloat(form.pesticideCost) || 0,
      otherCosts: parseFloat(form.otherCosts) || 0,
    });
  }, [form]);

  // Apply current Mandi price
  const handleApplyMandiPrice = () => {
    if (mandiPrice !== null && mandiPrice !== undefined) {
      setForm((p) => ({ ...p, sellingPricePerKg: String(mandiPrice) }));
    }
  };

  // Reset to default crop benchmark
  const handleResetBenchmark = () => {
    if (form.cropName) {
      handleSelectCrop(form.cropName);
    }
  };

  // Save current estimate to farm records
  const handleSaveEstimate = async () => {
    try {
      const res = await profitAPI.saveProfitRecord({
        cropName: form.cropName || 'Farm Crop',
        landArea: form.landArea,
        areaUnit: form.areaUnit,
        expectedYield: form.expectedYieldPerAcre,
        sellingPrice: form.sellingPricePerKg,
        seedCost: form.seedCost,
        fertilizerCost: form.fertilizerCost,
        labourCost: form.labourCost,
        irrigationCost: form.irrigationCost,
        pesticideCost: form.pesticideCost,
        otherCost: form.otherCosts,
      });
      if (res.data?.data?.profitRecord) {
        setSavedRecords((prev) => [res.data.data.profitRecord, ...prev.slice(0, 4)]);
      }
    } catch (e) {
      console.warn('Saving locally:', e.message);
    }
    setSaveSuccess(`Estimate for ${form.cropName} saved to farm records!`);
    setTimeout(() => setSaveSuccess(''), 4000);
  };

  const handleDeleteSavedRecord = (id) => {
    profitAPI.deleteProfitRecord(id);
    const updated = savedRecords.filter((r) => r.id !== id && r._id !== id);
    setSavedRecords(updated);
  };

  // Calculate cost distribution percentages for visualizer
  const costBreakdownPercents = useMemo(() => {
    if (!result || result.totalCost <= 0) return [];
    return [
      { key: 'labour', label: 'Labour', amount: result.costBreakdown.labour, color: '#f59e0b' },
      { key: 'fertilizer', label: 'Nutrients', amount: result.costBreakdown.fertilizer, color: '#0284c7' },
      { key: 'seed', label: 'Seeds', amount: result.costBreakdown.seed, color: '#16a34a' },
      { key: 'pesticide', label: 'Protection', amount: result.costBreakdown.pesticide, color: '#8b5cf6' },
      { key: 'irrigation', label: 'Water', amount: result.costBreakdown.irrigation, color: '#06b6d4' },
      { key: 'other', label: 'Other', amount: result.costBreakdown.other, color: '#64748b' },
    ].map((item) => ({
      ...item,
      percent: Math.round((item.amount / result.totalCost) * 100),
    })).filter((item) => item.percent > 0);
  }, [result]);

  return (
    <AppLayout
      title="Farm Profit Calculator"
      subtitle="Interactive agronomic revenue, cultivation expenses & margin analysis"
      showBack
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

        {saveSuccess && <Alert type="success">{saveSuccess}</Alert>}

        {/* ── Active Crops Quick Pick (if farmer has active crops) ── */}
        {activeCrops.length > 0 && (
          <div
            className="card"
            style={{
              padding: '0.85rem 1.1rem',
              borderRadius: '14px',
              background: '#f0fdf4',
              border: '1.5px solid #bbf7d0',
            }}
          >
            <p style={{ fontSize: '0.78rem', fontWeight: 800, color: '#166534', margin: '0 0 0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              🌾 Quick-Load From Your Active Farmland
            </p>
            <div style={{ display: 'flex', gap: '0.45rem', overflowX: 'auto', paddingBottom: '0.2rem' }}>
              {activeCrops.map((c) => (
                <button
                  key={c._id}
                  type="button"
                  onClick={() => handleLoadActiveCrop(c)}
                  style={{
                    fontSize: '0.78rem',
                    padding: '0.35rem 0.75rem',
                    borderRadius: '16px',
                    border: form.cropName === c.cropName ? '1.5px solid #16a34a' : '1px solid #cbd5e1',
                    background: form.cropName === c.cropName ? '#166534' : '#ffffff',
                    color: form.cropName === c.cropName ? '#ffffff' : '#1e293b',
                    fontWeight: 700,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span>🌱 {c.cropName}</span>
                  <span style={{ opacity: 0.85, fontSize: '0.72rem' }}>({c.landArea} {c.areaUnit})</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Interactive Crop Benchmark Preset Selector ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
              Select Crop to Auto-fill Agronomic Benchmarks:
            </span>
            <button
              type="button"
              onClick={handleResetBenchmark}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#166534',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Reset to Recommended Defaults
            </button>
          </div>

          <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '0.35rem' }}>
            {POPULAR_CROPS_PRESETS.map((crop) => {
              const b = CROP_PROFIT_BENCHMARKS[crop];
              const isSelected = form.cropName.toLowerCase() === crop.toLowerCase();
              return (
                <button
                  key={crop}
                  type="button"
                  onClick={() => handleSelectCrop(crop)}
                  style={{
                    flexShrink: 0,
                    fontSize: '0.78rem',
                    padding: '0.35rem 0.8rem',
                    borderRadius: '16px',
                    border: isSelected ? '1.5px solid #1e6b3c' : '1px solid #d1d5db',
                    background: isSelected ? '#1e6b3c' : '#ffffff',
                    color: isSelected ? '#ffffff' : '#374151',
                    fontWeight: isSelected ? 800 : 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {b?.icon || '🌿'} {crop}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Main 2-Column Responsive Layout: Inputs + Live Summary ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem', alignItems: 'start' }}>

          {/* ── Left Column: Input Form ── */}
          <form
            id="profit-calculator-form"
            onSubmit={(e) => e.preventDefault()}
            noValidate
            style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
          >
            {/* Section 1: Farmland & Production */}
            <div className="card">
              <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '0.85rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>🌾</span> Farmland & Crop Parameters
              </h3>

              <div className="form-group">
                <label htmlFor="calc-crop-select" className="form-label">Crop Name</label>
                <select
                  id="calc-crop-select"
                  name="cropName"
                  className="form-input form-select"
                  value={form.cropName}
                  onChange={(e) => handleSelectCrop(e.target.value)}
                >
                  <option value="">Select Crop</option>
                  {COMMON_CROPS.map((c) => (
                    <option key={c} value={c}>
                      {CROP_PROFIT_BENCHMARKS[c]?.icon || '🌱'} {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row-2">
                <div className="form-group" style={{ flex: 2 }}>
                  <label htmlFor="calc-land-area" className="form-label">Cultivated Land Area</label>
                  <input
                    id="calc-land-area"
                    name="landArea"
                    type="number"
                    className="form-input"
                    value={form.landArea}
                    onChange={handleChange}
                    min="0.1"
                    step="any"
                    placeholder="e.g. 2"
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label htmlFor="calc-area-unit" className="form-label">Unit</label>
                  <select
                    id="calc-area-unit"
                    name="areaUnit"
                    className="form-input form-select"
                    value={form.areaUnit}
                    onChange={handleChange}
                  >
                    {AREA_UNITS.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Yield & Price Inputs */}
              <div className="form-row-2">
                <div className="form-group" style={{ flex: 1 }}>
                  <label htmlFor="calc-yield" className="form-label">
                    Expected Yield ({form.areaUnit === 'acres' ? 'kg / Acre' : `kg / ${form.areaUnit}`})
                  </label>
                  <input
                    id="calc-yield"
                    name="expectedYieldPerAcre"
                    type="number"
                    className="form-input"
                    placeholder="e.g. 8000"
                    value={form.expectedYieldPerAcre}
                    onChange={handleChange}
                    min="0"
                  />
                </div>

                <div className="form-group" style={{ flex: 1 }}>
                  <label htmlFor="calc-price" className="form-label">Selling Price per kg (₹)</label>
                  <input
                    id="calc-price"
                    name="sellingPricePerKg"
                    type="number"
                    className="form-input"
                    placeholder="e.g. 25"
                    value={form.sellingPricePerKg}
                    onChange={handleChange}
                    min="0"
                    step="0.5"
                  />
                </div>
              </div>

              {/* Mandi Sync Helper */}
              {mandiPrice !== null && (
                <div
                  style={{
                    background: '#f8faf8',
                    padding: '0.6rem 0.85rem',
                    borderRadius: '10px',
                    border: '1px solid #e2e8e2',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: '0.25rem',
                    flexWrap: 'wrap',
                    gap: '0.4rem',
                  }}
                >
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    📊 Current Mandi Rate: <strong style={{ color: '#166534' }}>₹{mandiPrice}/kg</strong> ({mandiMarket})
                  </span>
                  <button
                    type="button"
                    onClick={handleApplyMandiPrice}
                    style={{
                      background: '#dcfce7',
                      color: '#166534',
                      border: '1px solid #bbf7d0',
                      borderRadius: '8px',
                      padding: '0.2rem 0.55rem',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Apply Mandi Price
                  </button>
                </div>
              )}
            </div>

            {/* Section 2: Cultivation Costs */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>💸</span> Cultivation Expenses (₹)
                </h3>

                {/* Cost Basis Toggle: Per Acre vs Total */}
                <div style={{ display: 'flex', background: '#f1f5f2', borderRadius: '10px', padding: '0.15rem' }}>
                  <button
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, costBasis: 'per_acre' }))}
                    style={{
                      border: 'none',
                      padding: '0.25rem 0.65rem',
                      fontSize: '0.72rem',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      background: form.costBasis === 'per_acre' ? '#166534' : 'transparent',
                      color: form.costBasis === 'per_acre' ? '#ffffff' : '#4b5563',
                      fontWeight: 700,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    Per {form.areaUnit === 'acres' ? 'Acre' : form.areaUnit}
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, costBasis: 'total' }))}
                    style={{
                      border: 'none',
                      padding: '0.25rem 0.65rem',
                      fontSize: '0.72rem',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      background: form.costBasis === 'total' ? '#166534' : 'transparent',
                      color: form.costBasis === 'total' ? '#ffffff' : '#4b5563',
                      fontWeight: 700,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    Total Land Area
                  </button>
                </div>
              </div>

              <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                {form.costBasis === 'per_acre'
                  ? `💡 Costs entered below are per ${form.areaUnit}. Total will be automatically multiplied by ${form.landArea} ${form.areaUnit}.`
                  : `💡 Costs entered below represent the total lump-sum for your entire ${form.landArea} ${form.areaUnit} farm.`}
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.65rem' }}>
                {COST_FIELDS.map((f) => (
                  <div className="form-group" key={f.name}>
                    <label htmlFor={`cost-${f.name}`} className="form-label" style={{ fontSize: '0.78rem' }}>
                      {f.label}
                    </label>
                    <input
                      id={`cost-${f.name}`}
                      name={f.name}
                      type="number"
                      className="form-input"
                      placeholder={f.placeholder}
                      value={form[f.name]}
                      onChange={handleChange}
                      min="0"
                    />
                  </div>
                ))}
              </div>
            </div>

            <button
              id="calculate-profit-btn"
              type="submit"
              className="btn btn-primary btn-full btn-lg"
              onClick={() => {}}
            >
              💰 Recalculate Profit Estimate
            </button>
          </form>

          {/* ── Right Column: Live Financial Summary & Analysis ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* Main Result Card */}
            <div
              className="card fade-in"
              id="profit-result"
              style={{
                borderRadius: '18px',
                padding: '1.4rem',
                border: `2px solid ${result.isProfitable ? '#22c55e' : '#ef4444'}`,
                boxShadow: result.isProfitable
                  ? '0 6px 20px rgba(34, 197, 94, 0.12)'
                  : '0 6px 20px rgba(239, 68, 68, 0.12)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      padding: '0.2rem 0.65rem',
                      borderRadius: '12px',
                      background: result.isProfitable ? '#dcfce7' : '#fee2e2',
                      color: result.isProfitable ? '#166534' : '#991b1b',
                    }}
                  >
                    {result.isProfitable ? '✅ PROFITABLE HARVEST' : '⚠️ NET LOSS ESTIMATED'}
                  </span>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-primary)', margin: '0.35rem 0 0.1rem' }}>
                    {form.cropName || 'Crop'} Profit Estimate
                  </h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                    Cultivated area: {form.landArea} {form.areaUnit} ({result.normalizedAreaInAcres} acres)
                  </p>
                </div>

                <span style={{ fontSize: '2.4rem' }}>
                  {result.isProfitable ? '📈' : '📉'}
                </span>
              </div>

              {/* Big Profit Hero Pill */}
              <div
                style={{
                  marginTop: '1.15rem',
                  background: result.isProfitable
                    ? 'linear-gradient(135deg, #173d24 0%, #205c37 100%)'
                    : 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%)',
                  borderRadius: '14px',
                  padding: '1.25rem',
                  textAlign: 'center',
                  color: '#ffffff',
                }}
              >
                <p style={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.9, margin: 0 }}>
                  ESTIMATED NET PROFIT
                </p>
                <p style={{ fontSize: '2.5rem', fontWeight: 900, margin: '0.25rem 0 0.15rem', letterSpacing: '-0.02em' }}>
                  {formatCurrency(result.estimatedProfit)}
                </p>
                <p style={{ fontSize: '0.84rem', opacity: 0.9, margin: 0 }}>
                  {formatCurrency(result.profitPerAcre)} net margin per acre · ROI: {result.roi}%
                </p>
              </div>

              {/* 3 Metrics Row */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '0.5rem',
                  marginTop: '1rem',
                  padding: '0.75rem 0.5rem',
                  borderRadius: '12px',
                  background: '#f8faf8',
                  border: '1px solid #eef2ee',
                  textAlign: 'center',
                }}
              >
                <div>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Total Yield</span>
                  <p style={{ fontSize: '0.92rem', fontWeight: 800, margin: '0.1rem 0 0', color: 'var(--text-primary)' }}>
                    {formatIndianNumber(result.totalYield)} kg
                  </p>
                </div>
                <div>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Gross Revenue</span>
                  <p style={{ fontSize: '0.92rem', fontWeight: 800, margin: '0.1rem 0 0', color: '#0284c7' }}>
                    {formatCurrency(result.expectedRevenue)}
                  </p>
                </div>
                <div>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Total Expense</span>
                  <p style={{ fontSize: '0.92rem', fontWeight: 800, margin: '0.1rem 0 0', color: '#dc2626' }}>
                    {formatCurrency(result.totalCost)}
                  </p>
                </div>
              </div>

              {/* Break-Even Intelligence Card */}
              <div
                style={{
                  marginTop: '0.9rem',
                  padding: '0.85rem 1rem',
                  borderRadius: '12px',
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                }}
              >
                <p style={{ fontSize: '0.78rem', fontWeight: 800, color: '#166534', margin: '0 0 0.35rem' }}>
                  🎯 Break-Even Intelligence:
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#1e293b' }}>
                  <span>Minimum selling price needed:</span>
                  <strong style={{ color: '#166534' }}>₹{result.breakEvenPricePerKg}/kg</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#1e293b', marginTop: '0.2rem' }}>
                  <span>Minimum harvest yield needed:</span>
                  <strong style={{ color: '#166534' }}>{formatIndianNumber(result.breakEvenYield)} kg</strong>
                </div>
              </div>

              {/* Expense Distribution Visualizer */}
              {costBreakdownPercents.length > 0 && (
                <div style={{ marginTop: '1.1rem' }}>
                  <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.45rem' }}>
                    Cultivation Cost Breakdown ({formatCurrency(result.totalCost)}):
                  </p>

                  {/* Multi-segmented Progress Bar */}
                  <div style={{ display: 'flex', height: '10px', borderRadius: '6px', overflow: 'hidden', background: '#e2e8e2' }}>
                    {costBreakdownPercents.map((item) => (
                      <div
                        key={item.key}
                        style={{
                          width: `${item.percent}%`,
                          background: item.color,
                          title: `${item.label}: ${item.percent}% (${formatCurrency(item.amount)})`,
                        }}
                      />
                    ))}
                  </div>

                  {/* Legend */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem', marginTop: '0.5rem' }}>
                    {costBreakdownPercents.map((item) => (
                      <div key={item.key} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.color }} />
                        <span style={{ color: 'var(--text-muted)' }}>{item.label}:</span>
                        <strong style={{ color: 'var(--text-primary)' }}>{item.percent}%</strong>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Save & Action Buttons */}
              <div style={{ display: 'flex', gap: '0.65rem', marginTop: '1.25rem' }}>
                <button
                  type="button"
                  id="save-estimate-btn"
                  className="btn btn-outline btn-full"
                  onClick={handleSaveEstimate}
                  style={{ borderRadius: '10px', fontSize: '0.82rem' }}
                >
                  💾 Save to Farm Records
                </button>
              </div>

              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '1rem', fontStyle: 'italic', margin: '0.75rem 0 0' }}>
                * Agronomic estimate based on standard regional inputs. Mandi prices fluctuate daily.
              </p>
            </div>

            {/* Saved Estimates History (if any) */}
            {savedRecords.length > 0 && (
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                  <h4 style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    📋 Saved Farm Estimates ({savedRecords.length})
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      setSavedRecords([]);
                      localStorage.removeItem('agri_saved_profit_estimates');
                    }}
                    style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '0.72rem', cursor: 'pointer' }}
                  >
                    Clear History
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  {savedRecords.map((rec) => (
                    <div
                      key={rec.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.55rem 0.75rem',
                        background: '#f8faf8',
                        borderRadius: '10px',
                        border: '1px solid #eef2ee',
                      }}
                    >
                      <div>
                        <p style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                          {rec.cropName} ({rec.landArea} {rec.areaUnit})
                        </p>
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>
                          {rec.savedAt} · ROI: {rec.roi}%
                        </p>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.88rem', fontWeight: 800, color: rec.estimatedProfit >= 0 ? '#166534' : '#dc2626' }}>
                          {formatCurrency(rec.estimatedProfit)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteSavedRecord(rec.id)}
                          style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.85rem' }}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>

      </div>
    </AppLayout>
  );
};

export default ProfitCalculatorPage;
