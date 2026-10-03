import { useState, useEffect } from 'react';
import AppLayout from '../components/layout/AppLayout';
import Loader from '../components/common/Loader';
import Alert from '../components/common/Alert';
import { useAuth } from '../context/AuthContext';
import { fetchWeatherForLocation, detectDeviceLocationWeather } from '../services/weatherService';

const POPULAR_DISTRICTS = [
  'Delhi',
  'Mumbai',
  'Bengaluru',
  'Hyderabad',
  'Guntur',
  'Varanasi',
  'Shimla',
  'Pune',
  'Jaipur',
  'Lucknow',
  'Ludhiana',
  'Patna',
  'Vijayawada',
  'Chennai',
  'Kolkata',
  'Kurnool',
  'Warangal',
];

const WeatherPage = () => {
  const { farmer } = useAuth();
  const defaultDistrict = farmer?.location?.district || farmer?.district || 'Guntur';
  const defaultState = farmer?.location?.state || farmer?.state || 'Andhra Pradesh';

  const [selectedDistrict, setSelectedDistrict] = useState(defaultDistrict);
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detectingGps, setDetectingGps] = useState(false);
  const [error, setError] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [customSearch, setCustomSearch] = useState('');

  useEffect(() => {
    let isMounted = true;
    const loadWeather = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await fetchWeatherForLocation(selectedDistrict, defaultState);
        if (isMounted) {
          if (!data || !data.current) {
            setError('Weather data unavailable for this location. Please try again or search another city.');
          } else {
            setWeather(data);
          }
        }
      } catch {
        if (isMounted) {
          setError('Weather data unavailable. Please try again.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadWeather();
    return () => {
      isMounted = false;
    };
  }, [selectedDistrict, defaultState]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (customSearch.trim()) {
      setSelectedDistrict(customSearch.trim());
      setCustomSearch('');
      setInfoMsg('');
    }
  };

  const handleDetectGps = async () => {
    setDetectingGps(true);
    setError('');
    setInfoMsg('');
    try {
      const data = await detectDeviceLocationWeather();
      setWeather(data);
      setSelectedDistrict(data.district);
      setInfoMsg(`📡 GPS Sensed: Live temperature detected for ${data.district} (${data.latitude}°, ${data.longitude}°)!`);
    } catch (err) {
      setError(err.message || 'Could not sense device GPS location.');
    } finally {
      setDetectingGps(false);
    }
  };

  return (
    <AppLayout
      title="Farm Weather & Advisory"
      subtitle={`Agricultural meteorological outlook for ${selectedDistrict}`}
      showBack
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

        {/* ── District Selector & GPS Sensing Bar ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem', flex: 1, minWidth: '240px' }}>
              <input
                type="text"
                id="weather-search-input"
                className="form-input"
                placeholder="Search any city or district (e.g. Delhi, Shimla, Warangal)..."
                value={customSearch}
                onChange={(e) => setCustomSearch(e.target.value)}
                style={{ flex: 1, borderRadius: '12px' }}
              />
              <button
                type="submit"
                id="weather-search-btn"
                className="btn btn-primary btn-sm"
                style={{ borderRadius: '12px', padding: '0 1.25rem' }}
              >
                Search
              </button>
            </form>

            <button
              type="button"
              id="detect-gps-btn"
              className="btn btn-outline btn-sm"
              onClick={handleDetectGps}
              disabled={detectingGps}
              style={{
                borderRadius: '12px',
                padding: '0 1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                borderColor: '#16a34a',
                color: '#166534',
                fontWeight: 700,
                background: detectingGps ? '#f0fdf4' : '#ffffff',
              }}
            >
              {detectingGps ? (
                <>
                  <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                  Sensing GPS...
                </>
              ) : (
                '📡 Sense My Location'
              )}
            </button>
          </div>

          {/* Quick district chips */}
          <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
            {POPULAR_DISTRICTS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => {
                  setSelectedDistrict(d);
                  setInfoMsg('');
                }}
                style={{
                  flexShrink: 0,
                  fontSize: '0.76rem',
                  padding: '0.3rem 0.75rem',
                  borderRadius: '16px',
                  border: selectedDistrict.toLowerCase() === d.toLowerCase() ? '1.5px solid #1e6b3c' : '1px solid #d1d5db',
                  background: selectedDistrict.toLowerCase() === d.toLowerCase() ? '#1e6b3c' : '#ffffff',
                  color: selectedDistrict.toLowerCase() === d.toLowerCase() ? '#ffffff' : '#374151',
                  fontWeight: selectedDistrict.toLowerCase() === d.toLowerCase() ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                📍 {d}
              </button>
            ))}
          </div>
        </div>

        {infoMsg && <Alert type="info">{infoMsg}</Alert>}

        {/* Loading state */}
        {loading && <Loader text="Loading weather..." />}

        {/* Error state */}
        {!loading && error && (
          <Alert type="danger">
            {error}
          </Alert>
        )}

        {/* Weather Content */}
        {!loading && weather && (
          <>
            {/* ── Main Weather Hero Card ── */}
            <div
              className="card"
              id="weather-hero-card"
              style={{
                background: 'linear-gradient(135deg, #153c24 0%, #205c37 55%, #12361f 100%)',
                color: '#ffffff',
                borderRadius: '20px',
                padding: '1.5rem',
                boxShadow: '0 6px 24px rgba(21, 60, 36, 0.2)',
                position: 'relative',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        padding: '0.15rem 0.5rem',
                        borderRadius: '12px',
                        background: weather.isLive ? 'rgba(74, 222, 128, 0.2)' : 'rgba(254, 240, 138, 0.25)',
                        color: weather.isLive ? '#86efac' : '#fef08a',
                        border: `1px solid ${weather.isLive ? 'rgba(74, 222, 128, 0.3)' : 'rgba(254, 240, 138, 0.3)'}`,
                      }}
                    >
                      {weather.statusMessage}
                    </span>
                  </div>

                  <h2 style={{ fontSize: '1.65rem', fontWeight: 800, marginTop: '0.4rem', color: '#ffffff' }}>
                    {weather.district}
                  </h2>
                  <p style={{ fontSize: '0.82rem', opacity: 0.85, marginTop: '0.1rem' }}>
                    {weather.state} · Last Updated: {weather.lastUpdated}
                  </p>
                </div>

                <span style={{ fontSize: '3.6rem', filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.25))' }}>
                  {weather.current.icon}
                </span>
              </div>

              {/* Temperature Display */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginTop: '1rem' }}>
                <span id="current-temp" style={{ fontSize: '3.6rem', fontWeight: 900, lineHeight: 1, letterSpacing: '-0.03em' }}>
                  {weather.current.temp}°C
                </span>
                <div>
                  <span
                    style={{
                      background: 'rgba(255, 255, 255, 0.2)',
                      padding: '0.25rem 0.65rem',
                      borderRadius: '12px',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                    }}
                  >
                    {weather.current.condition}
                  </span>
                  <p style={{ fontSize: '0.78rem', opacity: 0.85, marginTop: '0.35rem' }}>
                    Feels like {weather.current.feelsLike}°C
                  </p>
                </div>
              </div>

              {/* Four Core Environmental Metrics Grid (PART 19 Requirement) */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '0.5rem',
                  marginTop: '1.25rem',
                  paddingTop: '1rem',
                  borderTop: '1px solid rgba(255, 255, 255, 0.18)',
                  textAlign: 'center',
                }}
              >
                {/* Rain Probability */}
                <div style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '0.65rem 0.35rem', borderRadius: '12px' }}>
                  <span style={{ fontSize: '1.15rem' }}>☂️</span>
                  <p style={{ fontSize: '0.68rem', opacity: 0.8, marginTop: '0.2rem' }}>Rain Prob.</p>
                  <p style={{ fontSize: '0.95rem', fontWeight: 800 }}>{weather.current.rainProbability}%</p>
                </div>

                {/* Expected Rainfall */}
                <div style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '0.65rem 0.35rem', borderRadius: '12px' }}>
                  <span style={{ fontSize: '1.15rem' }}>🌧️</span>
                  <p style={{ fontSize: '0.68rem', opacity: 0.8, marginTop: '0.2rem' }}>Rainfall</p>
                  <p style={{ fontSize: '0.95rem', fontWeight: 800 }}>{weather.current.expectedRainfall} mm</p>
                </div>

                {/* Humidity */}
                <div style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '0.65rem 0.35rem', borderRadius: '12px' }}>
                  <span style={{ fontSize: '1.15rem' }}>💧</span>
                  <p style={{ fontSize: '0.68rem', opacity: 0.8, marginTop: '0.2rem' }}>Humidity</p>
                  <p style={{ fontSize: '0.95rem', fontWeight: 800 }}>{weather.current.humidity}%</p>
                </div>

                {/* Wind */}
                <div style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '0.65rem 0.35rem', borderRadius: '12px' }}>
                  <span style={{ fontSize: '1.15rem' }}>💨</span>
                  <p style={{ fontSize: '0.68rem', opacity: 0.8, marginTop: '0.2rem' }}>Wind</p>
                  <p style={{ fontSize: '0.95rem', fontWeight: 800 }}>{weather.current.windSpeed} km/h</p>
                </div>
              </div>
            </div>

            {/* ── Crop Protection Alert Card (PART 19 Requirement) ── */}
            <div
              className="card"
              id="crop-protection-alert-card"
              style={{
                borderLeft: `5px solid ${weather.cropProtectionAlert.level === 'warning' ? '#ea580c' : '#16a34a'}`,
                borderRadius: '14px',
                padding: '1rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
                <span style={{ fontSize: '1.8rem' }}>🛡️</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                      {weather.cropProtectionAlert.title}
                    </h3>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '0.15rem 0.5rem',
                        borderRadius: '12px',
                        background: weather.cropProtectionAlert.level === 'warning' ? '#ffedd5' : '#dcfce7',
                        color: weather.cropProtectionAlert.level === 'warning' ? '#c2410c' : '#166534',
                      }}
                    >
                      {weather.cropProtectionAlert.level === 'warning' ? 'Alert' : 'Safe Window'}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.3rem', lineHeight: 1.45 }}>
                    {weather.cropProtectionAlert.message}
                  </p>
                  <p style={{ fontSize: '0.8rem', color: '#166534', marginTop: '0.35rem', fontWeight: 600 }}>
                    💡 Action: {weather.cropProtectionAlert.recommendation}
                  </p>
                </div>
              </div>
            </div>

            {/* ── Smart Farm Operations Advisories ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0.25rem 0 0' }}>
                🌾 Farm Operations Advisory
              </h3>

              {/* Spraying Advisory Card */}
              <div
                className="card"
                id="spraying-advisory-card"
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.9rem',
                  borderLeft: `5px solid ${weather.advisory.spraying.status === 'safe' ? '#16a34a' : '#ea580c'}`,
                  borderRadius: '14px',
                  padding: '1rem',
                }}
              >
                <span style={{ fontSize: '1.8rem' }}>🎯</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                      Pest & Nutrient Spraying Window
                    </h4>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '0.15rem 0.5rem',
                        borderRadius: '20px',
                        background: weather.advisory.spraying.status === 'safe' ? '#dcfce7' : '#ffedd5',
                        color: weather.advisory.spraying.status === 'safe' ? '#166534' : '#c2410c',
                      }}
                    >
                      {weather.advisory.spraying.badge}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem', lineHeight: 1.4 }}>
                    {weather.advisory.spraying.text}
                  </p>
                </div>
              </div>

              {/* Irrigation Advisory Card */}
              <div
                className="card"
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.9rem',
                  borderLeft: `5px solid ${weather.advisory.irrigation.status === 'skip' ? '#3b82f6' : '#22c55e'}`,
                  borderRadius: '14px',
                  padding: '1rem',
                }}
              >
                <span style={{ fontSize: '1.8rem' }}>🚰</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                      Irrigation & Moisture
                    </h4>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '0.15rem 0.5rem',
                        borderRadius: '20px',
                        background: weather.advisory.irrigation.status === 'skip' ? '#dbeafe' : '#dcfce7',
                        color: weather.advisory.irrigation.status === 'skip' ? '#1e40af' : '#166534',
                      }}
                    >
                      {weather.advisory.irrigation.badge}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem', lineHeight: 1.4 }}>
                    {weather.advisory.irrigation.text}
                  </p>
                </div>
              </div>
            </div>

            {/* ── 7-Day Agricultural Forecast (PART 19 Requirement) ── */}
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0.5rem 0 0.6rem' }}>
                📅 7-Day Agricultural Forecast
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {weather.daily.map((d, i) => (
                  <div
                    key={i}
                    className="card forecast-card"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.85rem 1rem',
                      borderRadius: '14px',
                    }}
                  >
                    <div style={{ width: '90px' }}>
                      <p style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                        {d.day}
                      </p>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>{d.text}</p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <span style={{ fontSize: '1.6rem' }}>{d.icon}</span>
                      <span style={{ fontSize: '0.74rem', color: '#0284c7', fontWeight: 600 }}>
                        ☂️ {d.pop}%
                      </span>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.94rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {d.max}°
                      </span>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginLeft: '0.35rem' }}>
                        {d.min}°
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

      </div>
    </AppLayout>
  );
};

export default WeatherPage;
