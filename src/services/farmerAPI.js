import api from './api';

export const farmerAPI = {
  getProfile: async () => {
    try {
      const response = await api.get('/farmers/profile');
      if (response.data?.data?.farmer) {
        const farmer = response.data.data.farmer;
        localStorage.setItem('agri_current_user', JSON.stringify(farmer));
        localStorage.setItem('agroself_farmer', JSON.stringify(farmer));
        return { data: { data: { farmer } } };
      }
    } catch (err) {
      // Offline fallback: load from localStorage
      console.warn('Network offline or backend unavailable, reading profile from localStorage cache.');
    }

    const raw =
      localStorage.getItem('agri_current_user') ||
      localStorage.getItem('agroself_farmer');
    const farmer = raw ? JSON.parse(raw) : null;
    return { data: { data: { farmer } } };
  },

  updateProfile: async (data) => {
    try {
      const response = await api.put('/farmers/profile', data);
      if (response.data?.data?.farmer) {
        const farmer = response.data.data.farmer;
        localStorage.setItem('agri_current_user', JSON.stringify(farmer));
        localStorage.setItem('agroself_farmer', JSON.stringify(farmer));
        return { data: { data: { farmer } } };
      }
    } catch (err) {
      console.warn('Network offline or backend error, updating profile locally in localStorage.');
    }

    // Local fallback update
    const raw =
      localStorage.getItem('agri_current_user') ||
      localStorage.getItem('agroself_farmer');
    const currentFarmer = raw ? JSON.parse(raw) : {};

    const updated = {
      ...currentFarmer,
      ...data,
      name: data.name !== undefined ? data.name : currentFarmer.name,
      phone: data.phone !== undefined ? data.phone : currentFarmer.phone,
      village: data.location?.village ?? data.village ?? currentFarmer.village,
      district: data.location?.district ?? data.district ?? currentFarmer.district,
      state: data.location?.state ?? data.state ?? currentFarmer.state,
      landArea: data.landDetails?.totalArea ?? data.landArea ?? currentFarmer.landArea,
      soilType: data.landDetails?.soilType ?? data.soilType ?? currentFarmer.soilType ?? 'Loamy',
      waterAvailability: data.landDetails?.waterAvailability ?? data.waterAvailability ?? currentFarmer.waterAvailability ?? 'Rain-fed',
      irrigationType: data.landDetails?.irrigationType ?? data.irrigationType ?? currentFarmer.irrigationType ?? 'None',
      location: {
        village: data.location?.village ?? data.village ?? currentFarmer.location?.village ?? '',
        district: data.location?.district ?? data.district ?? currentFarmer.location?.district ?? '',
        state: data.location?.state ?? data.state ?? currentFarmer.location?.state ?? '',
      },
    };

    localStorage.setItem('agri_current_user', JSON.stringify(updated));
    localStorage.setItem('agroself_farmer', JSON.stringify(updated));

    return { data: { data: { farmer: updated } } };
  },

  deleteAccount: async () => {
    try {
      await api.delete('/farmers/profile');
    } catch {}
    localStorage.removeItem('agri_current_user');
    localStorage.removeItem('agroself_farmer');
    localStorage.removeItem('agroself_token');
    return { data: { success: true } };
  },
};
