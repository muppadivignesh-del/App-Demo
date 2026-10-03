import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import Alert from '../components/common/Alert';
import { useCrops } from '../context/CropContext';
import { cropAPI } from '../services/cropAPI';
import {
  SOIL_TYPES, WATER_AVAILABILITY, COMMON_CROPS, AREA_UNITS, YIELD_UNITS,
} from '../constants/farmConstants';
import { GROWTH_STAGES } from '../constants/growthStages';

const AddCropPage = () => {
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const { addCrop, updateCrop } = useCrops();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    cropName: '',
    customCrop: '',
    landArea: '',
    areaUnit: 'acres',
    plantingDate: new Date().toISOString().split('T')[0],
    expectedHarvestDate: '',
    expectedYield: '',
    yieldUnit: 'kg',
    soilType: 'Loamy',
    waterAvailability: 'Rain-fed',
    currentGrowthStage: 'Planting',
    notes: '',
  });

  const [loading, setLoading] = useState(false);
  const [fetchingCrop, setFetchingCrop] = useState(isEditMode);
  const [error, setError] = useState('');

  // If in edit mode, fetch existing crop details
  useEffect(() => {
    if (!isEditMode) return;

    let isMounted = true;
    const loadCropData = async () => {
      try {
        const res = await cropAPI.getCropById(id);
        const c = res.data?.data?.crop;
        if (c && isMounted) {
          const isStandardCrop = COMMON_CROPS.includes(c.cropName);
          setForm({
            cropName: isStandardCrop ? c.cropName : 'Other',
            customCrop: isStandardCrop ? '' : c.cropName,
            landArea: c.landArea || c.areaPlanted || '',
            areaUnit: c.areaUnit || 'acres',
            plantingDate: c.plantingDate ? c.plantingDate.split('T')[0] : '',
            expectedHarvestDate: c.expectedHarvestDate ? c.expectedHarvestDate.split('T')[0] : '',
            expectedYield: c.expectedYield || '',
            yieldUnit: c.yieldUnit || 'kg',
            soilType: c.soilType || 'Loamy',
            waterAvailability: c.waterAvailability || 'Rain-fed',
            currentGrowthStage: c.currentGrowthStage || 'Planting',
            notes: c.notes || '',
          });
        }
      } catch (err) {
        if (isMounted) setError('Unable to find this crop for editing.');
      } finally {
        if (isMounted) setFetchingCrop(false);
      }
    };

    loadCropData();
    return () => {
      isMounted = false;
    };
  }, [id, isEditMode]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalCropName = form.cropName === 'Other' ? form.customCrop : form.cropName;
    if (!finalCropName.trim()) {
      setError('Please select or enter a crop name.');
      return;
    }
    if (!form.landArea || parseFloat(form.landArea) <= 0) {
      setError('Please enter a valid land area.');
      return;
    }
    const sowingDate = form.plantingDate || new Date().toISOString().split('T')[0];

    setLoading(true);
    try {
      const payload = {
        cropName: finalCropName.trim(),
        landArea: parseFloat(form.landArea),
        areaUnit: form.areaUnit,
        plantingDate: sowingDate,
        expectedHarvestDate: form.expectedHarvestDate || null,
        expectedYield: form.expectedYield ? parseFloat(form.expectedYield) : null,
        yieldUnit: form.yieldUnit,
        soilType: form.soilType,
        waterAvailability: form.waterAvailability,
        currentGrowthStage: form.currentGrowthStage || 'Planting',
        notes: form.notes,
      };

      if (isEditMode) {
        await updateCrop(id, payload);
        navigate(`/crops/${id}`, { replace: true });
      } else {
        await addCrop(payload);
        navigate('/crops', { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Failed to save crop information.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout
      title={isEditMode ? 'Edit Crop Details' : 'Register New Crop'}
      subtitle={isEditMode ? 'Update agronomic conditions and schedule' : 'Track your field parcels and seasonal milestones'}
      showBack
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingBottom: '2.5rem' }}>

        {error && <Alert type="danger">{error}</Alert>}

        {fetchingCrop ? (
          <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
            <div className="spinner" style={{ margin: '0 auto 0.75rem' }} />
            <p style={{ color: 'var(--text-muted)' }}>Loading crop details...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} id="add-crop-form" noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* Crop & Land Details */}
            <div className="card">
              <h3 style={{ fontWeight: 700, marginBottom: '1rem', color: 'var(--text-primary)', fontSize: '1.05rem' }}>
                🌱 Crop & Land Information
              </h3>

              <div className="form-group">
                <label htmlFor="crop-name-select" className="form-label">Crop Name *</label>
                <select
                  id="crop-name-select"
                  name="cropName"
                  className="form-input form-select"
                  value={form.cropName}
                  onChange={handleChange}
                >
                  <option value="">Select a crop</option>
                  {COMMON_CROPS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {form.cropName === 'Other' && (
                <div className="form-group">
                  <label htmlFor="custom-crop" className="form-label">Custom Crop Name *</label>
                  <input
                    id="custom-crop"
                    name="customCrop"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Mustard, Marigold"
                    value={form.customCrop}
                    onChange={handleChange}
                  />
                </div>
              )}

              <div className="form-row-2">
                <div className="form-group" style={{ flex: 2 }}>
                  <label htmlFor="land-area" className="form-label">Land Area *</label>
                  <input
                    id="land-area"
                    name="landArea"
                    type="number"
                    className="form-input"
                    placeholder="e.g. 2.5"
                    value={form.landArea}
                    onChange={handleChange}
                    min="0.1"
                    step="0.1"
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label htmlFor="area-unit" className="form-label">Unit</label>
                  <select
                    id="area-unit"
                    name="areaUnit"
                    className="form-input form-select"
                    value={form.areaUnit}
                    onChange={handleChange}
                  >
                    {AREA_UNITS.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>

              {isEditMode && (
                <div className="form-group">
                  <label htmlFor="growth-stage" className="form-label">Current Growth Stage</label>
                  <select
                    id="growth-stage"
                    name="currentGrowthStage"
                    className="form-input form-select"
                    value={form.currentGrowthStage}
                    onChange={handleChange}
                  >
                    {GROWTH_STAGES.map((s) => (
                      <option key={s.id} value={s.id}>{s.icon} {s.label}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Dates & Expected Yield */}
            <div className="card">
              <h3 style={{ fontWeight: 700, marginBottom: '1rem', color: 'var(--text-primary)', fontSize: '1.05rem' }}>
                📅 Schedule & Yield Targets
              </h3>

              <div className="form-group">
                <label htmlFor="planting-date" className="form-label">Planting / Sowing Date *</label>
                <input
                  id="planting-date"
                  name="plantingDate"
                  type="date"
                  className="form-input"
                  value={form.plantingDate}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="harvest-date" className="form-label">Expected Harvest Date</label>
                <input
                  id="harvest-date"
                  name="expectedHarvestDate"
                  type="date"
                  className="form-input"
                  value={form.expectedHarvestDate}
                  onChange={handleChange}
                />
              </div>

              <div className="form-row-2">
                <div className="form-group" style={{ flex: 2 }}>
                  <label htmlFor="expected-yield" className="form-label">Expected Yield</label>
                  <input
                    id="expected-yield"
                    name="expectedYield"
                    type="number"
                    className="form-input"
                    placeholder="e.g. 1800"
                    value={form.expectedYield}
                    onChange={handleChange}
                    min="0"
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label htmlFor="yield-unit" className="form-label">Unit</label>
                  <select
                    id="yield-unit"
                    name="yieldUnit"
                    className="form-input form-select"
                    value={form.yieldUnit}
                    onChange={handleChange}
                  >
                    {YIELD_UNITS.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Soil, Water & Farm Notes */}
            <div className="card">
              <h3 style={{ fontWeight: 700, marginBottom: '1rem', color: 'var(--text-primary)', fontSize: '1.05rem' }}>
                🟤 Agronomic Conditions & Notes
              </h3>

              <div className="form-group">
                <label htmlFor="soil-type" className="form-label">Soil Type</label>
                <select
                  id="soil-type"
                  name="soilType"
                  className="form-input form-select"
                  value={form.soilType}
                  onChange={handleChange}
                >
                  {SOIL_TYPES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="water-avail" className="form-label">Water Availability</label>
                <select
                  id="water-avail"
                  name="waterAvailability"
                  className="form-input form-select"
                  value={form.waterAvailability}
                  onChange={handleChange}
                >
                  {WATER_AVAILABILITY.map((w) => (
                    <option key={w} value={w}>{w}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="crop-notes" className="form-label">Field Notes (Optional)</label>
                <textarea
                  id="crop-notes"
                  name="notes"
                  className="form-input"
                  rows={3}
                  placeholder="e.g. Intercropped with marigold for pest barrier; organic compost applied."
                  value={form.notes}
                  onChange={handleChange}
                  style={{ resize: 'vertical' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-outline"
                style={{ flex: 1 }}
                onClick={() => navigate(-1)}
              >
                Cancel
              </button>
              <button
                id="submit-add-crop"
                type="submit"
                className="btn btn-primary"
                style={{ flex: 2 }}
                disabled={loading}
              >
                {loading
                  ? (isEditMode ? 'Saving Changes...' : 'Adding Crop...')
                  : (isEditMode ? '💾 Save Changes' : '🌱 Add Crop')}
              </button>
            </div>

          </form>
        )}
      </div>
    </AppLayout>
  );
};

export default AddCropPage;
