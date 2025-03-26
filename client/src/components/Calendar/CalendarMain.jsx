import React, { useState, useEffect, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import resourceTimelinePlugin from '@fullcalendar/resource-timeline';
import interactionPlugin from '@fullcalendar/interaction';
import frLocale from '@fullcalendar/core/locales/fr';
import { DateUtils } from '../../utils/dateUtils';
import { getEnhancedCalendarStyles } from '../../style/calendarStyles';

export const CalendarMain = ({ 
  calendarRef,
  tasks,
  resources,
  holidays,
  taskHandlers,
  handleViewChange: externalHandleViewChange,
  months,
  selectedYear,
  setSelectedYear,
  goToPreviousYear,
  goToNextYear,
  navigateToMonth,
  dropZoneRefs,
  dropZones
}) => {

  const [currentView, setCurrentView] = useState('resourceTimelineYear');

  const formattedTasksForCalendar = useMemo(() => {
    return tasks.map(task => {
      // Si la tâche a déjà une exclusiveEndDate, on l'utilise
      if (task.extendedProps?.exclusiveEndDate) {
        return {
          ...task,
          end: task.extendedProps.exclusiveEndDate
        };
      }  
      return task;
    });
  }, [tasks]);
 
  useEffect(() => {
    if (calendarRef.current) {
      const currentDate = new Date();
      const calendarApi = calendarRef.current.getApi();
      calendarApi.scrollToTime({ month: currentDate.getMonth() });
    }
  }, [calendarRef]);

  
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
  // Fonction pour gérer le bouton "Aujourd'hui"
const handleTodayClick = async () => {
  if (calendarRef.current) {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();

    // Si nous sommes dans une année différente, changer d'année d'abord
    if (currentYear !== selectedYear) {
      // Utiliser directement l'API FullCalendar pour naviguer à la date du jour
      const calendarApi = calendarRef.current.getApi();
      calendarApi.gotoDate(today);
      
      // Mettre à jour l'état local pour refléter le changement
      if (typeof setSelectedYear === 'function') {
        setSelectedYear(currentYear);
      }
    } else {
      // Si nous sommes déjà dans la bonne année, juste naviguer au mois courant
      navigateToMonth(currentMonth);
    }
    
    // Faire défiler vers la position actuelle
    setTimeout(() => {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.scrollToTime({ month: currentMonth, date: today.getDate() });
    }, 100);
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

  // Gestionnaire personnalisé pour eventDrop pour gérer la conversion des dates exclusives
  const handleEventDrop = (info) => {
    const { event } = info;
    
    // Récupérer les dates start et end (end est exclusive dans FullCalendar)
    const end = event.end;
    
    // Créer une copie inclusive de la date de fin (soustraire un jour)
    const inclusiveEndDate = end ? new Date(end) : null;
    if (inclusiveEndDate) {
      inclusiveEndDate.setDate(inclusiveEndDate.getDate() - 1);
    }
    
    // Enrichir les données de l'événement avec les dates inclusives/exclusives
    const extendedEvent = {
      ...event.toPlainObject(),
      extendedProps: {
        ...event.extendedProps,
        inclusiveEndDate: inclusiveEndDate // Stocker la date inclusive
      }
    };
    
    // Appeler le gestionnaire d'événement original avec les données enrichies
    if (taskHandlers.handleEventDrop) {
      taskHandlers.handleEventDrop({
        ...info,
        enrichedEvent: extendedEvent
      });
    }
  };

  // Gestionnaire personnalisé pour eventResize
  const handleEventResize = (info) => {
    const { event } = info;
    
    // Récupérer les dates start et end (end est exclusive dans FullCalendar)
    const end = event.end;
    
    // Créer une copie inclusive de la date de fin (soustraire un jour)
    const inclusiveEndDate = end ? new Date(end) : null;
    if (inclusiveEndDate) {
      inclusiveEndDate.setDate(inclusiveEndDate.getDate() - 1);
    }
    
    // Enrichir les données de l'événement avec les dates inclusives/exclusives
    const extendedEvent = {
      ...event.toPlainObject(),
      extendedProps: {
        ...event.extendedProps,
        inclusiveEndDate: inclusiveEndDate // Stocker la date inclusive
      }
    };
    
    // Appeler le gestionnaire d'événement original avec les données enrichies
    if (taskHandlers.handleEventResize) {
      taskHandlers.handleEventResize({
        ...info,
        enrichedEvent: extendedEvent
      });
    }
  };


  return (
    <div className="calendar-container">
      {renderCustomNavigation()}
      <FullCalendar
        ref={calendarRef}
        locale={frLocale}
        timeZone='UTC'
        events={formattedTasksForCalendar}
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
          timeZone: 'UTC'
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
            // Utiliser weekend-slot pour tous les jours non ouvrés
            classes.push('weekend-slot');
          }
          return classes;
        }}
        
        slotLaneClassNames={(arg) => {
          if (!arg?.date) return '';
          // Utiliser weekend-column pour tous les jours non ouvrés
          return DateUtils.isHolidayOrWeekend(arg.date, holidays) ? 'weekend-column' : '';
        }}
        
        dayHeaderClassNames={(arg) => {
          if (!arg?.date) return '';
          // Utiliser weekend-header pour tous les jours non ouvrés
          return DateUtils.isHolidayOrWeekend(arg.date, holidays) ? 'weekend-header' : '';
        }}
        
        dayCellClassNames={(arg) => {
          if (!arg?.date) return [];
          const classes = [];
          // Appliquer weekend-cell à tous les jours non ouvrés
          if (DateUtils.isHolidayOrWeekend(arg.date, holidays)) {
            classes.push('weekend-cell');
          }
          // Vous pouvez toujours garder holiday-cell pour une distinction visuelle si nécessaire
          if (DateUtils.isHoliday(arg.date, holidays)) {
            classes.push('holiday-cell');
          }
          return classes;
        }}
        
        // Gestionnaires d'événements
        eventDragStart={taskHandlers.handleEventDragStart}
        eventDrop={handleEventDrop}
        drop={taskHandlers.handleExternalDrop}
        select={taskHandlers.handleDateClick}
        eventClick={taskHandlers.handleCalendarEventClick}
        eventResize={handleEventResize}
        eventDragStop={taskHandlers.handleEventDragStop}
        eventReceive={taskHandlers.handleEventReceive}
      />
    </div>
  );
};