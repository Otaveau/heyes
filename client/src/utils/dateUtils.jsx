import { format } from 'date-fns';

export const isHoliday = (date, holidays) => {
  if (!holidays || !Array.isArray(holidays)) return false;
  
  const formattedDate = format(date, 'yyyy-MM-dd');
  return holidays.includes(formattedDate);
};

export const isHolidayOrWeekend = (date, holidays) => {
  const dayOfWeek = date.getDay();
  return dayOfWeek === 0 || dayOfWeek === 6 || isHoliday(date, holidays);
};

export const formatUTCDate = (dateString) => {
  const [year, month, day] = dateString.split('-');
  return new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day)))
      .toISOString()
      .split('T')[0];
};