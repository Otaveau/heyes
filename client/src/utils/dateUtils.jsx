
export const isHoliday = (date, holidays) => {
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60 * 1000);
    const dateStr = localDate.toISOString().split('T')[0];
    return holidays.includes(dateStr);
};

export const isHolidayOrWeekend = (date) => {
    const day = date.getDay();
    return day === 0 || day === 6 || isHoliday(date);
};

export const formatUTCDate = (dateString) => {
    const [year, month, day] = dateString.split('-');
    return new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day)))
        .toISOString()
        .split('T')[0];
};