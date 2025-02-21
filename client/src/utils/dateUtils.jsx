import { ERROR_MESSAGES } from '../constants/constants';

export class DateUtils {
  static parseDate(date) {
    if (!date) return null;
    if (date instanceof Date) return date;
    if (typeof date === 'string') {
      // Pour gérer les dates au format ISO
      return new Date(date);
    }
    return null;
  }

  static isWeekend(date) {
    const parsedDate = this.parseDate(date);
    if (!parsedDate) return false;
    const day = parsedDate.getDay();
    return day === 0 || day === 6;
  }

  static isHoliday(date, holidays) {
    try {
      if (!holidays || !Array.isArray(holidays)) {
        return false;
      }

      const parsedDate = this.parseDate(date);
      if (!parsedDate) return false;

      const dateStr = parsedDate.toISOString().split('T')[0];

      return holidays.some(holiday => {
        const holidayDate = this.parseDate(holiday.start);
        return holidayDate && holidayDate.toISOString().split('T')[0] === dateStr;
      });
    } catch (error) {
      console.error(ERROR_MESSAGES.ERROR_IS_HOLIDAY, error);
      return false;
    }
  }

  static isHolidayOrWeekend(date, holidays) {
    return this.isWeekend(date) || this.isHoliday(date, holidays);
  }
}