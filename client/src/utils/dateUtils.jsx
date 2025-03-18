export class DateUtils {

  /**
   * Convertit une entrée en objet Date
   */
  static toDate(date) {
    if (!date) return null;
    if (date instanceof Date) return date;
    if (typeof date === 'string') {
      const parsedDate = new Date(date);
      return isNaN(parsedDate.getTime()) ? null : parsedDate;
    }
    return null;
  }

  /**
   * Formate une date au format YYYY-MM-DD
   */
  static formatDateToString(date) {
    const dateObj = this.toDate(date);
    if (!dateObj) return null;

    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  static isWeekend(date) {
    const dateObj = this.toDate(date);
    return dateObj ? [0, 6].includes(dateObj.getDay()) : false;
  }

  static isHoliday(date, holidays) {
    if (!date || !holidays) return false;
    const dateString = this.formatDateToString(date);
    return dateString ? !!holidays[dateString] : false;
  }

  static isHolidayOrWeekend(date, holidays = {}) {
    return this.isWeekend(date) || this.isHoliday(date, holidays);
  }

  /**
   * Vérifie si une plage de dates est valide pour un événement
   */
  static isAllowedDateRange(startDate, endDate, holidays) {
    const start = this.toDate(startDate);
    const end = this.toDate(endDate);

    if (!start || !end) return false;

    if (this.isHolidayOrWeekend(start, holidays)) {
      return false;
    }

    const actualEndDate = new Date(end);
    actualEndDate.setDate(actualEndDate.getDate() - 1);

    if (this.isHolidayOrWeekend(actualEndDate, holidays)) {
      return false;
    }

    return true;
  }

  /**
 * Trouve le prochain jour ouvré à partir d'une date donnée
 */
  static getNextWorkingDay(date, holidays) {
    const startDate = this.toDate(date);
    if (!startDate) return new Date();

    const nextDay = new Date(startDate);
    nextDay.setDate(nextDay.getDate() + 1);

    while (this.isHolidayOrWeekend(nextDay, holidays)) {
      nextDay.setDate(nextDay.getDate() + 1);
    }

    return nextDay;
  }

  /**
   * Normalise les heures des dates de début/fin d'une tâche
   */
  static normalizeTaskDates(task) {
    if (!task) return task;
    const taskCopy = { ...task };

    if (taskCopy.start_date) {
      const dateObj = new Date(taskCopy.start_date);
      const isAtMidnight = dateObj.getHours() === 0 && dateObj.getMinutes() === 0;

      if (isAtMidnight) {
        dateObj.setHours(12);
        taskCopy.start_date = dateObj.toISOString();

        if (taskCopy.end_date) {
          const endObj = new Date(taskCopy.end_date);
          endObj.setHours(12);
          taskCopy.end_date = endObj.toISOString();
        }
      }
    }

    return taskCopy;
  }

  /**
   * Ajuste une date de fin pour FullCalendar (ajoute un jour si nécessaire)
   * @param {Date|string} endDate - Date de fin à ajuster
   * @returns {Date} - Date de fin ajustée
   */
  static adjustEndDateForFullCalendar(endDate) {
    const end = this.toDate(endDate);
    if (!end) return new Date();

    // Vérifier si la date a déjà des heures/minutes définies
    const hasTime = end.getHours() !== 0 || end.getMinutes() !== 0;

    // Si la date est à minuit pile, elle est probablement exclusive
    // Sinon, nous devons ajouter un jour pour la rendre exclusive
    if (!hasTime) {
      return end;
    } else {
      const adjustedDate = new Date(end);
      adjustedDate.setDate(adjustedDate.getDate() + 1);
      adjustedDate.setHours(0, 0, 0, 0);
      return adjustedDate;
    }
  }
  /**
   * Calcule le nombre de jours ouvrés entre deux dates
   */
  static getWorkingDaysBetweenDates(startDate, endDate, holidays) {
    const start = this.toDate(startDate);
    const end = this.toDate(endDate);

    if (!start || !end) return 0;

    let count = 0;
    const current = new Date(start);

    while (current < end) {
      if (!this.isHolidayOrWeekend(current, holidays)) {
        count++;
      }
      current.setDate(current.getDate() + 1);
    }

    return count;
  }

  /**
   * Vérifie si l'événement commence et se termine sur des jours ouvrés
   * Ignorant les jours intermédiaires
   */
  static hasValidEventBoundaries(startDate, endDate, holidays) {
    const start = this.toDate(startDate);
    const end = this.toDate(endDate);

    if (!start || !end) return false;

    // La date de fin dans FullCalendar est exclusive, donc on regarde la veille
    const actualEndDate = new Date(end);
    actualEndDate.setDate(actualEndDate.getDate() - 1);

    return !this.isHolidayOrWeekend(start, holidays) &&
      !this.isHolidayOrWeekend(actualEndDate, holidays);
  }

}