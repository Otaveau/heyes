import { format } from 'date-fns';

export const isHoliday = (date, holidays) => {
  if (!date || !holidays || !Array.isArray(holidays)) return false;
  
  try {
    const formattedDate = format(date, 'yyyy-MM-dd');
    return holidays.includes(formattedDate);
  } catch (error) {
    console.error('Error in isHoliday:', error);
    return false;
  }
};

export const isHolidayOrWeekend = (date, holidays) => {
  if (!date) return false;
  
  try {
    const dayOfWeek = date.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6 || isHoliday(date, holidays);
  } catch (error) {
    console.error('Error in isHolidayOrWeekend:', error);
    return false;
  }
};

export const formatUTCDate = (date) => {
  if (!date) return null;
  
  try {
    // Si c'est déjà une chaîne au format YYYY-MM-DD
    if (typeof date === 'string') {
      // Test du format YYYY-MM-DD
      if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return date;
      }
      
      // Pour les dates avec timezone (format ISO)
      if (date.includes('T')) {
        // Utiliser directement la partie date sans conversion UTC
        return date.split('T')[0];
      }
      
      // Pour les dates au format YYYY-MM-DD avec ou sans timezone
      const [datePart] = date.split('T');
      // Retourner directement la partie date
      return datePart;
    }
    
    // Si c'est un objet Date
    if (date instanceof Date) {
      // Vérifier si la date est valide
      if (isNaN(date.getTime())) {
        throw new Error('Invalid Date object');
      }
      
      // Utiliser les composants locaux de la date
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      return `${year}-${month}-${day}`;
    }

    // Pour tout autre type d'entrée
    const d = new Date(date);
    if (isNaN(d.getTime())) {
      throw new Error('Invalid date input');
    }
    
    // Utiliser les composants locaux de la date
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
    
  } catch (error) {
    console.error('Error in formatUTCDate:', error);
    return null;
  }
};