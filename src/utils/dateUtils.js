import { differenceInDays, format, formatDistanceToNow, isPast, isToday } from 'date-fns';

/**
 * Format date as "12 Apr 2024"
 */
export const formatDate = (date) => {
  if (!date) return '—';
  return format(new Date(date), 'd MMM yyyy');
};

/**
 * Format date as "12 Apr"
 */
export const formatShortDate = (date) => {
  if (!date) return '—';
  return format(new Date(date), 'd MMM');
};

/**
 * Relative time: "3 days ago", "in 5 days"
 */
export const timeAgo = (date) => {
  if (!date) return '—';
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};

/**
 * Days until harvest
 */
export const daysUntilHarvest = (harvestDate) => {
  if (!harvestDate) return null;
  return differenceInDays(new Date(harvestDate), new Date());
};

/**
 * Days since last watering
 */
export const daysSinceWatering = (lastWateredAt) => {
  if (!lastWateredAt) return null;
  return differenceInDays(new Date(), new Date(lastWateredAt));
};

/**
 * Check if harvest is overdue
 */
export const isHarvestOverdue = (harvestDate) => {
  if (!harvestDate) return false;
  return isPast(new Date(harvestDate));
};

/**
 * Check if harvest is today
 */
export const isHarvestToday = (harvestDate) => {
  if (!harvestDate) return false;
  return isToday(new Date(harvestDate));
};

/**
 * Format duration in minutes as "1h 30m" or "45m"
 */
export const formatDuration = (minutes) => {
  if (!minutes) return '—';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0) return `${h}h ${m > 0 ? `${m}m` : ''}`.trim();
  return `${m}m`;
};
