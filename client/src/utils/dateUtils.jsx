export class DateUtils {

  static isWeekend(date) {
    if (typeof date === 'string') {
      date = new Date(date);
    }
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

  static normalizeTaskDates = (task) => {
      const dateObj = new Date(task.start_date);
      const isAtMidnight = dateObj.getHours() === 0 && dateObj.getMinutes() === 0;
      if (isAtMidnight) {
          dateObj.setHours(12);
          task.start_date = dateObj.toISOString();
  
          if (task.end_date) {
              const endObj = new Date(task.end_date);
              endObj.setHours(12);
              task.end_date = endObj.toISOString();
          }
      }
      return task;
  }

}