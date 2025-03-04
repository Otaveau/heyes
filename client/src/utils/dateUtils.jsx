

export class DateUtils {

  static normalizeDateForCalendar(date) {
    if (!date) return null;

    if (date instanceof Date) {
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }

    // Si c'est déjà une chaîne au format YYYY-MM-DD
    if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date;
    }

    // Conversion en Date puis normalisation
    try {
      const dateObj = new Date(date);
      return `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
    } catch (e) {
      console.error('Erreur de normalisation de date:', e);
      return null;
    }
  }


  static adjustDateFromServer(dateStr) {
    if (!dateStr) return null;

    // Si déjà au format YYYY-MM-DD sans partie heure
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr;
    }

    const utcDateStr = dateStr.endsWith('Z') ? dateStr : `${dateStr}Z`;
    return this.normalizeDateForCalendar(new Date(utcDateStr));
  }

  //Prépare une date pour l'envoi au serveur en s'assurant qu'elle est au format YYYY-MM-DD
  static prepareDateForServer(date) {
    if (!date) return null;

    // Si déjà au format YYYY-MM-DD
    if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date;
    }

    return this.normalizeDateForCalendar(date instanceof Date ? date : new Date(date));
  }

  static isWeekend(date) {
    return date && [0, 6].includes(date.getDay());
  }

  static isHoliday(date, holidays = []) {
    if (!date || !holidays?.length) return false;

    const normalizedDate = this.normalizeDateForCalendar(date);

    return holidays.some(holiday => {
      const holidayDate = holiday.date || holiday.start;
      return normalizedDate === this.normalizeDateForCalendar(holidayDate);
    });
  }


  static isHolidayOrWeekend(date, holidays = []) {
    return this.isWeekend(date) || this.isHoliday(date, holidays);
  }

  static parseDate(date) {
    if (!date) return null;
    if (date instanceof Date) return date;
    if (typeof date === 'string') return new Date(date);
    return null;
  }
}