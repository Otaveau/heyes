import { ERROR_MESSAGES } from '../constants/constants';

const formatDateToLocalYYYYMMDD = (date) => {
  if (date instanceof Date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }
  return date;
};


export class DateUtils {

//Ajuste une date ISO récupérée du serveur pour gérer le décalage de fuseau horaire
static adjustDateFromServer = (dateStr) => {
  if (!dateStr) return null;
  
  // Si la date est déjà au format YYYY-MM-DD sans partie heure, on la retourne telle quelle
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }
  
  // Sinon, on crée un objet Date en spécifiant explicitement qu'il s'agit d'une date UTC
  const utcDateStr = dateStr.endsWith('Z') ? dateStr : `${dateStr}Z`;
  const date = new Date(utcDateStr);
  
  // On utilise formatDateToLocalYYYYMMDD pour obtenir la date dans le fuseau horaire local
  return formatDateToLocalYYYYMMDD(date);
};

//Prépare une date pour l'envoi au serveur en s'assurant qu'elle est au format YYYY-MM-DD
static prepareDateForServer = (date) => {
  if (!date) return null;
  
  // Si c'est déjà une chaîne au format YYYY-MM-DD, on la retourne
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return date;
  }
  
  // Sinon, on crée un objet Date et on le formate
  const dateObj = date instanceof Date ? date : new Date(date);
  return formatDateToLocalYYYYMMDD(dateObj);
};

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

  //Utils
  static parseDate(date) {
    if (!date) return null;
    if (date instanceof Date) return date;
    if (typeof date === 'string') {
      // Pour gérer les dates au format ISO
      return new Date(date);
    }
    return null;
  }
}