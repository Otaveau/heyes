import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import resourceTimelinePlugin from '@fullcalendar/resource-timeline';
import interactionPlugin from '@fullcalendar/interaction';
import frLocale from '@fullcalendar/core/locales/fr';
import { DateUtils } from '../../utils/dateUtils';
import { getEnhancedCalendarStyles } from '../../style/calendarStyles';

export const CalendarMain = ({ 
  calendarRef,
  calendarTasks,
  resources,
  holidays,
  taskHandlers,
  handleViewChange: externalHandleViewChange,
  months,
  selectedYear,
  goToPreviousYear,
  goToNextYear,
  navigateToMonth
}) => {
  // État pour suivre la vue actuelle
  const [currentView, setCurrentView] = useState('resourceTimelineYear');
  
  useEffect(() => {
    if (calendarRef.current) {
      const currentDate = new Date();
      const calendarApi = calendarRef.current.getApi();
      calendarApi.scrollToTime({ month: currentDate.getMonth() });
    }
  }, [calendarRef]);

  // Appliquer les styles améliorés
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = getEnhancedCalendarStyles();
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Gestionnaire de changement de vue
  const internalHandleViewChange = (info) => {
    const newView = info.view.type;
    setCurrentView(newView);
    
    // Appeler le gestionnaire externe si fourni
    if (externalHandleViewChange) {
      externalHandleViewChange(info);
    }
  };

  // Fonction pour gérer le bouton "Aujourd'hui"
  const handleTodayClick = () => {
    if (calendarRef.current) {
      const today = new Date();
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth();

      // Naviguer vers l'année courante
      if (currentYear !== selectedYear) {
        // Trouver la différence entre l'année actuelle et l'année sélectionnée
        const yearDifference = currentYear - selectedYear;
        
        // Utiliser goToPreviousYear ou goToNextYear selon la différence
        const navigationMethod = yearDifference < 0 ? goToPreviousYear : goToNextYear;
        
        // Répéter la navigation autant de fois que nécessaire
        for (let i = 0; i < Math.abs(yearDifference); i++) {
          navigationMethod();
        }
      }

      // Naviguer vers le mois courant
      navigateToMonth(currentMonth);
    }
  };


  // Rendu des boutons de navigation personnalisés
  const renderCustomNavigation = () => {
    return (
      <div className="fc-custom-nav-container">
        <div className="fc-nav-row">
          {/* Navigation par année - Gauche */}
          <div className="fc-year-nav">
            <button 
              type="button" 
              className="fc-button fc-button-primary fc-prev-year-button"
              onClick={goToPreviousYear}
              title="Année précédente"
            >
              &laquo;
            </button>
            <span className="fc-year-display">{selectedYear}</span>
            <button 
              type="button" 
              className="fc-button fc-button-primary fc-next-year-button"
              onClick={goToNextYear}
              title="Année suivante"
            >
              &raquo;
            </button>
            <button
              type="button"
              className="fc-button fc-button-primary fc-today-button"
              onClick={handleTodayClick}
              title="Aujourd'hui"
            >
              Aujourd'hui
            </button>
          </div>
  
          {/* Centre - Mois (visible uniquement en vue année) */}
          {currentView === 'resourceTimelineYear' && (
            <div className="fc-months-nav">
              {months.map((month, index) => (
                <button
                  key={index}
                  type="button"
                  className="fc-button fc-button-primary fc-month-button"
                  onClick={() => navigateToMonth(index)}
                >
                  <span className="month-full">{month}</span>
                  <span className="month-abbr">{month.substring(0, 3)}</span>
                </button>
              ))}
            </div>
          )}
          
          {/* Droite - Boutons de vue du calendrier */}
          <div className="fc-view-buttons">
            <button
              type="button"
              className={`fc-button fc-button-primary ${currentView === 'resourceTimelineYear' ? 'fc-button-active' : ''}`}
              onClick={() => {
                if (calendarRef.current) {
                  calendarRef.current.getApi().changeView('resourceTimelineYear');
                }
              }}
            >
              Année
            </button>
            <button
              type="button"
              className={`fc-button fc-button-primary ${currentView === 'resourceTimelineMonth' ? 'fc-button-active' : ''}`}
              onClick={() => {
                if (calendarRef.current) {
                  calendarRef.current.getApi().changeView('resourceTimelineMonth');
                }
              }}
            >
              Mois
            </button>
            <button
              type="button"
              className={`fc-button fc-button-primary ${currentView === 'resourceTimelineWeek' ? 'fc-button-active' : ''}`}
              onClick={() => {
                if (calendarRef.current) {
                  calendarRef.current.getApi().changeView('resourceTimelineWeek');
                }
              }}
            >
              Semaine
            </button>
          </div>
        </div>
      </div>
    );
  };


  return (
    <div className="calendar-container">
      {renderCustomNavigation()}
      <FullCalendar
        ref={calendarRef}
        locale={frLocale}
        timeZone='Europe/Paris'
        events={calendarTasks}
        resources={resources}
        nextDayThreshold="00:00:00"
        slotLabelFormat={[
          { month: 'long' },
          { weekday: 'short', day: 'numeric' }
        ]}
        eventTimeFormat={{
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
          timeZone: 'local'
        }}
        plugins={[resourceTimelinePlugin, interactionPlugin]}
        height='auto'
        schedulerLicenseKey='GPL-My-Project-Is-Open-Source'
        initialView='resourceTimelineYear'
        initialDate={new Date()}
        headerToolbar={false}
        editable={true}
        selectable={true}
        selectMirror={true}
        droppable={true}
        resourceAreaWidth="15%"
        slotDuration={{ days: 1 }}
        selectConstraint={{
          start: '00:00',
          end: '24:00'
        }}
        weekends={true}
        resourceOrder="title"
        resourcesInitiallyExpanded={true}
        viewDidMount={internalHandleViewChange}
        datesSet={(info) => {
          internalHandleViewChange(info);
        }}
        
        // Autres gestionnaires d'événements (comme dans votre code original)
        resourceLabelDidMount={(info) => {
          if (info.resource.extendedProps?.isTeam) {
            info.el.style.fontWeight = 'bold';
            info.el.style.backgroundColor = '#e5e7eb';
            info.el.style.borderBottom = '1px solid #d1d5db';
            info.el.style.color = '#1f2937';
            info.el.style.fontSize = '0.95rem';
          } else {
            info.el.style.paddingLeft = '20px';
            info.el.style.borderBottom = '1px solid #e5e7eb';
            info.el.style.color = '#4b5563';
          }
        }}

        resourceLaneDidMount={(info) => {
          if (info.resource.extendedProps?.isTeam) {
            info.el.style.backgroundColor = '#f3f4f6';
            info.el.style.cursor = 'not-allowed';
          }
        }}

        eventAllow={(dropInfo, draggedEvent) => {
          const resourceId = dropInfo.resource ? dropInfo.resource.id : null;
          const resource = resourceId ? 
            resources.find(r => r.id === resourceId) : null;
          
          if (resource && resource.extendedProps?.isTeam) {
            return false;
          }
          
          const startDate = new Date(dropInfo.start);
          const endDate = new Date(dropInfo.end);
          endDate.setDate(endDate.getDate() - 1);

          if (DateUtils.isHolidayOrWeekend(startDate, holidays) ||
              DateUtils.isHolidayOrWeekend(endDate, holidays)) {
            return false;
          }

          return true;
        }}

        // Gestionnaires de classes pour les jours fériés et week-ends
        slotLabelClassNames={(arg) => {
          if (!arg?.date) return [];
          const classes = [];
          if (arg.level === 1 && DateUtils.isHolidayOrWeekend(arg.date, holidays)) {
            classes.push(DateUtils.isHoliday(arg.date, holidays) ? 'holiday-slot' : 'weekend-slot');
          }
          return classes;
        }}
        slotLaneClassNames={(arg) => {
          if (!arg?.date) return '';
          return DateUtils.isHolidayOrWeekend(arg.date, holidays)
            ? DateUtils.isHoliday(arg.date, holidays)
              ? 'holiday-column'
              : 'weekend-column'
            : '';
        }}
        dayHeaderClassNames={(arg) => {
          if (!arg?.date) return '';
          return DateUtils.isHolidayOrWeekend(arg.date, holidays)
            ? DateUtils.isHoliday(arg.date, holidays)
              ? 'holiday-header'
              : 'weekend-header'
            : '';
        }}
        dayCellClassNames={(arg) => {
          if (!arg?.date) return [];
          const classes = [];
          if (DateUtils.isWeekend(arg.date)) {
            classes.push('weekend-cell');
          }
          if (DateUtils.isHoliday(arg.date, holidays)) {
            classes.push('holiday-cell');
          }
          return classes;
        }}
        
        // Gestionnaires d'événements
        eventDragStart={taskHandlers.handleEventDragStart}
        eventDrop={taskHandlers.handleEventDrop}
        drop={taskHandlers.handleExternalDrop}
        select={taskHandlers.handleDateClick}
        eventClick={taskHandlers.handleCalendarEventClick}
        eventResize={taskHandlers.handleEventResize}
        eventDragStop={taskHandlers.handleEventDragStop}
        eventReceive={taskHandlers.handleEventReceive}
      />
    </div>
  );
};