import { createContext, useContext, useEffect, useState } from 'react';
import { authAPI } from '../services/authAPI';

const AuthContext = createContext(null);

const STORAGE_KEYS = {
  TOKEN: 'agroself_token',
  CURRENT_USER: 'agri_current_user',
  LEGACY_FARMER: 'agroself_farmer',
  FARMERS: 'agri_farmers',
  LEGACY_FARMERS: 'agroself_farmers',
};

export const getSavedFarmers = () => {
  try {
    const raw =
      localStorage.getItem(STORAGE_KEYS.FARMERS) ||
      localStorage.getItem(STORAGE_KEYS.LEGACY_FARMERS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveFarmersList = (farmers) => {
  try {
    localStorage.setItem(STORAGE_KEYS.FARMERS, JSON.stringify(farmers));
    localStorage.setItem(STORAGE_KEYS.LEGACY_FARMERS, JSON.stringify(farmers));
  } catch {}
};

export const AuthProvider = ({ children }) => {
  const [farmer, setFarmer] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session from localStorage on startup
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem(STORAGE_KEYS.TOKEN);
      const storedFarmerRaw =
        localStorage.getItem(STORAGE_KEYS.CURRENT_USER) ||
        localStorage.getItem(STORAGE_KEYS.LEGACY_FARMER);

      if (storedToken && storedFarmerRaw) {
        const parsedFarmer = JSON.parse(storedFarmerRaw);
        setToken(storedToken);
        setFarmer(parsedFarmer);
      }
    } catch {
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      localStorage.removeItem(STORAGE_KEYS.LEGACY_FARMER);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Register a new farmer account
   * Sends to backend MySQL via REST API, fallback to localStorage if offline
   */
  const register = async (data) => {
    const normalizedEmail = (data.email || '').trim().toLowerCase();
    const cleanPhone = (data.phone || '').trim();

    // Client-side validations
    if (cleanPhone.length === 9) {
      throw new Error('Phone number not acceptable: 9 digits is not acceptable. Please enter a valid 10-digit mobile number.');
    }
    if (normalizedEmail && !normalizedEmail.endsWith('@gmail.com')) {
      throw new Error('@gmail.com is mandatory. Please enter a valid Gmail address.');
    }

    try {
      // Call backend REST API -> saves to MySQL
      const response = await authAPI.register({
        name: data.name,
        phone: cleanPhone,
        email: normalizedEmail,
        password: data.password,
        village: data.village || data.location?.village,
        district: data.district || data.location?.district,
        state: data.state || data.location?.state,
        landArea: parseFloat(data.totalArea ?? data.landArea) || 0,
        soilType: data.soilType || 'Loamy',
        waterAvailability: data.waterAvailability || 'Rain-fed',
        irrigationType: data.irrigationType || 'None',
        location: data.location,
        landDetails: data.landDetails,
      });

      if (response.data?.data) {
        const { token: apiToken, farmer: apiFarmer } = response.data.data;
        const farmerWithId = {
          id: apiFarmer.id || apiFarmer._id,
          _id: apiFarmer.id || apiFarmer._id,
          ...apiFarmer,
        };

        localStorage.setItem(STORAGE_KEYS.TOKEN, apiToken);
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(farmerWithId));
        localStorage.setItem(STORAGE_KEYS.LEGACY_FARMER, JSON.stringify(farmerWithId));

        // Keep local farmers list up to date
        const farmers = getSavedFarmers();
        farmers.push(farmerWithId);
        saveFarmersList(farmers);

        setToken(apiToken);
        setFarmer(farmerWithId);
        return farmerWithId;
      }
    } catch (err) {
      // If backend returned a specific error message (e.g. 409 conflict), throw it
      if (err.response?.data?.message) {
        throw new Error(err.response.data.message);
      }
      console.warn('Backend unavailable, proceeding with local offline registration.');
    }

    // Offline registration fallback
    const farmers = getSavedFarmers();
    const newId = `farmer_${Date.now()}`;
    const parsedArea = parseFloat(data.totalArea ?? data.landArea) || 0;

    const offlineFarmer = {
      id: newId,
      _id: newId,
      name: (data.name || '').trim(),
      phone: cleanPhone,
      email: normalizedEmail,
      village: data.village || data.location?.village || '',
      district: data.district || data.location?.district || '',
      state: data.state || data.location?.state || '',
      landArea: parsedArea,
      soilType: data.soilType || 'Loamy',
      waterAvailability: data.waterAvailability || 'Rain-fed',
      irrigationType: data.irrigationType || 'None',
      createdAt: new Date().toISOString(),
    };

    farmers.push(offlineFarmer);
    saveFarmersList(farmers);

    const sessionToken = `token_${newId}`;
    localStorage.setItem(STORAGE_KEYS.TOKEN, sessionToken);
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(offlineFarmer));
    localStorage.setItem(STORAGE_KEYS.LEGACY_FARMER, JSON.stringify(offlineFarmer));

    setToken(sessionToken);
    setFarmer(offlineFarmer);
    return offlineFarmer;
  };

  /**
   * Login with email or phone + password
   * Authenticates against MySQL backend, fallback to local storage if offline
   */
  const login = async (credentials) => {
    const rawIdentifier = (credentials.identifier || credentials.email || '').trim();
    const password = credentials.password;

    if (!rawIdentifier || !password) {
      throw new Error('Please enter your email/phone and password.');
    }

    try {
      const response = await authAPI.login({
        identifier: rawIdentifier,
        email: rawIdentifier,
        password,
      });

      if (response.data?.data) {
        const { token: apiToken, farmer: apiFarmer } = response.data.data;
        const farmerWithId = {
          id: apiFarmer.id || apiFarmer._id,
          _id: apiFarmer.id || apiFarmer._id,
          ...apiFarmer,
        };

        localStorage.setItem(STORAGE_KEYS.TOKEN, apiToken);
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(farmerWithId));
        localStorage.setItem(STORAGE_KEYS.LEGACY_FARMER, JSON.stringify(farmerWithId));

        setToken(apiToken);
        setFarmer(farmerWithId);
        return farmerWithId;
      }
    } catch (err) {
      if (err.response?.data?.message) {
        throw new Error(err.response.data.message);
      }
      console.warn('Backend unavailable, attempting offline login from local storage.');
    }

    // Offline login fallback
    const farmers = getSavedFarmers();
    const cleanId = rawIdentifier.toLowerCase();
    const matched = farmers.find(
      (f) =>
        (f.email && f.email.toLowerCase() === cleanId) ||
        (f.phone && f.phone.trim() === rawIdentifier)
    );

    if (!matched) {
      throw new Error('Invalid email/phone or password.');
    }

    const sessionToken = `token_${matched.id}`;
    localStorage.setItem(STORAGE_KEYS.TOKEN, sessionToken);
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(matched));
    localStorage.setItem(STORAGE_KEYS.LEGACY_FARMER, JSON.stringify(matched));

    setToken(sessionToken);
    setFarmer(matched);
    return matched;
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    localStorage.removeItem(STORAGE_KEYS.LEGACY_FARMER);
    setToken(null);
    setFarmer(null);
  };

  const updateFarmerLocally = (updatedData) => {
    if (!farmer) return;
    const updatedFarmer = { ...farmer, ...updatedData };
    setFarmer(updatedFarmer);
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(updatedFarmer));
    localStorage.setItem(STORAGE_KEYS.LEGACY_FARMER, JSON.stringify(updatedFarmer));
  };

  return (
    <AuthContext.Provider
      value={{
        farmer,
        token,
        loading,
        isAuthenticated: !!token,
        login,
        register,
        logout,
        updateFarmerLocally,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export default AuthContext;
