import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { cropAPI } from '../services/cropAPI';

const CropContext = createContext(null);

export const CropProvider = ({ children }) => {
  const { isAuthenticated, farmer } = useAuth();
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load crops specifically for the current logged-in farmer
  const fetchCrops = useCallback(async () => {
    if (!isAuthenticated || !farmer?.id) {
      setCrops([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await cropAPI.getCrops();
      const list = res.data?.data?.crops || [];
      // Ensure only this farmer'\''s crops are in state
      const farmerCrops = list.filter(
        (c) => String(c.farmerId) === String(farmer.id) || String(c.farmer_id) === String(farmer.id)
      );
      setCrops(farmerCrops);
    } catch (err) {
      setError('Failed to load crops');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, farmer?.id]);

  useEffect(() => {
    fetchCrops();
  }, [fetchCrops]);

  // Add crop associated with current farmer
  const addCrop = async (data) => {
    if (!farmer?.id) throw new Error('You must be logged in to add a crop.');

    const payload = {
      farmerId: farmer.id,
      cropName: data.cropName || data.name,
      variety: data.variety || '',
      landArea: parseFloat(data.landArea || data.areaPlanted) || 1,
      areaPlanted: parseFloat(data.areaPlanted || data.landArea) || 1,
      areaUnit: data.areaUnit || farmer?.landDetails?.areaUnit || 'acres',
      plantingDate: data.plantingDate || data.sowingDate || new Date().toISOString().split('T')[0],
      sowingDate: data.sowingDate || data.plantingDate || new Date().toISOString().split('T')[0],
      expectedHarvestDate: data.expectedHarvestDate || '',
      expectedYield: data.expectedYield ? parseFloat(data.expectedYield) : null,
      yieldUnit: data.yieldUnit || 'kg',
      currentGrowthStage: data.currentGrowthStage || 'Planting',
      soilType: data.soilType || farmer?.soilType || 'Loamy',
      waterAvailability: data.waterAvailability || farmer?.waterAvailability || 'Rain-fed',
      status: data.status || 'Active',
      wateringFrequencyDays: parseInt(data.wateringFrequencyDays, 10) || 3,
      notes: data.notes || '',
    };

    const res = await cropAPI.addCrop(payload);
    const createdCrop = res.data?.data?.crop;
    if (createdCrop) {
      setCrops((prev) => [createdCrop, ...prev]);
      return createdCrop;
    }
    return payload;
  };

  const updateCrop = async (id, data) => {
    const res = await cropAPI.updateCrop(id, data);
    const updated = res.data?.data?.crop;
    if (updated) {
      setCrops((prev) => prev.map((c) => (String(c.id) === String(id) || String(c._id) === String(id) ? updated : c)));
      return updated;
    }
    return data;
  };

  const deleteCrop = async (id) => {
    await cropAPI.deleteCrop(id);
    setCrops((prev) => prev.filter((c) => String(c.id) !== String(id) && String(c._id) !== String(id)));
  };

  const updateGrowthStage = async (id, stage, notes = '') => {
    const res = await cropAPI.updateGrowthStage(id, stage, notes);
    const updated = res.data?.data?.crop;
    if (updated) {
      setCrops((prev) => prev.map((c) => (String(c.id) === String(id) || String(c._id) === String(id) ? updated : c)));
      return updated;
    }
    return null;
  };

  const activeCrops = crops.filter((c) => c.status === 'Active');
  const harvestedCrops = crops.filter((c) => c.status === 'Harvested');

  return (
    <CropContext.Provider
      value={{
        crops,
        activeCrops,
        harvestedCrops,
        loading,
        error,
        fetchCrops,
        addCrop,
        updateCrop,
        deleteCrop,
        updateGrowthStage,
      }}
    >
      {children}
    </CropContext.Provider>
  );
};

export const useCrops = () => {
  const ctx = useContext(CropContext);
  if (!ctx) throw new Error('useCrops must be used within CropProvider');
  return ctx;
};

export default CropContext;
