import { format } from 'date-fns';
import { ERROR_MESSAGES } from '../constants/constants';

export class DateUtils {
  static normalize(date, isEndDate = false) {
    const normalizedDate = new Date(date);
    
    if (isEndDate) {
      normalizedDate.setHours(23, 59, 59, 999);
    } else {
      normalizedDate.setHours(0, 0, 0, 0);
    }
    
    return normalizedDate;
  }

  static validateDateRange(startDate, endDate, holidays) {
    if (!this.isValidDate(startDate) || !this.isValidDate(endDate)) {
      return false;
    }

    // Pour la date de début, vérifier au début de la journée
    const start = this.normalize(startDate, false);
    // Pour la date de fin, vérifier à la fin de la journée précédente
    const endCheck = this.normalize(new Date(endDate.getTime() - 24 * 60 * 60 * 1000), true);

    // Vérifier uniquement les dates de début et de fin (fin = jour précédent)
    if (this.isHolidayOrWeekend(start, holidays) || this.isHolidayOrWeekend(endCheck, holidays)) {
      return false;
    }

    return true;
  }

  static isValidDate(date) {
    return date instanceof Date && !isNaN(date.getTime());
  }

  static isWeekend(date) {
    if (!this.isValidDate(date)) return false;
    const day = date.getDay();
    return day === 0 || day === 6;
  }

  static isHoliday(date, holidays) {
    if (!this.isValidDate(date) || !Array.isArray(holidays)) return false;

    try {
      const formattedDate = format(date, 'yyyy-MM-dd');
      return holidays.includes(formattedDate);
    } catch (error) {
      console.error(ERROR_MESSAGES.ERROR_IS_HOLIDAY, error);
      return false;
    }
  }

  static isHolidayOrWeekend(date, holidays) {
    if (!this.isValidDate(date)) return false;

    try {
      return this.isWeekend(date) || this.isHoliday(date, holidays);
    } catch (error) {
      console.error(ERROR_MESSAGES.ERROR_IS_HOLIDAY_OR_WEEKEND, error);
      return false;
    }
  }

  static formatUTCDate(date) {
    if (!date) return null;

    try {
      if (typeof date === 'string') {
        if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
        const [datePart] = date.split('T');
        return datePart;
      }

      const d = new Date(date);
      if (!this.isValidDate(d)) {
        throw new Error(ERROR_MESSAGES.INVALID_DATE);
      }

      const offset = d.getTimezoneOffset();
      const adjustedDate = new Date(d.getTime() - (offset * 60 * 1000));
      return adjustedDate.toISOString().split('T')[0];
    } catch (error) {
      console.error(ERROR_MESSAGES.ERROR_FORMAT_UTC_DATE, error);
      return null;
    }
  }
}