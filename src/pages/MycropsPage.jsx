import { Link } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import { useCrops } from '../context/CropContext';
import { formatDate, daysUntilHarvest } from '../utils/dateUtils';
import Loader from '../components/common/Loader';

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

const MycropsPage = () => {
  const { crops, loading, error } = useCrops();

  const activeCrops = crops.filter((c) => c.status === 'Active');
  const harvestedCrops = crops.filter((c) => c.status === 'Harvested');

  return (
    <AppLayout
      title="My Farmland Crops"
      subtitle={`${activeCrops.length} active crop${activeCrops.length !== 1 ? 's' : ''} currently registered`}
      showBack
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

        {/* ── Header with Add Crop Button ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Registered Field Parcels
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.1rem 0 0' }}>
              Track growth cycles, watering schedules, and harvest milestones
            </p>
          </div>
          <Link to="/crops/add" id="add-crop-fab" className="btn btn-primary btn-sm">
            + Add New Crop
          </Link>
        </div>

        {loading && <Loader text="Loading your crops..." />}
        {error && <p style={{ color: 'var(--color-danger)', fontSize: '0.85rem' }}>{error}</p>}

        {/* ── Empty State ── */}
        {!loading && crops.length === 0 && (
          <div className="card" id="crops-empty-state" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
            <span style={{ fontSize: '3rem' }}>🌾</span>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0.75rem 0 0.35rem', color: 'var(--text-primary)' }}>
              No crops registered yet
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', maxWidth: '360px', margin: '0 auto 1.25rem' }}>
              Register your first planted crop to track watering schedules, growth stages, harvest alerts, and profit projections.
            </p>
            <Link to="/crops/add" id="add-first-crop-link" className="btn btn-primary">
              + Register First Crop
            </Link>
          </div>
        )}

        {/* ── Active Crops Grid (PART 16 Requirement) ── */}
        {!loading && activeCrops.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '1rem' }}>
            {activeCrops.map((crop) => {
              const daysLeft = crop.expectedHarvestDate ? daysUntilHarvest(crop.expectedHarvestDate) : null;
              const isHarvestSoon = daysLeft !== null && daysLeft <= 14;
              const progress = STAGE_PROGRESS[crop.currentGrowthStage] || 50;
              const icon = CROP_ICONS[crop.cropName] || '🌱';

              return (
                <Link
                  key={crop._id}
                  to={`/crops/${crop._id}`}
                  className="card crop-card"
                  id={`crop-card-${crop._id}`}
                  style={{
                    display: 'block',
                    textDecoration: 'none',
                    borderRadius: '16px',
                    padding: '1.25rem',
                    transition: 'all 0.15s ease',
                    border: isHarvestSoon ? '1.5px solid #ca8a04' : '1px solid #e5e7eb',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontSize: '2.4rem' }}>{icon}</span>
                      <div>
                        <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                          {crop.cropName}
                        </h4>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0.1rem 0 0' }}>
                          {crop.landArea} {crop.areaUnit} · {crop.soilType} soil
                        </p>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '0.15rem 0.5rem',
                        borderRadius: '10px',
                        background: isHarvestSoon ? '#fef9c3' : '#dcfce7',
                        color: isHarvestSoon ? '#854d0e' : '#166534',
                      }}
                    >
                      {isHarvestSoon ? 'Harvest Soon' : 'Growing'}
                    </span>
                  </div>

                  {/* Growth Stage & Progress */}
                  <div style={{ marginTop: '0.85rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.35rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Growth: <strong>{crop.currentGrowthStage}</strong></span>
                      <span style={{ fontWeight: 700, color: '#166534' }}>{progress}%</span>
                    </div>
                    <div style={{ height: '6px', background: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${progress}%`, height: '100%', background: '#2d7d46', borderRadius: '4px' }} />
                    </div>
                  </div>

                  {/* Operational Details Grid */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: '0.5rem',
                      marginTop: '0.85rem',
                      paddingTop: '0.65rem',
                      borderTop: '1px solid #f1f5f2',
                      fontSize: '0.75rem',
                    }}
                  >
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Planted:</span>
                      <p style={{ fontWeight: 600, color: 'var(--text-primary)', margin: '0.1rem 0 0' }}>
                        {formatDate(crop.plantingDate)}
                      </p>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Expected Harvest:</span>
                      <p style={{ fontWeight: 600, color: isHarvestSoon ? '#b45309' : 'var(--text-primary)', margin: '0.1rem 0 0' }}>
                        {crop.expectedHarvestDate ? formatDate(crop.expectedHarvestDate) : 'Not specified'}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* ── Harvested Crops ── */}
        {!loading && harvestedCrops.length > 0 && (
          <div style={{ marginTop: '1rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
              Past Harvested Crops ({harvestedCrops.length})
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '0.75rem', opacity: 0.75 }}>
              {harvestedCrops.map((crop) => (
                <Link
                  key={crop._id}
                  to={`/crops/${crop._id}`}
                  className="card"
                  style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1rem' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <span style={{ fontSize: '1.6rem' }}>✅</span>
                    <div>
                      <p style={{ fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>{crop.cropName}</p>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>
                        {crop.landArea} {crop.areaUnit}
                      </p>
                    </div>
                  </div>
                  <span style={{ fontSize: '0.72rem', background: '#f3f4f6', color: '#6b7280', padding: '0.15rem 0.5rem', borderRadius: '8px', fontWeight: 600 }}>
                    Harvested
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

      </div>
    </AppLayout>
  );
};

export default MycropsPage;
