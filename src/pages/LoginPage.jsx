import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Alert from '../components/common/Alert';
import './AuthPages.css';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ identifier: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Success message passed from registration
  const successMessage = location.state?.successMessage;

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanIdentifier = form.identifier.trim();
    if (!cleanIdentifier || !form.password) {
      setError('Please enter your email/phone and password.');
      return;
    }
    if (/^\d{9}$/.test(cleanIdentifier)) {
      setError('Phone number not acceptable: 9 digits is not acceptable. Please enter your 10-digit mobile number or your @gmail.com address.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await login({
        identifier: cleanIdentifier,
        password: form.password,
      });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      // Prompt requirement: "Invalid email/phone or password." - Do not show technical errors.
      setError(err.message || 'Invalid email/phone or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page" id="login-page">
      {/* Top green banner */}
      <div className="auth-header">
        <div className="auth-logo">🌾</div>
        <h1 className="auth-app-name">AgroSelf</h1>
        <p className="auth-subtitle">Smart Farming for Every Farmer</p>
      </div>

      {/* Card */}
      <div className="auth-card">
        <h2 className="auth-card-title">Welcome Back 👋</h2>
        <p className="auth-card-desc">Login to manage your farm</p>

        {successMessage && !error && (
          <Alert type="success" className="mb-4" id="register-success-alert">
            {successMessage}
          </Alert>
        )}

        {error && (
          <Alert type="danger" className="mb-4" id="login-error-alert">
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit} id="login-form" noValidate>
          {/* Email or Phone */}
          <div className="form-group">
            <label htmlFor="login-email" className="form-label">
              Email Address or Phone Number
            </label>
            <input
              id="login-email"
              name="identifier"
              type="text"
              className="form-input"
              placeholder="e.g. ramesh@gmail.com or 9876543210"
              value={form.identifier}
              onChange={handleChange}
              autoComplete="username"
              required
            />
          </div>

          {/* Password */}
          <div className="form-group">
            <label htmlFor="login-password" className="form-label">
              Password
            </label>
            <div className="password-wrapper">
              <input
                id="login-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="Enter your password"
                value={form.password}
                onChange={handleChange}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-label="Toggle password visibility"
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button
            id="login-submit-btn"
            type="submit"
            className="btn btn-primary btn-full btn-lg"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                Logging in...
              </>
            ) : (
              'Login to AgroSelf'
            )}
          </button>
        </form>

        <div className="divider-text mt-4 mb-4">
          <span>New farmer?</span>
        </div>

        <Link
          to="/register"
          id="go-to-register-btn"
          className="btn btn-outline btn-full"
        >
          Create New Account
        </Link>
      </div>
    </div>
  );
};

export default LoginPage;
