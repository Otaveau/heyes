import { format } from 'date-fns';
import { ERROR_MESSAGES } from '../constants/constants';

export const isWeekend = (date) => {
  const day = date.getDay();
  return day === 0 || day === 6;
};


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
    if (typeof date === 'string') {
      if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return date;
      }
      const [datePart] = date.split('T');
      return datePart;
    }

    const d = new Date(date);
    if (isNaN(d.getTime())) {
      throw new Error(ERROR_MESSAGES.INVALID_DATE);
    }

    const offset = d.getTimezoneOffset();
    const adjustedDate = new Date(d.getTime() - (offset * 60 * 1000));
    return adjustedDate.toISOString().split('T')[0];

  } catch (error) {
    console.error(ERROR_MESSAGES.ERROR_FORMAT_UTC_DATE, error);
    return null;
  }
};
