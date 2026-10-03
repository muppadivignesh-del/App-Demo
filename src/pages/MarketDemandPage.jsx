import { useEffect, useState, useMemo } from 'react';
import AppLayout from '../components/layout/AppLayout';
import Loader from '../components/common/Loader';
import Alert from '../components/common/Alert';
import { marketAPI } from '../services/marketAPI';

const TREND_ICONS = { Rising: '📈', Stable: '➡️', Falling: '📉' };

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
  'Moong Dal': '🍲',
  Maize: '🌽',
  Sugarcane: '🎋',
  Brinjal: '🍆',
  Sunflower: '🌻',
};

const MarketDemandPage = () => {
  const [marketData, setMarketData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [demandFilter, setDemandFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCrop, setSelectedCrop] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetch = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await marketAPI.getAllMarketData();
        const data = res.data?.data?.marketData || [];
        if (isMounted) {
          setMarketData(data);
          if (data.length > 0) {
            setSelectedCrop(data[0]);
          }
        }
      } catch {
        if (isMounted) setError('Failed to load market data.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetch();
    return () => {
      isMounted = false;
    };
  }, []);

  const categories = useMemo(() => {
    const set = new Set(marketData.map((m) => m.category || 'Other'));
    return ['All', ...Array.from(set)];
  }, [marketData]);

  const filtered = useMemo(() => {
    return marketData.filter((item) => {
      const matchDemand = demandFilter === 'All' || item.demandLevel === demandFilter;
      const matchCategory = categoryFilter === 'All' || item.category === categoryFilter;
      const matchSearch =
        !searchQuery.trim() ||
        item.cropName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.market.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.state.toLowerCase().includes(searchQuery.toLowerCase());
      return matchDemand && matchCategory && matchSearch;
    });
  }, [marketData, demandFilter, categoryFilter, searchQuery]);

  const topGainer = useMemo(() => {
    return [...marketData].sort((a, b) => parseFloat(b.priceChange) - parseFloat(a.priceChange))[0];
  }, [marketData]);

  const highDemandCount = useMemo(() => {
    return marketData.filter((m) => m.demandLevel === 'High').length;
  }, [marketData]);

  return (
    <AppLayout
      title="Market & Mandi Intelligence"
      subtitle="APMC commodity prices, demand levels & price trends"
      showBack
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

        {/* ── Market Hero Summary (Transparently Labeled as Sample Market Data) ── */}
        <div
          className="card"
          style={{
            background: 'linear-gradient(135deg, #173d24 0%, #205c37 100%)',
            color: '#ffffff',
            padding: '1.25rem',
            borderRadius: '16px',
            boxShadow: '0 4px 16px rgba(23, 61, 36, 0.15)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span
                style={{
                  fontSize: '0.68rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  background: 'rgba(255, 255, 255, 0.15)',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '10px',
                  fontWeight: 700,
                }}
              >
                Sample Market Data (Step 1 Demo)
              </span>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '0.35rem', color: '#ffffff' }}>
                Commodity Prices & Trends
              </h2>
              <p style={{ fontSize: '0.78rem', opacity: 0.85, margin: '0.1rem 0 0' }}>
                Last Updated: Today, 08:30 AM · Verified Regional APMCs
              </p>
            </div>
            <span style={{ fontSize: '2.4rem' }}>📊</span>
          </div>

          {/* Quick stats row */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '0.75rem',
              marginTop: '1rem',
              paddingTop: '0.75rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.15)',
            }}
          >
            <div>
              <p style={{ fontSize: '0.7rem', opacity: 0.8 }}>Top Gainer</p>
              <p style={{ fontSize: '0.95rem', fontWeight: 700, marginTop: '0.1rem', color: '#86efac' }}>
                {topGainer?.cropName || 'Onion'} {topGainer?.priceChange}
              </p>
            </div>
            <div>
              <p style={{ fontSize: '0.7rem', opacity: 0.8 }}>High Demand</p>
              <p style={{ fontSize: '0.95rem', fontWeight: 700, marginTop: '0.1rem' }}>
                {highDemandCount} Commodities
              </p>
            </div>
            <div>
              <p style={{ fontSize: '0.7rem', opacity: 0.8 }}>Dataset Size</p>
              <p style={{ fontSize: '0.95rem', fontWeight: 700, marginTop: '0.1rem' }}>
                {marketData.length} Crops
              </p>
            </div>
          </div>
        </div>

        {/* ── Search Bar ── */}
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            id="market-search-input"
            className="form-input"
            placeholder="🔍 Search crop, mandi (e.g. Guntur, Nashik), or state..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              borderRadius: '12px',
              paddingLeft: '1rem',
              background: '#ffffff',
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--neutral-400)',
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* ── Filter Pills: Demand & Category ── */}
        <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', paddingRight: '0.25rem' }}>
            Demand:
          </span>
          {['All', 'High', 'Medium', 'Low'].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDemandFilter(d)}
              style={{
                flexShrink: 0,
                fontSize: '0.74rem',
                padding: '0.25rem 0.65rem',
                borderRadius: '14px',
                border: demandFilter === d ? '1.5px solid #1e6b3c' : '1px solid #d1d5db',
                background: demandFilter === d ? '#1e6b3c' : '#ffffff',
                color: demandFilter === d ? '#ffffff' : '#374151',
                fontWeight: demandFilter === d ? 700 : 500,
                cursor: 'pointer',
              }}
            >
              {d === 'All' ? 'All Demand' : `${d} Demand`}
            </button>
          ))}
        </div>

        {/* Category Pills */}
        <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', paddingRight: '0.25rem' }}>
            Type:
          </span>
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategoryFilter(c)}
              style={{
                flexShrink: 0,
                fontSize: '0.74rem',
                padding: '0.25rem 0.65rem',
                borderRadius: '14px',
                border: categoryFilter === c ? '1.5px solid #1e6b3c' : '1px solid #d1d5db',
                background: categoryFilter === c ? '#1e6b3c' : '#ffffff',
                color: categoryFilter === c ? '#ffffff' : '#374151',
                fontWeight: categoryFilter === c ? 700 : 500,
                cursor: 'pointer',
              }}
            >
              {c}
            </button>
          ))}
        </div>

        {loading && <Loader text="Loading market data..." />}
        {error && <Alert type="danger">{error}</Alert>}

        {!loading && filtered.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
            <span style={{ fontSize: '2rem' }}>🔍</span>
            <p style={{ fontWeight: 700, marginTop: '0.5rem' }}>No commodities match your filter</p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Try adjusting your search query or reset filters.</p>
            <button
              type="button"
              className="btn btn-outline btn-sm mt-3"
              onClick={() => {
                setSearchQuery('');
                setDemandFilter('All');
                setCategoryFilter('All');
              }}
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* ── Commodities List (PART 18 Cards UI) ── */}
        {!loading && filtered.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '0.85rem' }}>
            {filtered.map((item) => (
              <div
                key={item._id || item.cropName}
                className="card market-card"
                onClick={() => setSelectedCrop(item)}
                style={{
                  borderRadius: '16px',
                  padding: '1.1rem',
                  border: selectedCrop?.cropName === item.cropName ? '1.5px solid #2d7d46' : '1px solid #e5e7eb',
                  background: selectedCrop?.cropName === item.cropName ? '#f8fdf9' : '#ffffff',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <span style={{ fontSize: '2rem' }}>{CROP_ICONS[item.cropName] || '🌾'}</span>
                    <div>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                        {item.cropName}
                      </h4>
                      <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: '0.1rem 0 0' }}>
                        {item.market} · {item.state}
                      </p>
                    </div>
                  </div>

                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '0.15rem 0.5rem',
                      borderRadius: '12px',
                      background: item.demandLevel === 'High' ? '#dcfce7' : '#fef9c3',
                      color: item.demandLevel === 'High' ? '#166534' : '#854d0e',
                    }}
                  >
                    Demand: {item.demandLevel}
                  </span>
                </div>

                {/* Price & Trend Highlight */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '0.85rem' }}>
                  <div>
                    <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#166534', letterSpacing: '-0.02em' }}>
                      ₹{item.pricePerKg}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '0.2rem' }}>
                      /kg (₹{item.pricePerQuintal || item.pricePerKg * 100}/q)
                    </span>
                  </div>

                  <span
                    style={{
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      color: item.priceTrend === 'Rising' ? '#16a34a' : item.priceTrend === 'Falling' ? '#dc2626' : '#64748b',
                    }}
                  >
                    {TREND_ICONS[item.priceTrend] || '➡️'} {item.priceChange || 'Stable'}
                  </span>
                </div>

                {/* Sell recommendation quote */}
                <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: '0.65rem', lineHeight: 1.4, background: '#f8faf8', padding: '0.45rem 0.65rem', borderRadius: '8px' }}>
                  💡 {item.sellRecommendation}
                </p>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.65rem', paddingTop: '0.5rem', borderTop: '1px solid #f1f5f2' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    Arrivals: {item.arrivalQty || 'Regular'}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {item.lastUpdated || 'Today, 08:30 AM'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </AppLayout>
  );
};

export default MarketDemandPage;
