import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Alert from '../components/common/Alert';
import {
  SOIL_TYPES, WATER_AVAILABILITY, IRRIGATION_TYPES,
  AREA_UNITS, INDIAN_STATES, COMMON_CROPS,
} from '../constants/farmConstants';
import './AuthPages.css';

const STEPS = [
  { id: 1, title: 'Personal Details', icon: '👤' },
  { id: 2, title: 'Farm Location', icon: '📍' },
  { id: 3, title: 'Land & Soil', icon: '🌱' },
];

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    // Step 1: Personal
    name: '',
    phone: '',
    email: '',
    password: '',
    // Step 2: Location
    village: '',
    district: '',
    state: '',
    // Step 3: Land
    totalArea: '',
    areaUnit: 'acres',
    soilType: 'Loamy',
    waterAvailability: 'Rain-fed',
    irrigationType: 'None',
    currentCrops: [],
  });

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const toggleCrop = (cropName) => {
    setForm((prev) => {
      const exists = prev.currentCrops.includes(cropName);
      return {
        ...prev,
        currentCrops: exists
          ? prev.currentCrops.filter((c) => c !== cropName)
          : [...prev.currentCrops, cropName],
      };
    });
  };

  const validateStep = () => {
    if (step === 1) {
      if (!form.name.trim()) return 'Please enter your name.';

      const cleanPhone = form.phone.trim();
      if (!cleanPhone) {
        return 'Please enter your phone number.';
      }
      if (cleanPhone.length === 9) {
        return 'Phone number not acceptable: 9 digits is not acceptable. Please enter a valid 10-digit mobile number.';
      }
      if (cleanPhone.length < 10) {
        return `Phone number not acceptable: only ${cleanPhone.length} digits entered. A valid 10-digit mobile number is required.`;
      }
      if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
        return 'Phone number not acceptable. Mobile number must be a 10-digit number starting with 6, 7, 8, or 9.';
      }

      const cleanEmail = form.email.trim();
      if (!cleanEmail) {
        return 'Please enter your email address (@gmail.com is mandatory).';
      }
      if (!cleanEmail.toLowerCase().endsWith('@gmail.com')) {
        return '@gmail.com is mandatory. Please enter a valid email ending with @gmail.com (e.g. yourname@gmail.com).';
      }
      if (!/^[a-zA-Z0-9._%+-]+@gmail\.com$/i.test(cleanEmail)) {
        return 'Invalid email address. @gmail.com is mandatory (e.g. yourname@gmail.com).';
      }

      if (form.password.length < 6) return 'Password must be at least 6 characters.';
    }
    if (step === 2) {
      if (!form.district.trim()) return 'Please enter your district.';
      if (!form.state) return 'Please select your state.';
    }
    return null;
  };

  const nextStep = () => {
    const err = validateStep();
    if (err) { setError(err); return; }
    setError('');
    setStep((s) => s + 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validateStep();
    if (err) { setError(err); return; }

    setLoading(true);
    try {
      await register({
        name: form.name,
        phone: form.phone,
        email: form.email,
        password: form.password,
        village: form.village,
        district: form.district,
        state: form.state,
        location: {
          village: form.village,
          district: form.district,
          state: form.state,
        },
        landArea: parseFloat(form.totalArea) || 0,
        landDetails: {
          totalArea: parseFloat(form.totalArea) || 0,
          areaUnit: form.areaUnit,
          soilType: form.soilType,
          waterAvailability: form.waterAvailability,
          irrigationType: form.irrigationType,
        },
        soilType: form.soilType,
        waterAvailability: form.waterAvailability,
        irrigationType: form.irrigationType,
        currentCrops: form.currentCrops,
      });

      // Requirement 5: Show clear success message and redirect to login page
      navigate('/login', {
        state: { successMessage: 'Registration successful!' },
        replace: true,
      });
    } catch (err) {
      setError(err.message || err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page" id="register-page">
      {/* Top banner */}
      <div className="auth-header auth-header-compact">
        <div className="auth-logo">🌾</div>
        <h1 className="auth-app-name">Join AgroSelf</h1>
        <p className="auth-subtitle">Create your free farmer account</p>
      </div>

      {/* Step indicator */}
      <div className="step-indicator">
        {STEPS.map((s) => (
          <div
            key={s.id}
            className={`step-item ${step === s.id ? 'active' : ''} ${step > s.id ? 'done' : ''}`}
          >
            <div className="step-dot">{step > s.id ? '✓' : s.icon}</div>
            <span className="step-label">{s.title}</span>
          </div>
        ))}
      </div>

      {/* Card */}
      <div className="auth-card">
        {error && (
          <Alert type="danger" className="mb-4">
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit} id="register-form" noValidate>

          {/* ── STEP 1: Personal ── */}
          {step === 1 && (
            <div className="fade-in">
              <h2 className="auth-card-title">Personal Details</h2>
              <p className="auth-card-desc mb-4">Tell us about yourself</p>

              <div className="form-group">
                <label htmlFor="reg-name" className="form-label">Full Name *</label>
                <input id="reg-name" name="name" type="text" className="form-input"
                  placeholder="e.g. Ramesh Kumar" value={form.name} onChange={handleChange} />
              </div>

              <div className="form-group">
                <label htmlFor="reg-phone" className="form-label">Phone Number (10 digits) *</label>
                <input id="reg-phone" name="phone" type="tel" className="form-input"
                  placeholder="e.g. 9876543210" value={form.phone} onChange={handleChange}
                  maxLength={10} />
                {form.phone.length === 9 && (
                  <p style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '0.25rem', fontWeight: 600 }}>
                    ❌ 9 digits is not acceptable. A valid 10-digit mobile number is required.
                  </p>
                )}
                {form.phone.length > 0 && form.phone.length < 9 && (
                  <p style={{ fontSize: '0.75rem', color: '#ea580c', marginTop: '0.25rem' }}>
                    ⚠️ {10 - form.phone.length} more digits needed (10 digits required).
                  </p>
                )}
                {form.phone.length === 10 && /^[6-9]\d{9}$/.test(form.phone) && (
                  <p style={{ fontSize: '0.75rem', color: '#16a34a', marginTop: '0.25rem', fontWeight: 600 }}>
                    ✓ 10-digit mobile number acceptable.
                  </p>
                )}
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label htmlFor="reg-email" className="form-label">Email Address *</label>
                  <span style={{ fontSize: '0.72rem', color: '#166534', fontWeight: 700, background: '#dcfce7', padding: '0.1rem 0.4rem', borderRadius: '6px' }}>
                    @gmail.com mandatory
                  </span>
                </div>
                <input id="reg-email" name="email" type="email" className="form-input"
                  placeholder="e.g. ramesh@gmail.com" value={form.email} onChange={handleChange} />

                {form.email.trim() && !form.email.toLowerCase().endsWith('@gmail.com') && (
                  <div style={{ marginTop: '0.35rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.3rem' }}>
                    <p style={{ fontSize: '0.75rem', color: '#dc2626', margin: 0, fontWeight: 600 }}>
                      ⚠️ @gmail.com is mandatory. Please enter a valid @gmail.com address.
                    </p>
                    {!form.email.includes('@') && (
                      <button
                        type="button"
                        onClick={() => setForm((p) => ({ ...p, email: `${p.email.trim()}@gmail.com` }))}
                        style={{
                          fontSize: '0.72rem',
                          background: '#e0f2fe',
                          color: '#0284c7',
                          border: '1px solid #bae6fd',
                          borderRadius: '12px',
                          padding: '0.15rem 0.5rem',
                          cursor: 'pointer',
                          fontWeight: 700,
                        }}
                      >
                        + Add @gmail.com
                      </button>
                    )}
                  </div>
                )}
                {form.email.trim() && form.email.toLowerCase().endsWith('@gmail.com') && /^[a-zA-Z0-9._%+-]+@gmail\.com$/i.test(form.email.trim()) && (
                  <p style={{ fontSize: '0.75rem', color: '#16a34a', marginTop: '0.25rem', fontWeight: 600 }}>
                    ✓ Valid Gmail address acceptable.
                  </p>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="reg-password" className="form-label">Password *</label>
                <div className="password-wrapper">
                  <input id="reg-password" name="password"
                    type={showPassword ? 'text' : 'password'} className="form-input"
                    placeholder="Min. 6 characters" value={form.password} onChange={handleChange} />
                  <button type="button" className="password-toggle"
                    onClick={() => setShowPassword((v) => !v)}>
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <button type="button" id="reg-next-1" className="btn btn-primary btn-full btn-lg"
                onClick={nextStep}>
                Continue →
              </button>
            </div>
          )}

          {/* ── STEP 2: Location ── */}
          {step === 2 && (
            <div className="fade-in">
              <h2 className="auth-card-title">Farm Location</h2>
              <p className="auth-card-desc mb-4">Where is your farm located?</p>

              <div className="form-group">
                <label htmlFor="reg-village" className="form-label">Village / Town</label>
                <input id="reg-village" name="village" type="text" className="form-input"
                  placeholder="e.g. Kothapalli" value={form.village} onChange={handleChange} />
              </div>

              <div className="form-group">
                <label htmlFor="reg-district" className="form-label">District *</label>
                <input id="reg-district" name="district" type="text" className="form-input"
                  placeholder="e.g. Guntur" value={form.district} onChange={handleChange} />
              </div>

              <div className="form-group">
                <label htmlFor="reg-state" className="form-label">State *</label>
                <select id="reg-state" name="state" className="form-input form-select"
                  value={form.state} onChange={handleChange}>
                  <option value="">Select your state</option>
                  {INDIAN_STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="form-row-2">
                <button type="button" className="btn btn-outline" onClick={() => setStep(1)}>
                  ← Back
                </button>
                <button type="button" id="reg-next-2" className="btn btn-primary"
                  onClick={nextStep}>
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3: Land ── */}
          {step === 3 && (
            <div className="fade-in">
              <h2 className="auth-card-title">Land Details</h2>
              <p className="auth-card-desc mb-4">Tell us about your farmland</p>

              <div className="form-row-2">
                <div className="form-group" style={{ flex: 2 }}>
                  <label htmlFor="reg-area" className="form-label">Land Area</label>
                  <input id="reg-area" name="totalArea" type="number" className="form-input"
                    placeholder="e.g. 3" value={form.totalArea} onChange={handleChange}
                    min="0" step="0.5" />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label htmlFor="reg-areaunit" className="form-label">Unit</label>
                  <select id="reg-areaunit" name="areaUnit" className="form-input form-select"
                    value={form.areaUnit} onChange={handleChange}>
                    {AREA_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="reg-soil" className="form-label">Soil Type</label>
                <select id="reg-soil" name="soilType" className="form-input form-select"
                  value={form.soilType} onChange={handleChange}>
                  {SOIL_TYPES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="reg-water" className="form-label">Water Availability</label>
                <select id="reg-water" name="waterAvailability" className="form-input form-select"
                  value={form.waterAvailability} onChange={handleChange}>
                  {WATER_AVAILABILITY.map((w) => <option key={w} value={w}>{w}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="reg-irrigation" className="form-label">Irrigation Type</label>
                <select id="reg-irrigation" name="irrigationType" className="form-input form-select"
                  value={form.irrigationType} onChange={handleChange}>
                  {IRRIGATION_TYPES.map((i) => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>

              {/* Current Crops */}
              <div className="form-group">
                <label className="form-label">Current Crops (Select all that apply)</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.25rem' }}>
                  {COMMON_CROPS.filter(c => c !== 'Other').slice(0, 10).map((crop) => {
                    const selected = form.currentCrops.includes(crop);
                    return (
                      <button
                        key={crop}
                        type="button"
                        onClick={() => toggleCrop(crop)}
                        className={`badge ${selected ? 'badge-green' : 'badge-gray'}`}
                        style={{
                          cursor: 'pointer',
                          padding: '0.35rem 0.75rem',
                          fontSize: '0.85rem',
                          border: selected ? '1.5px solid var(--color-primary)' : '1px solid var(--border-color)',
                          background: selected ? 'var(--color-primary)' : 'var(--bg-card)',
                          color: selected ? '#fff' : 'var(--text-main)',
                          borderRadius: '20px',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {selected ? `✓ ${crop}` : `+ ${crop}`}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="form-row-2">
                <button type="button" className="btn btn-outline" onClick={() => setStep(2)}>
                  ← Back
                </button>
                <button id="reg-submit-btn" type="submit" className="btn btn-primary"
                  disabled={loading}>
                  {loading ? (
                    <>
                      <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                      Creating...
                    </>
                  ) : (
                    'Create Account ✓'
                  )}
                </button>
              </div>
            </div>
          )}
        </form>

        {step === 1 && (
          <p className="auth-switch-text mt-4">
            Already have an account?{' '}
            <Link to="/login" id="go-to-login-link">Login here</Link>
          </p>
        )}
      </div>
    </div>
  );
};

export default RegisterPage;
