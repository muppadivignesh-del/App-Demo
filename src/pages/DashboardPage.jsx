import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import { useAuth } from '../context/AuthContext';
import { useCrops } from '../context/CropContext';
import { daysUntilHarvest, formatDate, timeAgo } from '../utils/dateUtils';
import { fetchWeatherForLocation } from '../services/weatherService';
import { marketAPI } from '../services/marketAPI';

const CROP_ICONS = {
  Chilli: '🌶️',
  Tomato: '🍅',
  Cotton: '🌱',
  Onion: '🧅',
  Wheat: '🌾',
  Rice: '🍚',
  Groundnut: '🥜',
  Turmeric: '💛',
  Potato: '🥔',
  Soybean: '🌿',
  Maize: '🌽',
  'Moong Dal': '🍲',
};

const STAGE_PROGRESS = {
  Planting: 15,
  Sowing: 15,
  Seedling: 35,
  Vegetative: 55,
  Flowering: 75,
  'Fruit Development': 85,
  Harvest: 98,
};

const DashboardPage = () => {
  const { farmer } = useAuth();
  const { activeCrops, loading: cropsLoading } = useCrops();

  const [weatherData, setWeatherData] = useState(null);
  const [topMarketCrops, setTopMarketCrops] = useState([]);
  const [recentNotifs, setRecentNotifs] = useState([]);

  // Read farmer data dynamically
  const firstName = farmer?.name?.split(' ')[0] || 'Farmer';
  const district = farmer?.location?.district || farmer?.district || 'Guntur';
  const state = farmer?.location?.state || farmer?.state || 'Andhra Pradesh';
  const totalLand = farmer?.landDetails?.totalArea ?? farmer?.landArea ?? '—';
  const areaUnit = farmer?.landDetails?.areaUnit || farmer?.areaUnit || 'acres';
  const irrigationType = farmer?.irrigationType || farmer?.landDetails?.irrigationType || 'Drip';

  // Load weather and market data
  useEffect(() => {
    let isMounted = true;
    fetchWeatherForLocation(district, state).then((res) => {
      if (isMounted) setWeatherData(res);
    });
    marketAPI.getAllMarketData().then((res) => {
      if (isMounted && res.data?.data?.marketData?.length > 0) {
        setTopMarketCrops(res.data.data.marketData.slice(0, 3));
      }
    });

    // Load recent notifications for this farmer
    try {
      const raw = localStorage.getItem('agri_notifications');
      if (raw) {
        const notifs = JSON.parse(raw);
        const farmerNotifs = notifs.filter((n) => n.farmerId === farmer?.id);
        if (isMounted) setRecentNotifs(farmerNotifs.slice(0, 3));
      }
    } catch {}

    return () => {
      isMounted = false;
    };
  }, [district, state, farmer?.id]);

  // Nearest harvest calculation
  const nearestHarvest = useMemo(() => {
    return activeCrops
      .filter((c) => c.expectedHarvestDate)
      .sort((a, b) => new Date(a.expectedHarvestDate) - new Date(b.expectedHarvestDate))[0];
  }, [activeCrops]);

  const daysToHarvest = nearestHarvest
    ? daysUntilHarvest(nearestHarvest.expectedHarvestDate)
    : null;

  const todayDateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <AppLayout
      title={`Dashboard · ${district}`}
      subtitle={todayDateStr}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

        {/* ── Header Welcome Greeting (PART 14 Requirement) ── */}
        <div
          className="card"
          id="greeting-card"
          style={{
            background: 'linear-gradient(135deg, #173d24 0%, #235c36 100%)',
            color: '#ffffff',
            borderRadius: '18px',
            padding: '1.35rem 1.5rem',
            boxShadow: '0 4px 18px rgba(23,61,36,0.14)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                <span style={{ fontSize: '0.74rem', background: 'rgba(255,255,255,0.18)', padding: '0.15rem 0.55rem', borderRadius: '12px', fontWeight: 600 }}>
                  📅 {todayDateStr}
                </span>
                <span style={{ fontSize: '0.74rem', background: 'rgba(255,255,255,0.18)', padding: '0.15rem 0.55rem', borderRadius: '12px', fontWeight: 600 }}>
                  📍 {district}, {state}
                </span>
              </div>
              <h2 className="greeting-title" style={{ fontSize: '1.65rem', fontWeight: 800, margin: '0.1rem 0', color: '#ffffff' }}>
                Hello, {firstName} 👋
              </h2>
              <p className="greeting-location" style={{ fontSize: '0.84rem', opacity: 0.9, margin: '0.15rem 0 0' }}>
                📍 {district}, {state}
              </p>
            </div>

            {/* Weather mini pill in greeting */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                background: 'rgba(255,255,255,0.14)',
                padding: '0.6rem 0.85rem',
                borderRadius: '14px',
                border: '1px solid rgba(255,255,255,0.15)',
              }}
            >
              <span style={{ fontSize: '2.2rem' }}>{weatherData?.current?.icon || '🌤️'}</span>
              <div>
                <p style={{ fontSize: '1.25rem', fontWeight: 900, margin: 0, lineHeight: 1 }}>
                  {weatherData?.current?.temp ?? 29}°C
                </p>
                <p style={{ fontSize: '0.72rem', opacity: 0.85, margin: '0.2rem 0 0' }}>
                  {weatherData?.current?.condition || 'Partly Cloudy'} · {weatherData?.current?.rainProbability ?? 20}% Rain
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Top 4 Summary Cards (PART 14 Requirement) ── */}
        <div className="greeting-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.85rem' }}>
          {/* Card 1: Active Crops */}
          <Link to="/crops" style={{ textDecoration: 'none' }}>
            <div className="card stat-item" style={{ padding: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.85rem', height: '100%', boxSizing: 'border-box' }}>
              <span style={{ fontSize: '2rem', background: '#dcfce7', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                🌱
              </span>
              <div>
                <p className="stat-label" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, margin: 0 }}>ACTIVE CROPS</p>
                <p className="stat-value" style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0.1rem 0 0' }}>
                  {activeCrops.length}
                </p>
              </div>
            </div>
          </Link>

          {/* Card 2: Total Land */}
          <Link to="/profile" style={{ textDecoration: 'none' }}>
            <div className="card" style={{ padding: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.85rem', height: '100%', boxSizing: 'border-box' }}>
              <span style={{ fontSize: '2rem', background: '#fef3c7', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                🌾
              </span>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, margin: 0 }}>TOTAL LAND</p>
                <p style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0.1rem 0 0' }}>
                  {totalLand} {areaUnit}
                </p>
              </div>
            </div>
          </Link>

          {/* Card 3: Irrigation Status */}
          <Link to="/irrigation" style={{ textDecoration: 'none' }}>
            <div className="card" style={{ padding: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.85rem', height: '100%', boxSizing: 'border-box' }}>
              <span style={{ fontSize: '2rem', background: '#e0f2fe', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                💧
              </span>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, margin: 0 }}>IRRIGATION STATUS</p>
                <p style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0.1rem 0 0' }}>
                  {irrigationType}
                </p>
              </div>
            </div>
          </Link>

          {/* Card 4: Weather Glance */}
          <Link to="/weather" style={{ textDecoration: 'none' }}>
            <div className="card" style={{ padding: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.85rem', height: '100%', boxSizing: 'border-box' }}>
              <span style={{ fontSize: '2rem', background: '#ffedd5', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                🌦
              </span>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, margin: 0 }}>WEATHER FORECAST</p>
                <p style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0.1rem 0 0' }}>
                  {weatherData?.current?.temp ?? 29}°C · {weatherData?.current?.rainProbability ?? 20}% Rain
                </p>
              </div>
            </div>
          </Link>
        </div>

        {/* ── Harvest Alert Banner (if harvest within 14 days) ── */}
        {nearestHarvest && daysToHarvest !== null && daysToHarvest <= 14 && (
          <div
            className="card"
            id="harvest-alert-banner"
            style={{
              background: '#fefce8',
              border: '1.5px solid #fef08a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.9rem 1.2rem',
              borderRadius: '14px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.75rem' }}>🌾</span>
              <div>
                <p style={{ fontSize: '0.9rem', fontWeight: 800, color: '#854d0e', margin: 0 }}>
                  {daysToHarvest <= 0
                    ? `${nearestHarvest.cropName} is ready to harvest today!`
                    : `${nearestHarvest.cropName} expected harvest in ${daysToHarvest} day${daysToHarvest === 1 ? '' : 's'}!`}
                </p>
                <p style={{ fontSize: '0.75rem', color: '#a16207', margin: '0.15rem 0 0' }}>
                  Target Date: {formatDate(nearestHarvest.expectedHarvestDate)} · Prepare harvesting equipment & drying floors.
                </p>
              </div>
            </div>
            <Link to={`/crops/${nearestHarvest._id}`} className="btn btn-sm btn-primary" style={{ flexShrink: 0 }}>
              View Crop →
            </Link>
          </div>
        )}

        {/* ── Today's Farming Advisory & Crop Protection ── */}
        <div
          className="card"
          id="daily-advisory-card"
          style={{
            borderLeft: '5px solid #16a34a',
            padding: '1.1rem 1.25rem',
            borderRadius: '14px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <span style={{ fontSize: '1.5rem' }}>🎯</span>
              <div>
                <h3 style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Today's Agricultural Advisory ({district})
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0' }}>
                  {weatherData?.advisory?.spraying?.text || 'Conditions are favorable for scheduled weeding and nutrient spray.'}
                </p>
              </div>
            </div>
            <span
              style={{
                fontSize: '0.74rem',
                fontWeight: 700,
                background: '#dcfce7',
                color: '#166534',
                padding: '0.2rem 0.6rem',
                borderRadius: '12px',
              }}
            >
              {weatherData?.advisory?.spraying?.badge || 'Safe Spray Window'}
            </span>
          </div>
        </div>

        {/* ── 2-Column Responsive Layout: Weather/Rain + Smart Irrigation ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
          {/* Weather / Rain Card */}
          <div className="card" id="weather-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                🌦️ Weather & Precipitation
              </h3>
              <Link to="/weather" style={{ fontSize: '0.78rem', color: '#1b4d2e', fontWeight: 700 }}>
                Full 7-Day Forecast →
              </Link>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.5rem 0' }}>
              <span style={{ fontSize: '2.5rem' }}>{weatherData?.current?.icon || '🌤️'}</span>
              <div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                    {weatherData?.current?.temp ?? 29}°C
                  </span>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    {weatherData?.current?.condition || 'Partly Cloudy'}
                  </span>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0.15rem 0 0' }}>
                  Feels like {weatherData?.current?.feelsLike ?? 31}°C · Wind: {weatherData?.current?.windSpeed ?? 12} km/h
                </p>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '0.5rem',
                background: '#f8faf8',
                padding: '0.65rem',
                borderRadius: '12px',
                marginTop: '0.75rem',
                textAlign: 'center',
              }}
            >
              <div>
                <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', margin: 0 }}>RAIN PROBABILITY</p>
                <p style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0284c7', margin: '0.1rem 0 0' }}>
                  ☂️ {weatherData?.current?.rainProbability ?? 20}%
                </p>
              </div>
              <div>
                <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', margin: 0 }}>EXPECTED RAINFALL</p>
                <p style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0.1rem 0 0' }}>
                  🌧️ {weatherData?.current?.expectedRainfall ?? 0} mm
                </p>
              </div>
            </div>
          </div>

          {/* Smart Irrigation Card */}
          <div className="card" id="smart-irrigation-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                💧 Smart Irrigation Status
              </h3>
              <Link to="/irrigation" style={{ fontSize: '0.78rem', color: '#1b4d2e', fontWeight: 700 }}>
                Precision Advisory →
              </Link>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <span style={{ fontSize: '2rem' }}>🚰</span>
              <div>
                <p style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  {weatherData?.advisory?.irrigation?.badge || 'Normal Irrigation Cycle'}
                </p>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0', lineHeight: 1.45 }}>
                  {weatherData?.advisory?.irrigation?.text || 'Maintain scheduled irrigation cycle based on current root-zone moisture.'}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f2' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                System: {irrigationType}
              </span>
              <Link to="/irrigation" className="btn btn-outline btn-sm">
                Calculate Watering →
              </Link>
            </div>
          </div>
        </div>

        {/* ── Crop Overview Section (PART 14 Requirement) ── */}
        <div className="card" id="active-crops-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              🌱 Farmland Crop Overview ({activeCrops.length})
            </h3>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Link to="/crops" style={{ fontSize: '0.8rem', color: '#1b4d2e', fontWeight: 700, alignSelf: 'center' }}>
                All Crops →
              </Link>
              <Link to="/crops/add" id="add-crop-dash-btn" className="btn btn-primary btn-sm">
                + Add Crop
              </Link>
            </div>
          </div>

          {cropsLoading ? (
            <div style={{ textAlign: 'center', padding: '1.5rem' }}>
              <div className="spinner" style={{ margin: '0 auto' }} />
            </div>
          ) : activeCrops.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', background: '#f8faf8', borderRadius: '12px' }}>
              <span style={{ fontSize: '2.5rem' }}>🌾</span>
              <p style={{ fontWeight: 700, margin: '0.5rem 0 0.2rem' }}>No active crops registered yet</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Register your planted crops to track watering, growth & profit estimates.</p>
              <Link to="/crops/add" id="add-first-crop-btn" className="btn btn-primary btn-sm mt-3">
                + Register First Crop
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {activeCrops.slice(0, 3).map((crop) => {
                const stagePercent = STAGE_PROGRESS[crop.currentGrowthStage] || 45;
                const icon = CROP_ICONS[crop.cropName] || '🌿';
                return (
                  <Link
                    key={crop._id}
                    to={`/crops/${crop._id}`}
                    id={`crop-preview-${crop._id}`}
                    style={{
                      display: 'block',
                      textDecoration: 'none',
                      background: '#f8faf8',
                      padding: '0.85rem 1rem',
                      borderRadius: '12px',
                      border: '1px solid #e5e7eb',
                      transition: 'background 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <span style={{ fontSize: '1.6rem' }}>{icon}</span>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                            <span style={{ fontSize: '0.94rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                              {crop.cropName}
                            </span>
                            <span style={{ fontSize: '0.68rem', background: '#dcfce7', color: '#166534', padding: '0.1rem 0.45rem', borderRadius: '8px', fontWeight: 700 }}>
                              {crop.currentGrowthStage}
                            </span>
                          </div>
                          <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: '0.1rem 0 0' }}>
                            {crop.landArea} {crop.areaUnit} · Planted: {formatDate(crop.plantingDate)}
                          </p>
                        </div>
                      </div>

                      {crop.expectedHarvestDate && (
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#166534' }}>
                            Harvest: {formatDate(crop.expectedHarvestDate)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Stage Progress Bar */}
                    <div style={{ height: '5px', background: '#e2e8e2', borderRadius: '4px', overflow: 'hidden', marginTop: '0.65rem' }}>
                      <div style={{ width: `${stagePercent}%`, height: '100%', background: '#2d7d46', borderRadius: '4px' }} />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* ── 2-Column Responsive: Market Snapshot + Recent Notifications ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
          {/* Market Snapshot (PART 14 Requirement) */}
          <div className="card" id="mandi-highlight-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                📊 Mandi Price Snapshot
              </h3>
              <Link to="/market" style={{ fontSize: '0.78rem', color: '#1b4d2e', fontWeight: 700 }}>
                All Rates ({topMarketCrops.length > 0 ? 'Sample Data' : ''}) →
              </Link>
            </div>

            {topMarketCrops.length === 0 ? (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Loading mandi rates...</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {topMarketCrops.map((item) => (
                  <Link
                    key={item.cropName}
                    to="/market"
                    style={{
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.65rem 0.85rem',
                      background: '#f8faf8',
                      borderRadius: '10px',
                      border: '1px solid #eef2ee',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '1.4rem' }}>{CROP_ICONS[item.cropName] || '🌾'}</span>
                      <div>
                        <p style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                          {item.cropName}
                        </p>
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>
                          {item.market}
                        </p>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: '0.9rem', fontWeight: 900, color: '#166534', margin: 0 }}>
                        ₹{item.pricePerKg}/kg
                      </p>
                      <p style={{ fontSize: '0.68rem', color: item.priceTrend === 'Rising' ? '#16a34a' : '#64748b', fontWeight: 700, margin: 0 }}>
                        {item.priceChange}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Recent Notifications (PART 14 Requirement) */}
          <div className="card" id="dashboard-notifs-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                🔔 Farm Notifications
              </h3>
              <Link to="/notifications" style={{ fontSize: '0.78rem', color: '#1b4d2e', fontWeight: 700 }}>
                View All →
              </Link>
            </div>

            {recentNotifs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.25rem', background: '#f8faf8', borderRadius: '10px' }}>
                <span style={{ fontSize: '1.5rem' }}>🔔</span>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0.35rem 0 0' }}>
                  No active alerts for your farm.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {recentNotifs.map((n) => (
                  <Link
                    key={n._id}
                    to="/notifications"
                    style={{
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.65rem',
                      padding: '0.65rem',
                      borderRadius: '10px',
                      background: n.isRead ? '#f8faf8' : '#eef8f1',
                      borderLeft: `3px solid ${n.isRead ? '#d1d5db' : '#22c55e'}`,
                    }}
                  >
                    <span style={{ fontSize: '1.15rem' }}>
                      {n.type === 'rain_alert' ? '🌧️' : n.type === 'watering_reminder' ? '💧' : '🔔'}
                    </span>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                        {n.title}
                      </p>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '0.15rem 0 0' }}>
                        {timeAgo(n.createdAt)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </AppLayout>
  );
};

export default DashboardPage;
