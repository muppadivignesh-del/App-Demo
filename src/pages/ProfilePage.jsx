import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import { useAuth } from '../context/AuthContext';
import { useCrops } from '../context/CropContext';
import Alert from '../components/common/Alert';
import { farmerAPI } from '../services/farmerAPI';
import {
  SOIL_TYPES, WATER_AVAILABILITY, IRRIGATION_TYPES,
  AREA_UNITS, INDIAN_STATES,
} from '../constants/farmConstants';

const ProfilePage = () => {
  const { farmer, logout, updateFarmerLocally } = useAuth();
  const { activeCrops } = useCrops();
  const navigate = useNavigate();

  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    name: farmer?.name || '',
    phone: farmer?.phone || '',
    village: farmer?.location?.village || farmer?.village || '',
    district: farmer?.location?.district || farmer?.district || '',
    state: farmer?.location?.state || farmer?.state || '',
    totalArea: farmer?.landDetails?.totalArea ?? farmer?.landArea ?? '',
    areaUnit: farmer?.landDetails?.areaUnit || farmer?.areaUnit || 'acres',
    soilType: farmer?.landDetails?.soilType || farmer?.soilType || 'Loamy',
    waterAvailability: farmer?.landDetails?.waterAvailability || farmer?.waterAvailability || 'Rain-fed',
    irrigationType: farmer?.landDetails?.irrigationType || farmer?.irrigationType || 'None',
  });

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setError('');
    setSuccess('');
  };

  const handleStartEdit = () => {
    setForm({
      name: farmer?.name || '',
      phone: farmer?.phone || '',
      village: farmer?.location?.village || farmer?.village || '',
      district: farmer?.location?.district || farmer?.district || '',
      state: farmer?.location?.state || farmer?.state || '',
      totalArea: farmer?.landDetails?.totalArea ?? farmer?.landArea ?? '',
      areaUnit: farmer?.landDetails?.areaUnit || farmer?.areaUnit || 'acres',
      soilType: farmer?.landDetails?.soilType || farmer?.soilType || 'Loamy',
      waterAvailability: farmer?.landDetails?.waterAvailability || farmer?.waterAvailability || 'Rain-fed',
      irrigationType: farmer?.landDetails?.irrigationType || farmer?.irrigationType || 'None',
    });
    setEditing(true);
    setSuccess('');
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setError('');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Name is required.');
      return;
    }
    const cleanPhone = form.phone.trim();
    if (!cleanPhone) {
      setError('Phone number is required.');
      return;
    }
    if (cleanPhone.length === 9) {
      setError('Phone number not acceptable: 9 digits is not acceptable. Please enter a valid 10-digit phone number.');
      return;
    }
    if (cleanPhone.length < 10 || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      setError('Phone number not acceptable. Please enter a valid 10-digit Indian phone number starting with 6-9.');
      return;
    }

    setLoading(true);
    try {
      const res = await farmerAPI.updateProfile({
        name: form.name.trim(),
        phone: form.phone.trim(),
        village: form.village.trim(),
        district: form.district.trim(),
        state: form.state,
        landArea: parseFloat(form.totalArea) || 0,
        areaUnit: form.areaUnit,
        soilType: form.soilType,
        waterAvailability: form.waterAvailability,
        irrigationType: form.irrigationType,
        location: {
          village: form.village.trim(),
          district: form.district.trim(),
          state: form.state,
        },
        landDetails: {
          totalArea: parseFloat(form.totalArea) || 0,
          areaUnit: form.areaUnit,
          soilType: form.soilType,
          waterAvailability: form.waterAvailability,
          irrigationType: form.irrigationType,
        },
      });

      updateFarmerLocally(res.data.data.farmer);
      setSuccess('Profile updated successfully! Dashboard reflected.');
      setEditing(false);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Update failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  if (!farmer) return null;

  const totalAreaDisplay = farmer.landDetails?.totalArea ?? farmer.landArea ?? 0;
  const areaUnitDisplay = farmer.landDetails?.areaUnit || farmer.areaUnit || 'acres';
  const soilTypeDisplay = farmer.landDetails?.soilType || farmer.soilType || 'Loamy';
  const waterAvailDisplay = farmer.landDetails?.waterAvailability || farmer.waterAvailability || 'Rain-fed';
  const irrigationDisplay = farmer.landDetails?.irrigationType || farmer.irrigationType || 'None';

  return (
    <AppLayout
      title="Farmer Profile & Farm Records"
      subtitle="Manage your personal credentials, land records & agricultural setup"
      showBack
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

        {/* ── Farmer Hero Card ── */}
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #2d7d46, #4caf72)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.75rem',
                  fontWeight: 800,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                  border: '2px solid rgba(255,255,255,0.4)',
                }}
              >
                {farmer.name ? farmer.name[0].toUpperCase() : '👨‍🌾'}
              </div>
              <div>
                <h2 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                  {farmer.name}
                </h2>
                <p style={{ fontSize: '0.84rem', opacity: 0.85, margin: '0.15rem 0 0' }}>
                  {farmer.email || farmer.phone}
                </p>
                <p style={{ fontSize: '0.78rem', opacity: 0.8, margin: '0.1rem 0 0' }}>
                  📍 {farmer.location?.village || farmer.village || 'Village'}, {farmer.location?.district || farmer.district || 'District'}, {farmer.location?.state || farmer.state || 'State'}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {!editing && (
                <button
                  type="button"
                  id="edit-profile-btn"
                  className="btn btn-sm"
                  onClick={handleStartEdit}
                  style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '10px' }}
                >
                  ✏️ Edit Profile
                </button>
              )}
              <button
                type="button"
                id="logout-btn"
                className="btn btn-sm btn-danger"
                onClick={handleLogout}
                style={{ borderRadius: '10px' }}
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>

        {success && <Alert type="success">{success}</Alert>}
        {error && <Alert type="danger">{error}</Alert>}

        {!editing ? (
          /* ── View Profile Sections (PART 20 Requirements) ── */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* Section 1: Personal & Contact Information */}
            <div className="card">
              <h3 style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>👤</span> Personal & Contact Information
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.45rem 0', borderBottom: '1px solid #f1f5f2', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Full Name</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{farmer.name}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.45rem 0', borderBottom: '1px solid #f1f5f2', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Phone Number</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{farmer.phone}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.45rem 0', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Email Address</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{farmer.email || '—'}</span>
                </div>
              </div>
            </div>

            {/* Section 2: Farming Location */}
            <div className="card">
              <h3 style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>📍</span> Farming Location
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.45rem 0', borderBottom: '1px solid #f1f5f2', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Village / Town</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{farmer.location?.village || farmer.village || '—'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.45rem 0', borderBottom: '1px solid #f1f5f2', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>District</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{farmer.location?.district || farmer.district || '—'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.45rem 0', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>State</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{farmer.location?.state || farmer.state || '—'}</span>
                </div>
              </div>
            </div>

            {/* Section 3: Land & Soil Details */}
            <div className="card">
              <h3 style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>🌾</span> Land & Soil Details
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.45rem 0', borderBottom: '1px solid #f1f5f2', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Total Land Area</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{totalAreaDisplay} {areaUnitDisplay}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.45rem 0', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Soil Type</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{soilTypeDisplay}</span>
                </div>
              </div>
            </div>

            {/* Section 4: Water & Irrigation */}
            <div className="card">
              <h3 style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>💧</span> Water & Irrigation
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.45rem 0', borderBottom: '1px solid #f1f5f2', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Water Availability Source</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{waterAvailDisplay}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.45rem 0', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Irrigation Infrastructure</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{irrigationDisplay}</span>
                </div>
              </div>
            </div>

            {/* Section 5: Current Crops */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h3 style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>🌱</span> Current Farmland Crops ({activeCrops.length})
                </h3>
                <Link to="/crops" style={{ fontSize: '0.78rem', color: '#1b4d2e', fontWeight: 700 }}>
                  Manage Crops →
                </Link>
              </div>

              {activeCrops.length === 0 ? (
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>No crops recorded yet.</p>
              ) : (
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {activeCrops.map((c) => (
                    <span
                      key={c._id}
                      style={{
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        padding: '0.3rem 0.65rem',
                        borderRadius: '12px',
                        background: '#f1f5f2',
                        color: '#1a3d25',
                        border: '1px solid #d8e2d9',
                      }}
                    >
                      {c.cropName} ({c.landArea} {c.areaUnit}) · {c.currentGrowthStage}
                    </span>
                  ))}
                </div>
              )}
            </div>

          </div>
        ) : (
          /* ── Edit Profile Form (Sectioned) ── */
          <form onSubmit={handleSave} id="edit-profile-form" noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="card">
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.85rem', color: 'var(--text-primary)' }}>
                Personal Information
              </h3>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input name="name" type="text" className="form-input" value={form.name} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number (10 digits)</label>
                <input name="phone" type="tel" className="form-input" value={form.phone} onChange={handleChange} maxLength={10} required />
              </div>
            </div>

            <div className="card">
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.85rem', color: 'var(--text-primary)' }}>
                Farming Location
              </h3>
              <div className="form-group">
                <label className="form-label">Village / Town</label>
                <input name="village" type="text" className="form-input" value={form.village} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">District</label>
                <input name="district" type="text" className="form-input" value={form.district} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">State</label>
                <select name="state" className="form-input form-select" value={form.state} onChange={handleChange}>
                  <option value="">Select State</option>
                  {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div className="card">
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.85rem', color: 'var(--text-primary)' }}>
                Land & Soil
              </h3>
              <div className="form-row-2">
                <div className="form-group" style={{ flex: 2 }}>
                  <label className="form-label">Total Land Area</label>
                  <input name="totalArea" type="number" className="form-input" value={form.totalArea} onChange={handleChange} min="0.1" step="any" />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Unit</label>
                  <select name="areaUnit" className="form-input form-select" value={form.areaUnit} onChange={handleChange}>
                    {AREA_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Soil Type</label>
                <select name="soilType" className="form-input form-select" value={form.soilType} onChange={handleChange}>
                  {SOIL_TYPES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div className="card">
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.85rem', color: 'var(--text-primary)' }}>
                Water & Irrigation
              </h3>
              <div className="form-group">
                <label className="form-label">Water Availability</label>
                <select name="waterAvailability" className="form-input form-select" value={form.waterAvailability} onChange={handleChange}>
                  {WATER_AVAILABILITY.map((w) => <option key={w} value={w}>{w}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Irrigation System</label>
                <select name="irrigationType" className="form-input form-select" value={form.irrigationType} onChange={handleChange}>
                  {IRRIGATION_TYPES.map((i) => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-outline"
                style={{ flex: 1 }}
                onClick={handleCancelEdit}
              >
                Cancel
              </button>
              <button
                id="save-profile-btn"
                type="submit"
                className="btn btn-primary"
                style={{ flex: 2 }}
                disabled={loading}
              >
                {loading ? 'Saving...' : '💾 Save Changes'}
              </button>
            </div>
          </form>
        )}

      </div>
    </AppLayout>
  );
};

export default ProfilePage;
