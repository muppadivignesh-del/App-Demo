import api from './api';

const STORAGE_KEY = 'agri_crops';

export const cropAPI = {
  getCrops: async () => {
    try {
      const response = await api.get('/crops');
      if (response.data?.data?.crops) {
        const crops = response.data.data.crops;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(crops));
        localStorage.setItem('agroself_crops', JSON.stringify(crops));
        return { data: { data: { crops } } };
      }
    } catch (err) {
      console.warn('Network offline or backend unavailable, reading crops from localStorage.');
    }

    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('agroself_crops');
    const crops = raw ? JSON.parse(raw) : [];
    return { data: { data: { crops } } };
  },

  getCropById: async (id) => {
    try {
      const response = await api.get(`/crops/${id}`);
      if (response.data?.data) {
        return response;
      }
    } catch (err) {
      console.warn('Backend unavailable, resolving crop from local cache.');
    }

    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('agroself_crops');
    const crops = raw ? JSON.parse(raw) : [];
    const crop = crops.find((c) => String(c.id) === String(id) || String(c._id) === String(id));
    if (!crop) throw new Error('Crop not found');

    const waterRaw = localStorage.getItem('agri_watering_logs');
    const allWater = waterRaw ? JSON.parse(waterRaw) : [];
    const wateringLogs = allWater.filter((w) => String(w.cropId) === String(id));

    return { data: { data: { crop, wateringLogs } } };
  },

  addCrop: async (cropData) => {
    try {
      const response = await api.post('/crops', cropData);
      if (response.data?.data?.crop) {
        const newCrop = response.data.data.crop;
        const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('agroself_crops');
        const list = raw ? JSON.parse(raw) : [];
        const updated = [newCrop, ...list];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        localStorage.setItem('agroself_crops', JSON.stringify(updated));
        return { data: { data: { crop: newCrop } } };
      }
    } catch (err) {
      console.warn('Backend unavailable, saving crop locally to localStorage with offline marker.');
    }

    // Local fallback
    const offlineCrop = {
      _id: `crop_${Date.now()}`,
      id: `crop_${Date.now()}`,
      ...cropData,
      isOfflinePending: true,
      createdAt: new Date().toISOString(),
    };
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('agroself_crops');
    const list = raw ? JSON.parse(raw) : [];
    const updated = [offlineCrop, ...list];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    localStorage.setItem('agroself_crops', JSON.stringify(updated));
    return { data: { data: { crop: offlineCrop } } };
  },

  updateCrop: async (id, updateData) => {
    try {
      const response = await api.put(`/crops/${id}`, updateData);
      if (response.data?.data?.crop) {
        const updated = response.data.data.crop;
        const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('agroself_crops');
        const list = raw ? JSON.parse(raw) : [];
        const nextList = list.map((c) => (String(c.id) === String(id) || String(c._id) === String(id) ? updated : c));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextList));
        localStorage.setItem('agroself_crops', JSON.stringify(nextList));
        return { data: { data: { crop: updated } } };
      }
    } catch (err) {
      console.warn('Backend unavailable, updating crop locally.');
    }

    // Local fallback
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('agroself_crops');
    const list = raw ? JSON.parse(raw) : [];
    let updatedCrop = null;
    const nextList = list.map((c) => {
      if (String(c.id) === String(id) || String(c._id) === String(id)) {
        updatedCrop = { ...c, ...updateData };
        return updatedCrop;
      }
      return c;
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextList));
    localStorage.setItem('agroself_crops', JSON.stringify(nextList));
    return { data: { data: { crop: updatedCrop } } };
  },

  deleteCrop: async (id) => {
    try {
      await api.delete(`/crops/${id}`);
    } catch (err) {
      console.warn('Backend unavailable, deleting crop locally.');
    }

    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('agroself_crops');
    const list = raw ? JSON.parse(raw) : [];
    const filtered = list.filter((c) => String(c.id) !== String(id) && String(c._id) !== String(id));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    localStorage.setItem('agroself_crops', JSON.stringify(filtered));
    return { data: { success: true } };
  },

  logWatering: async (id, data) => {
    try {
      const response = await api.post(`/crops/${id}/water`, data);
      if (response.data?.data?.wateringLog || response.data?.data?.activity) {
        return response;
      }
    } catch (err) {
      console.warn('Backend unavailable, logging watering locally.');
    }

    const newLog = {
      _id: `water_${Date.now()}`,
      cropId: id,
      wateredAt: data.wateredAt || new Date().toISOString(),
      method: data.method || 'Manual',
      notes: data.notes || '',
    };
    const waterRaw = localStorage.getItem('agri_watering_logs');
    const allWater = waterRaw ? JSON.parse(waterRaw) : [];
    allWater.unshift(newLog);
    localStorage.setItem('agri_watering_logs', JSON.stringify(allWater));

    return { data: { data: { wateringLog: newLog } } };
  },

  getWateringHistory: async (id) => {
    try {
      const response = await api.get(`/crops/${id}/watering`);
      if (response.data?.data?.logs) {
        return { data: { data: { wateringLogs: response.data.data.logs } } };
      }
    } catch (err) {}

    const waterRaw = localStorage.getItem('agri_watering_logs');
    const allWater = waterRaw ? JSON.parse(waterRaw) : [];
    const logs = allWater.filter((w) => String(w.cropId) === String(id));
    return { data: { data: { wateringLogs: logs } } };
  },

  updateGrowthStage: async (id, stage, notes = '') => {
    try {
      const response = await api.post(`/crops/${id}/stage`, { stage, notes });
      if (response.data?.data?.crop) {
        return response;
      }
    } catch (err) {
      console.warn('Backend unavailable, updating growth stage locally.');
    }

    return cropAPI.updateCrop(id, { currentGrowthStage: stage });
  },
};
