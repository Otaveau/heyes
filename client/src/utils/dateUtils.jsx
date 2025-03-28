/**
 * Classe utilitaire pour la standardisation et la gestion des dates
 * 
 * Conventions importantes:
 * - Base de données/API : utilise des dates INCLUSIVES (la date de fin est le dernier jour inclus dans l'événement)
 * - FullCalendar : utilise des dates EXCLUSIVES (la date de fin n'est pas incluse dans l'événement)
 */
export class DateUtils {


  static getInclusiveEndDate (task) {
    // Si la propriété inclusiveEndDate est disponible dans extendedProps, l'utiliser
    if (task.extendedProps?.inclusiveEndDate) {
      return task.extendedProps.inclusiveEndDate;
    }
    // Si end_date est disponible, l'utiliser (supposée être déjà inclusive)
    if (task.end_date) {
      return task.end_date;
    } 
    // Si end est disponible, la convertir de date exclusive à inclusive
    if (task.end) {
      const endDate = new Date(task.end);
      endDate.setDate(endDate.getDate() - 1);
      return endDate;
    }
    return null;
  };


  // Convertit une entrée en objet Date
  static toDate(date) {
    if (!date) return null;
    if (date instanceof Date) return date;
    if (typeof date === 'string') {
      const parsedDate = new Date(date);
      return isNaN(parsedDate.getTime()) ? null : parsedDate;
    }
    return null;
  }

  //Formate une date au format YYYY-MM-DD
  static formatDateToString(date) {
    const dateObj = this.toDate(date);
    if (!dateObj) return null;

    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  //Formate une date au format ISO avec heure UTC fixe (23:00)
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

  //Crée une date UTC à partir des composants de date, sans conversion de fuseau horaire
  static createUTCDate(year, month, day) {
    return new Date(Date.UTC(year, month, day));
  }

  //Extrait les composants de date (année, mois, jour) d'une date ISO
  static extractDateComponents(isoString) {
    if (!isoString) return null;
    const datePart = isoString.split('T')[0];
    const [year, month, day] = datePart.split('-').map(Number);
    return { year, month: month - 1, day }; // month-1 pour correspondre à l'API JavaScript (0-11)
  }

  //Vérifie si une date tombe un week-end
  static isWeekend(date) {
    const dateObj = this.toDate(date);
    return dateObj ? [0, 6].includes(dateObj.getDay()) : false;
  }

  // Vérifie si une date est un jour férié
  static isHoliday(date, holidays) {
    if (!date || !holidays) return false;
    const dateString = this.formatDateToString(date);
    return dateString ? !!holidays[dateString] : false;
  }

  //Vérifie si une date est un jour férié ou un week-end
  static isHolidayOrWeekend(date, holidays = {}) {
    return this.isWeekend(date) || this.isHoliday(date, holidays);
  }

  //Convertit une date de fin INCLUSIVE (API) en EXCLUSIVE (FullCalendar)
  static toExclusiveEndDate(date) {
    const endDate = this.toDate(date);
    if (!endDate) return null;
    
    // Pour FullCalendar, ajouter un jour à la date de fin inclusive
    const exclusiveDate = new Date(endDate);
    exclusiveDate.setDate(exclusiveDate.getDate() + 1);
    return exclusiveDate;
  }

  //Convertit une date de fin EXCLUSIVE (FullCalendar) en INCLUSIVE (API)
  static toInclusiveEndDate(date) {
    const endDate = this.toDate(date);
    if (!endDate) return null;
    
    // Pour l'API, soustraire un jour à la date de fin exclusive
    const inclusiveDate = new Date(endDate);
    inclusiveDate.setDate(inclusiveDate.getDate() - 1);
    return inclusiveDate;
  }

  // Vérifie si l'événement commence et se termine sur des jours ouvrés
  static hasValidEventBoundaries(startDate, endDate, holidays) {
    const start = this.toDate(startDate);
    const end = this.toDate(endDate);
    if (!start || !end) return false;
    return !this.isHolidayOrWeekend(start, holidays) &&
      !this.isHolidayOrWeekend(endDate, holidays);
  }

  // Convertit une date ISO en objet Date UTC pour FullCalendar
  static isoToUTCDate(isoString) {
    if (!isoString) return null;
    
    const components = this.extractDateComponents(isoString);
    if (!components) return null;
    
    return this.createUTCDate(components.year, components.month, components.day);
  }

  //Convertit une date au format ISO sans heure
  static toISODateString(date) {
    return this.formatDateToString(date);
  }

  //Formate une date pour l'affichage utilisateur
  static formatForDisplay(date) {
    if (!date) return 'Non définie';
    
    try {
      const dateObj = this.toDate(date);
      if (!dateObj || isNaN(dateObj.getTime())) return 'Date invalide';
      
      return dateObj.toLocaleDateString();
    } catch (e) {
      console.error('Erreur de formatage de date:', e);
      return 'Date invalide';
    }
  }

  //Convertit une chaîne ISO en objet Date
  static fromISOString(isoString) {
    return this.isoToUTCDate(isoString);
  }

      //const getTodayFormatted = useCallback(() => {
      //     const today = new Date();
      //     const year = today.getFullYear();
      //     const month = String(today.getMonth() + 1).padStart(2, '0');
      //     const day = String(today.getDate()).padStart(2, '0');
      //     return `${year}-${month}-${day}`;
      // }, []);

}