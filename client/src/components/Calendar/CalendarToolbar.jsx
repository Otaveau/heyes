import React, { memo } from 'react';

export const CalendarToolbar = memo(({ 
  selectedYear, 
  goToPreviousYear, 
  goToNextYear, 
  months, 
  navigateToMonth,
  currentMonth
}) => {
  return (
    <div className="fc-monthNav-container">
      {/* <div className="fc-yearNav-container">
        <button
          type="button"
          className="fc-button fc-button-primary"
          title="Année précédente"
          onClick={goToPreviousYear}
        >
          &laquo;
        </button>
        <span className="fc-year-display">{selectedYear}</span>
        <button
          type="button"
          className="fc-button fc-button-primary"
          title="Année suivante"
          onClick={goToNextYear}
        >
          &raquo;
        </button>
      </div> */}
      
      <div className="fc-months-container">
        {months.map((month, index) => (
          <button
            key={month}
            type="button"
            className={`fc-button fc-button-primary ${currentMonth === index ? 'fc-button-active' : ''}`}
            data-month={index}
            onClick={() => navigateToMonth(index)}
          >
            <span className="month-full">{month}</span>
            <span className="month-abbr">{month.substring(0, 3)}</span>
          </button>
        ))}
      </div>
    </div>
  );
});