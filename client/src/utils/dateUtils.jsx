export class DateUtils {

  static isWeekend(date) {
    return date && [0, 6].includes(date.getDay());
  }

  static isHoliday(date, holidays) {
    if (!date || !holidays) return false;
    let dateString;
    
    if (date instanceof Date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      dateString = `${year}-${month}-${day}`;
    } else if (typeof date === 'string') {
      dateString = date;
    } else {
      return false; // Si le format n'est pas valide, retourne false au lieu de lever une erreur
    }
    
    // Retourne directement un booléen
    return !!holidays[dateString];
  }

  static isHolidayOrWeekend(date, holidays = []) {
    return this.isWeekend(date) || this.isHoliday(date, holidays);
  }

}