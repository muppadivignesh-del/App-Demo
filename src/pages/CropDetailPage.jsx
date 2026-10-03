import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import { useCrops } from '../context/CropContext';
import { cropAPI } from '../services/cropAPI';
import Alert from '../components/common/Alert';
import Loader from '../components/common/Loader';
import { formatDate, timeAgo, daysUntilHarvest } from '../utils/dateUtils';
import { GROWTH_STAGES, getNextStage } from '../constants/growthStages';


const CropDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { crops, updateGrowthStage, deleteCrop } = useCrops();

  const [crop, setCrop] = useState(null);
  const [wateringLogs, setWateringLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stageUpdating, setStageUpdating] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showWaterModal, setShowWaterModal] = useState(false);
  const [waterForm, setWaterForm] = useState({ wateredAt: '', method: 'Manual', notes: '' });
  const [waterLoading, setWaterLoading] = useState(false);

  useEffect(() => {
    const existing = crops.find((c) => c._id === id);
    if (existing) {
      setCrop(existing);
      setLoading(false);
    }

    const fetchCrop = async () => {
      try {
        const res = await cropAPI.getCropById(id);
        setCrop(res.data?.data?.crop || existing);
        setWateringLogs(res.data?.data?.wateringLogs || []);
      } catch {
        if (!existing) setError('Crop record not found.');
      } finally {
        setLoading(false);
      }
    };
    fetchCrop();
  }, [id, crops]);

  const handleNextStage = async () => {
    const nextStage = getNextStage(crop.currentGrowthStage);
    if (!nextStage) return;
    setStageUpdating(true);
    try {
      const updated = await updateGrowthStage(id, nextStage);
      setCrop(updated);
    } finally {
      setStageUpdating(false);
    }
  };

  const handleDelete = async () => {
    await deleteCrop(id);
    navigate('/crops', { replace: true });
  };

  const handleLogWater = async (e) => {
    e.preventDefault();
    setWaterLoading(true);
    try {
      const res = await cropAPI.logWatering(id, waterForm);
      setWateringLogs((prev) => [res.data.data.wateringLog, ...prev]);
      setCrop((c) => ({ ...c, lastWateredAt: res.data.data.wateringLog.wateredAt }));
      setShowWaterModal(false);
      setWaterForm({ wateredAt: '', method: 'Manual', notes: '' });
    } finally {
      setWaterLoading(false);
    }
  };

  if (loading) {
    return (
      <AppLayout title="Crop Details" showBack>
        <Loader text="Loading crop information..." />
      </AppLayout>
    );
  }

  if (error || !crop) {
    return (
      <AppLayout title="Crop Details" showBack>
        <Alert type="danger">{error || 'Crop not found.'}</Alert>
      </AppLayout>
    );
  }

  const daysToHarvest = crop.expectedHarvestDate ? daysUntilHarvest(crop.expectedHarvestDate) : null;
  const nextStage = getNextStage(crop.currentGrowthStage);
  const stageIndex = GROWTH_STAGES.findIndex((s) => s.id === crop.currentGrowthStage);

  return (
    <AppLayout
      title={`${crop.cropName} Details`}
      subtitle={`${crop.landArea} ${crop.areaUnit} · ${crop.currentGrowthStage} Stage`}
      showBack
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

        {/* ── Crop Hero Card ── */}
        <div
          className="card"
          style={{
            background: 'linear-gradient(135deg, #173d24 0%, #205c37 100%)',
            color: '#ffffff',
            borderRadius: '16px',
            padding: '1.5rem',
            boxShadow: '0 4px 16px rgba(23,61,36,0.15)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', opacity: 0.85 }}>
                FARMLAND CROP PARCEL
              </span>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0.2rem 0', color: '#ffffff' }}>
                🌿 {crop.cropName}
              </h2>
              <p style={{ fontSize: '0.84rem', opacity: 0.85, margin: 0 }}>
                {crop.landArea} {crop.areaUnit} · {crop.soilType} Soil · {crop.waterAvailability || 'Borewell'}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Link
                to={`/crops/${id}/edit`}
                className="btn btn-sm"
                style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '10px' }}
              >
                ✏️ Edit Crop
              </Link>
            </div>
          </div>

          {daysToHarvest !== null && (
            <div style={{ marginTop: '1.25rem', background: 'rgba(255,255,255,0.15)', borderRadius: '12px', padding: '0.75rem 1rem' }}>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.72rem', margin: 0 }}>EXPECTED HARVEST MILESTONE</p>
              <p style={{ color: '#ffffff', fontWeight: 800, fontSize: '1rem', margin: '0.2rem 0 0' }}>
                {formatDate(crop.expectedHarvestDate)}
                {daysToHarvest > 0 ? ` — in ${daysToHarvest} days` : ' — Ready for harvest!'}
              </p>
            </div>
          )}
        </div>

        {/* ── Growth Stage Tracker ── */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              🌱 Growth Stage Progress
            </h3>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '0.2rem 0.6rem',
                borderRadius: '12px',
                background: '#dcfce7',
                color: '#166534',
              }}
            >
              Current: {crop.currentGrowthStage}
            </span>
          </div>

          {/* Stepper */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', overflowX: 'auto', paddingBottom: '0.75rem' }}>
            {GROWTH_STAGES.map((stage, idx) => (
              <div key={stage.id} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexShrink: 0 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                  <div
                    style={{
                      width: '2.2rem',
                      height: '2.2rem',
                      borderRadius: '50%',
                      background: idx <= stageIndex ? '#2d7d46' : '#f1f5f2',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.85rem',
                      color: idx <= stageIndex ? '#ffffff' : '#9ca3af',
                      border: idx === stageIndex ? '2px solid #16a34a' : 'none',
                      boxShadow: idx === stageIndex ? '0 0 0 3px rgba(45,125,70,0.2)' : 'none',
                    }}
                  >
                    {idx < stageIndex ? '✓' : stage.icon}
                  </div>
                  <span style={{ fontSize: '0.65rem', color: idx <= stageIndex ? '#166534' : '#9ca3af', fontWeight: 600, textAlign: 'center', maxWidth: '3.5rem' }}>
                    {stage.label}
                  </span>
                </div>
                {idx < GROWTH_STAGES.length - 1 && (
                  <div style={{ width: '1.5rem', height: '2px', background: idx < stageIndex ? '#4caf72' : '#e5e7eb', marginBottom: '1.2rem' }} />
                )}
              </div>
            ))}
          </div>

          {nextStage ? (
            <button
              id="advance-stage-btn"
              type="button"
              className="btn btn-outline btn-full btn-sm"
              onClick={handleNextStage}
              disabled={stageUpdating}
              style={{ marginTop: '0.5rem' }}
            >
              {stageUpdating ? 'Updating stage...' : `→ Advance Growth Stage to ${nextStage}`}
            </button>
          ) : (
            <Alert type="success">🌾 This crop parcel has reached the final Harvest stage!</Alert>
          )}
        </div>

        {/* ── Watering & Moisture History ── */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              💧 Irrigation & Watering
            </h3>
            <button
              id="log-water-btn"
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setShowWaterModal(true)}
            >
              + Log Watering
            </button>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
            Last recorded watering: <strong>{crop.lastWateredAt ? timeAgo(crop.lastWateredAt) : 'No watering recorded yet'}</strong>
          </p>

          {wateringLogs.length > 0 && (
            <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              {wateringLogs.slice(0, 5).map((log) => (
                <div
                  key={log._id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '0.5rem 0.75rem',
                    background: '#f8faf8',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    border: '1px solid #eef2ee',
                  }}
                >
                  <span style={{ fontWeight: 600 }}>💧 {log.method}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{formatDate(log.wateredAt)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Crop Agronomic Attributes ── */}
        <div className="card">
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
            📋 Field Attributes
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.45rem 0', borderBottom: '1px solid #f1f5f2', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Planted On</span>
              <span style={{ fontWeight: 600 }}>{formatDate(crop.plantingDate)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.45rem 0', borderBottom: '1px solid #f1f5f2', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Soil Type</span>
              <span style={{ fontWeight: 600 }}>{crop.soilType}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.45rem 0', borderBottom: '1px solid #f1f5f2', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Water Source</span>
              <span style={{ fontWeight: 600 }}>{crop.waterAvailability || 'Borewell'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.45rem 0', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Expected Yield</span>
              <span style={{ fontWeight: 600 }}>{crop.expectedYield ? `${crop.expectedYield} ${crop.yieldUnit || 'kg'}` : '—'}</span>
            </div>
          </div>
          {crop.notes && (
            <p style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic', background: '#f8faf8', padding: '0.5rem 0.75rem', borderRadius: '8px' }}>
              📝 Notes: {crop.notes}
            </p>
          )}
        </div>

        {/* ── Delete Crop Action ── */}
        {!showDeleteConfirm ? (
          <button
            type="button"
            id="delete-crop-btn"
            className="btn btn-outline"
            style={{ color: '#dc2626', borderColor: '#fca5a5' }}
            onClick={() => setShowDeleteConfirm(true)}
          >
            🗑 Delete Crop Record
          </button>
        ) : (
          <div className="card" style={{ border: '1.5px solid #ef4444', background: '#fef2f2' }}>
            <p style={{ fontWeight: 700, color: '#b91c1c', marginBottom: '0.75rem' }}>
              Are you sure you want to permanently delete {crop.cropName}?
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                id="confirm-delete-btn"
                className="btn btn-danger"
                style={{ flex: 1 }}
                onClick={handleDelete}
              >
                Yes, Delete
              </button>
              <button
                type="button"
                className="btn btn-outline"
                style={{ flex: 1, background: 'white' }}
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* ── Log Water Modal ── */}
        {showWaterModal && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 300,
              padding: '1rem',
            }}
          >
            <div style={{ background: '#ffffff', borderRadius: '16px', padding: '1.5rem', width: '100%', maxWidth: '420px', boxShadow: '0 8px 30px rgba(0,0,0,0.2)' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--text-primary)' }}>
                💧 Record Crop Watering
              </h3>
              <form onSubmit={handleLogWater} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Date & Time</label>
                  <input
                    type="datetime-local"
                    name="wateredAt"
                    className="form-input"
                    value={waterForm.wateredAt}
                    onChange={(e) => setWaterForm((p) => ({ ...p, wateredAt: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Irrigation Method</label>
                  <select
                    name="method"
                    className="form-input form-select"
                    value={waterForm.method}
                    onChange={(e) => setWaterForm((p) => ({ ...p, method: e.target.value }))}
                  >
                    {['Drip', 'Sprinkler', 'Canal / Flood', 'Manual', 'Rain'].map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Notes (Optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. 2 hours drip with foliar zinc"
                    value={waterForm.notes}
                    onChange={(e) => setWaterForm((p) => ({ ...p, notes: e.target.value }))}
                  />
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    className="btn btn-outline"
                    style={{ flex: 1 }}
                    onClick={() => setShowWaterModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ flex: 1 }}
                    disabled={waterLoading}
                  >
                    {waterLoading ? 'Saving...' : '💧 Save Log'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </AppLayout>
  );
};

export default CropDetailPage;
