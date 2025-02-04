import { format } from 'date-fns';
import { ERROR_MESSAGES } from '../constants/constants';


export const isHoliday = (date, holidays) => {
  if (!date || !holidays || !Array.isArray(holidays)) return false;

  try {
    const formattedDate = format(date, 'yyyy-MM-dd');
    return holidays.includes(formattedDate);
  } catch (error) {
    console.error(ERROR_MESSAGES.ERROR_IS_HOLIDAY, error);
    return false;
  }
};

export const isHolidayOrWeekend = (date, holidays) => {
  if (!date) return false;

  try {
    const dayOfWeek = date.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6 || isHoliday(date, holidays);
  } catch (error) {
    console.error(ERROR_MESSAGES.ERROR_IS_HOLIDAY_OR_WEEKEND, error);
    return false;
  }
};

export const formatUTCDate = (date) => {
  if (!date) return null;

  try {
    // Si c'est déjà une chaîne au format YYYY-MM-DD
    if (typeof date === 'string') {
      // Test du format YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return date;
      }

      // Pour les dates avec timezone (format ISO)
      if (date.includes('T')) {
        return date.split('T')[0]; // Retourner la partie date
      }

      // Pour les dates au format YYYY-MM-DD avec ou sans timezone
      const [datePart] = date.split('T');
      return datePart;
    }

    // Si c'est un objet Date
    if (date instanceof Date) {
      if (isNaN(date.getTime())) {
        throw new Error(ERROR_MESSAGES.INVALID_DATE);
      }

      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');

      return `${year}-${month}-${day}`;
    }

    // Pour tout autre type d'entrée
    const d = new Date(date);
    if (isNaN(d.getTime())) {
      throw new Error(ERROR_MESSAGES.INVALID_DATE);
    }

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;

  } catch (error) {
    console.error(ERROR_MESSAGES.ERROR_FORMAT_UTC_DATE, error);
    return null;
  }
};
