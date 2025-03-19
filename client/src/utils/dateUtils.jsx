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

  /**
   * Formate une date au format ISO avec heure UTC fixe (23:00)
   */
  static formatDateToISOWithFixedTime(date) {
    const dateObj = this.toDate(date);
    if (!dateObj) return null;
    
    // Créer une nouvelle date en UTC à 23:00
    return new Date(Date.UTC(
      dateObj.getFullYear(),
      dateObj.getMonth(),
      dateObj.getDate(),
      23, 0, 0
    )).toISOString();
  }

  /**
   * Crée une date UTC à partir des composants de date, sans conversion de fuseau horaire
   */
  static createUTCDate(year, month, day) {
    return new Date(Date.UTC(year, month, day));
  }

  /**
   * Extrait les composants de date (année, mois, jour) d'une date ISO
   */
  static extractDateComponents(isoString) {
    if (!isoString) return null;
    const datePart = isoString.split('T')[0];
    const [year, month, day] = datePart.split('-').map(Number);
    return { year, month, day };
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
   * Ajuste une date de fin pour FullCalendar (ajoute un jour si nécessaire)
   * @param {Date|string} endDate - Date de fin à ajuster
   * @returns {Date} - Date de fin ajustée
   */
  static adjustEndDateForFullCalendar(endDate) {
    const end = this.toDate(endDate);
    if (!end) return new Date();

    // Pour FullCalendar, la date de fin est exclusive, donc pour une tâche jusqu'au jour X inclus,
    // il faut que la date de fin soit X+1
    const adjustedDate = new Date(end);
    adjustedDate.setDate(adjustedDate.getDate() + 1);
    return adjustedDate;
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

  /**
   * Convertit une date ISO en objet Date UTC pour FullCalendar
   */
  static isoToUTCDate(isoString) {
    if (!isoString) return null;
    
    // Extraire les composants de date sans considérer l'heure
    const datePart = isoString.split('T')[0];
    const [year, month, day] = datePart.split('-').map(Number);
    
    // Créer une date UTC
    return new Date(Date.UTC(year, month - 1, day));
  }
}