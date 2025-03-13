import React, { useEffect } from 'react';
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
  handleViewChange,
  months,
  selectedYear,
  goToPreviousYear,
  goToNextYear,
  navigateToMonth
}) => {

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = getEnhancedCalendarStyles();
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    if (!calendarRef.current) return;
    
    let initialized = false;
    
    // Fonction principale pour initialiser les boutons de navigation
    const initializeCustomNavigation = () => {
      if (initialized) return;
      
      try {
        // Cibler la partie gauche de la barre d'outils (pour tout regrouper)
        const toolbarLeft = document.querySelector('.fc-header-toolbar .fc-left') || 
                           document.querySelector('.fc-toolbar .fc-left') ||
                           document.querySelector('.fc-toolbar-chunk:first-child');
        
        if (!toolbarLeft) {
          console.warn("Partie gauche de la barre d'outils non trouvée, réessai plus tard...");
          return false;
        }
        
        // Vérifier si la navigation est déjà initialisée
        if (document.querySelector('.fc-custom-nav-container')) {
          updateYearDisplay();
          return true;
        }
        
        // Suppression des boutons de navigation natifs si nécessaire
        const nativeButtons = toolbarLeft.querySelectorAll('button');
        nativeButtons.forEach(button => {
          if (button.classList.contains('fc-prev-button') || 
              button.classList.contains('fc-next-button') || 
              button.classList.contains('fc-today-button')) {
            button.style.display = 'none';
          }
        });
        
        // Créer un conteneur principal pour notre navigation personnalisée
        const customNavContainer = document.createElement('div');
        customNavContainer.className = 'fc-custom-nav-container';
        
        // Ligne unique pour la navigation
        const navRow = document.createElement('div');
        navRow.className = 'fc-nav-row';
        
        // -- Section de navigation par année --
        const yearNav = document.createElement('div');
        yearNav.className = 'fc-year-nav';
        
        // Bouton année précédente
        const prevYearBtn = document.createElement('button');
        prevYearBtn.type = 'button';
        prevYearBtn.className = 'fc-button fc-button-primary fc-prev-year-button';
        prevYearBtn.innerHTML = '&laquo;';
        prevYearBtn.title = 'Année précédente';
        prevYearBtn.addEventListener('click', goToPreviousYear);
        
        // Affichage de l'année courante
        const yearDisplay = document.createElement('span');
        yearDisplay.className = 'fc-year-display';
        yearDisplay.textContent = selectedYear;
        
        // Bouton année suivante
        const nextYearBtn = document.createElement('button');
        nextYearBtn.type = 'button';
        nextYearBtn.className = 'fc-button fc-button-primary fc-next-year-button';
        nextYearBtn.innerHTML = '&raquo;';
        nextYearBtn.title = 'Année suivante';
        nextYearBtn.addEventListener('click', goToNextYear);
        
        // Bouton aujourd'hui
        const todayBtn = document.createElement('button');
        todayBtn.type = 'button';
        todayBtn.className = 'fc-button fc-button-primary fc-today-button';
        todayBtn.textContent = "Aujourd'hui";
        todayBtn.title = "Aller à aujourd'hui";
        todayBtn.addEventListener('click', () => {
          if (calendarRef.current) {
            const today = new Date();
            const currentMonth = today.getMonth();
            const currentYear = today.getFullYear();
            
            // Naviguer directement vers le mois actuel plutôt que d'utiliser l'API directement
            // Cela garantit que notre logique de navigation personnalisée est utilisée
            navigateToMonth(currentMonth);
            
            // Mettre à jour l'affichage de l'année si nécessaire
            if (currentYear !== parseInt(selectedYear)) {
              // Si l'année est différente, nous devons utiliser les callbacks pour changer l'année
              if (currentYear > parseInt(selectedYear)) {
                // Naviguer vers l'année suivante autant de fois que nécessaire
                const yearsToAdvance = currentYear - parseInt(selectedYear);
                for (let i = 0; i < yearsToAdvance; i++) {
                  setTimeout(() => goToNextYear(), i * 50);
                }
              } else {
                // Naviguer vers l'année précédente autant de fois que nécessaire
                const yearsToGoBack = parseInt(selectedYear) - currentYear;
                for (let i = 0; i < yearsToGoBack; i++) {
                  setTimeout(() => goToPreviousYear(), i * 50);
                }
              }
            }
            
            // Mise à jour des boutons de mois
            updateMonthButtons(currentMonth);
          }
        });
        
        // Assembler la navigation par année
        yearNav.appendChild(prevYearBtn);
        yearNav.appendChild(yearDisplay);
        yearNav.appendChild(nextYearBtn);
        yearNav.appendChild(todayBtn);
        
        // -- Section de navigation par mois --
        const monthsNav = document.createElement('div');
        monthsNav.className = 'fc-months-nav';
        
        // Ajouter les boutons de mois
        months.forEach((month, index) => {
          const button = document.createElement('button');
          button.type = 'button';
          button.className = 'fc-button fc-button-primary fc-month-button';
          button.setAttribute('data-month', index);
          
          // Déterminer si c'est le mois actuel
          const today = new Date();
          const currentMonth = today.getMonth();
          const currentYear = today.getFullYear();
          const isCurrentMonth = currentMonth === index && currentYear === parseInt(selectedYear);
          
          if (isCurrentMonth) {
            button.classList.add('fc-button-active');
          }
          
          // Texte complet et abrégé pour responsive
          const monthAbbr = month.substring(0, 3);
          button.innerHTML = `
            <span class="month-full">${month}</span>
            <span class="month-abbr">${monthAbbr}</span>
          `;
          
          // Gestionnaire de clic pour naviguer vers le mois
          button.addEventListener('click', () => {
            updateMonthButtons(index);
            navigateToMonth(index);
          });
          
          monthsNav.appendChild(button);
        });
        
        // Assembler le tout
        navRow.appendChild(yearNav);
        navRow.appendChild(monthsNav);
        customNavContainer.appendChild(navRow);
        
        // Insérer au début de la barre d'outils gauche
        toolbarLeft.insertBefore(customNavContainer, toolbarLeft.firstChild);
        
        return true;
      } catch (error) {
        console.error("Erreur lors de l'initialisation de la navigation personnalisée:", error);
        return false;
      }
    };
    
    // Fonction pour mettre à jour l'affichage de l'année
    const updateYearDisplay = () => {
      const yearDisplay = document.querySelector('.fc-year-display');
      if (yearDisplay) {
        yearDisplay.textContent = selectedYear;
      }
    };
    
    // Fonction pour mettre à jour les boutons de mois actifs
    const updateMonthButtons = (activeMonthIndex) => {
      const monthButtons = document.querySelectorAll('.fc-month-button');
      if (!monthButtons || monthButtons.length === 0) {
        // Si les boutons n'existent pas encore, on ne fait rien
        // Ils seront mis à jour quand ils seront créés
        return;
      }
      
      monthButtons.forEach(btn => {
        btn.classList.remove('fc-button-active');
      });
      
      const activeButton = document.querySelector(`.fc-month-button[data-month="${activeMonthIndex}"]`);
      if (activeButton) {
        activeButton.classList.add('fc-button-active');
      }
    };
    
    // Tentatives multiples avec intervalles croissants
    const attempts = [100, 300, 600, 1000];
    let attemptCount = 0;
    
    const tryInitialize = () => {
      if (initialized || attemptCount >= attempts.length) return;
      
      const result = initializeCustomNavigation();
      
      if (result) {
        initialized = true;
      } else {
        setTimeout(tryInitialize, attempts[attemptCount]);
        attemptCount++;
      }
    };
    
    // Première tentative
    tryInitialize();
    
    // Fonction pour réinitialiser la navigation après les changements de vue
    const resetNavigation = () => {
      console.log("Réinitialisation de la navigation...");
      
      // Supprimer le conteneur existant
      const container = document.querySelector('.fc-custom-nav-container');
      if (container) {
        container.remove();
      }
      
      // Réinitialiser l'état
      initialized = false;
      attemptCount = 0;
      
      // Tenter de réinitialiser immédiatement puis avec des délais croissants
      // pour s'assurer que la navigation est bien rétablie
      tryInitialize();
      setTimeout(tryInitialize, 100);
      setTimeout(tryInitialize, 300);
      setTimeout(tryInitialize, 500);
    };
    
    // Attacher les gestionnaires d'événements pour les changements de vue
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      
      // Réinitialiser lors des changements de vue
      calendarApi.on('viewDidMount', resetNavigation);
      
      // Gérer les changements de date
      const handleDatesSet = (info) => {
        const calendarDate = calendarApi.getDate();
        const calendarYear = calendarDate.getFullYear();
        const calendarMonth = calendarDate.getMonth();
        
        // Mettre à jour l'affichage de l'année
        updateYearDisplay();
        
        // Mettre à jour les boutons de mois
        updateMonthButtons(calendarMonth);
      };
      
      calendarApi.on('datesSet', handleDatesSet);
      
      return () => {
        // Nettoyage
        const container = document.querySelector('.fc-custom-nav-container');
        if (container) {
          container.remove();
        }
        
        try {
          calendarApi.off('viewDidMount', resetNavigation);
          calendarApi.off('datesSet', handleDatesSet);
        } catch (e) {
          console.error("Erreur lors du nettoyage des événements:", e);
        }
      };
    }
    
    return () => {
      // Nettoyage de secours
      const container = document.querySelector('.fc-custom-nav-container');
      if (container) {
        container.remove();
      }
    };
  }, [calendarRef, selectedYear, navigateToMonth, goToPreviousYear, goToNextYear, months]);

  return (
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
      initialView="resourceTimelineYear"
      headerToolbar={{
        left: '',  // On laisse vide pour notre navigation personnalisée
        center: '', // On gère nos propres boutons de mois
        right: 'resourceTimelineYear,resourceTimelineMonth,resourceTimelineWeek'
      }}
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
      viewDidMount={handleViewChange}
      datesSet={(info) => {
        handleViewChange(info);
      }}
      
      resourceLabelDidMount={(info) => {
        // Style pour les en-têtes de groupe (équipes)
        if (info.resource.extendedProps?.isTeam) {
          info.el.style.fontWeight = 'bold';
          info.el.style.backgroundColor = '#e5e7eb';
          info.el.style.borderBottom = '1px solid #d1d5db';
          info.el.style.color = '#1f2937';
          info.el.style.fontSize = '0.95rem';
        } else {
          // Style pour les membres de l'équipe
          info.el.style.paddingLeft = '20px';
          info.el.style.borderBottom = '1px solid #e5e7eb';
          info.el.style.color = '#4b5563';
        }
      }}

      // Appliquer un style différent aux lignes d'équipe
      resourceLaneDidMount={(info) => {
        if (info.resource.extendedProps?.isTeam) {
          info.el.style.backgroundColor = '#f3f4f6';
          info.el.style.cursor = 'not-allowed';
        }
      }}

      // Empêcher le dépôt sur les lignes d'équipe
      eventAllow={(dropInfo, draggedEvent) => {
        // Vérifier si la cible de dépôt est une équipe
        const resourceId = dropInfo.resource ? dropInfo.resource.id : null;
        const resource = resourceId ? 
          resources.find(r => r.id === resourceId) : null;
        
        // Si c'est une équipe, ne pas autoriser le dépôt
        if (resource && resource.extendedProps?.isTeam) {
          return false;
        }
        
        // Vérifier si c'est un jour férié ou un weekend
        const startDate = new Date(dropInfo.start);
        const endDate = new Date(dropInfo.end);
        endDate.setDate(endDate.getDate() - 1);

        if (DateUtils.isHolidayOrWeekend(startDate, holidays) ||
            DateUtils.isHolidayOrWeekend(endDate, holidays)) {
          return false;
        }

        return true;
      }}

      // Gestionnaires pour les classes CSS des différents éléments du calendrier
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
      
      // Gestionnaires d'événements pour les interactions avec le calendrier
      eventDragStart={taskHandlers.handleEventDragStart}
      eventDrop={taskHandlers.handleEventDrop}
      drop={taskHandlers.handleExternalDrop}
      select={taskHandlers.handleDateClick}
      eventClick={taskHandlers.handleCalendarEventClick}
      eventResize={taskHandlers.handleEventResize}
      eventDragStop={taskHandlers.handleEventDragStop}
      eventReceive={taskHandlers.handleEventReceive}
    />
  );
};