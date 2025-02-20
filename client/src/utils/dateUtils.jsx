import { ERROR_MESSAGES } from '../constants/constants';

export class DateUtils {
 
  static isWeekend(date) {
    const day = date.getDay();
    return day === 0 || day === 6;
  }

  static isHoliday(date, holidays) {
    try {
      return holidays.includes(date);
    } catch (error) {
      console.error(ERROR_MESSAGES.ERROR_IS_HOLIDAY, error);
      return false;
    }
  }

  static isHolidayOrWeekend(date, holidays) {
      return this.isWeekend(date) || this.isHoliday(date, holidays);
  }
}