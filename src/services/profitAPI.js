import api from './api';

const STORAGE_KEY = 'agri_saved_profit_estimates';

export const profitAPI = {
  getProfitRecords: async () => {
    try {
      const response = await api.get('/profit');
      if (response.data?.data?.profitRecords) {
        const records = response.data.data.profitRecords;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
        return { data: { data: { profitRecords: records } } };
      }
    } catch (err) {
      console.warn('Backend unavailable, loading profit records from local cache.');
    }

    const raw = localStorage.getItem(STORAGE_KEY);
    const records = raw ? JSON.parse(raw) : [];
    return { data: { data: { profitRecords: records } } };
  },

  saveProfitRecord: async (recordData) => {
    try {
      const response = await api.post('/profit', recordData);
      if (response.data?.data?.profitRecord) {
        const saved = response.data.data.profitRecord;
        const raw = localStorage.getItem(STORAGE_KEY);
        const records = raw ? JSON.parse(raw) : [];
        const updated = [saved, ...records.slice(0, 4)];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return { data: { data: { profitRecord: saved } } };
      }
    } catch (err) {
      console.warn('Backend unavailable, saving profit estimate locally.');
    }

    const localRecord = {
      _id: `calc_${Date.now()}`,
      id: `calc_${Date.now()}`,
      ...recordData,
      savedAt: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
    const raw = localStorage.getItem(STORAGE_KEY);
    const records = raw ? JSON.parse(raw) : [];
    const updated = [localRecord, ...records.slice(0, 4)];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return { data: { data: { profitRecord: localRecord } } };
  },

  deleteProfitRecord: async (id) => {
    try {
      await api.delete(`/profit/${id}`);
    } catch {}

    const raw = localStorage.getItem(STORAGE_KEY);
    const records = raw ? JSON.parse(raw) : [];
    const updated = records.filter((r) => String(r.id) !== String(id) && String(r._id) !== String(id));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return { data: { success: true } };
  },
};
