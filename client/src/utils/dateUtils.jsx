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
      if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return date;
      }
      const [year, month, day] = date.split('-');
      return new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day)))
        .toISOString()
        .split('T')[0];
    }
    
    // Si c'est un objet Date
    if (date instanceof Date) {
      return date.toISOString().split('T')[0];
    }

    // Si c'est une chaîne ISO
    return new Date(date).toISOString().split('T')[0];
    
  } catch (error) {
    console.error('Error in formatUTCDate:', error);
    return null;
  }
};