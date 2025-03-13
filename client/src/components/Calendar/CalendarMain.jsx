import React, { useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import resourceTimelinePlugin from '@fullcalendar/resource-timeline';
import interactionPlugin from '@fullcalendar/interaction';
import frLocale from '@fullcalendar/core/locales/fr';
import { DateUtils } from '../../utils/dateUtils';

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
    style.textContent = getCalendarStyles();
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    if (!calendarRef.current) return;
    
    // Variable pour suivre si l'initialisation a été effectuée
    let initialized = false;
    
    // Fonction pour mettre à jour l'affichage de l'année
    const updateYearDisplay = () => {
      const yearDisplay = document.querySelector('.fc-year-display');
      if (yearDisplay) {
        yearDisplay.textContent = selectedYear;
      }
    };
    
    // Fonction pour créer et ajouter les boutons
    const initializeMonthButtons = () => {
      if (initialized) return;
      
      try {
        // Cibler la partie centrale de la barre d'outils
        const toolbarCenter = document.querySelector('.fc-header-toolbar .fc-center') || 
                             document.querySelector('.fc-toolbar .fc-center') ||
                             document.querySelector('.fc-toolbar-chunk:nth-child(2)');
        
        if (!toolbarCenter) {
          console.warn("Partie centrale de la barre d'outils non trouvée, réessai plus tard...");
          return false;
        }
        
        // Vérifier si les boutons existent déjà pour éviter les doublons
        if (document.querySelector('.fc-monthNav-container')) {
          updateYearDisplay(); // Mettre à jour l'année si les boutons existent déjà
          return true;
        }
        
        // Vider le contenu actuel de la partie centrale
        toolbarCenter.innerHTML = '';
        
        // Créer un conteneur pour l'année et les boutons des mois
        const navContainer = document.createElement('div');
        navContainer.className = 'fc-monthNav-container';
        
        // Ligne supérieure: Année avec navigation
        const yearNavContainer = document.createElement('div');
        yearNavContainer.className = 'fc-yearNav-container';
        
        // Bouton année précédente
        const prevYearBtn = document.createElement('button');
        prevYearBtn.type = 'button';
        prevYearBtn.className = 'fc-button fc-button-primary';
        prevYearBtn.innerHTML = '&laquo;'; // Double flèche gauche
        prevYearBtn.title = 'Année précédente';
        prevYearBtn.addEventListener('click', goToPreviousYear);
        
        // Affichage de l'année courante
        const yearDisplay = document.createElement('span');
        yearDisplay.className = 'fc-year-display';
        yearDisplay.textContent = selectedYear;
        
        // Bouton année suivante
        const nextYearBtn = document.createElement('button');
        nextYearBtn.type = 'button';
        nextYearBtn.className = 'fc-button fc-button-primary';
        nextYearBtn.innerHTML = '&raquo;'; // Double flèche droite
        nextYearBtn.title = 'Année suivante';
        nextYearBtn.addEventListener('click', goToNextYear);
        
        // Assembler les éléments de navigation d'année
        yearNavContainer.appendChild(prevYearBtn);
        yearNavContainer.appendChild(yearDisplay);
        yearNavContainer.appendChild(nextYearBtn);
        
        // Ligne inférieure: Boutons des mois
        const monthsContainer = document.createElement('div');
        monthsContainer.className = 'fc-months-container';
        
        // Ajouter les boutons de mois
        months.forEach((month, index) => {
          const button = document.createElement('button');
          button.type = 'button';
          button.className = 'fc-button fc-button-primary';
          
          // Déterminer si ce mois doit être actif
          const today = new Date();
          const currentMonth = today.getMonth();
          const currentYear = today.getFullYear();
          const isCurrentMonth = currentMonth === index && currentYear === selectedYear;
          
          // Pour le texte du bouton, utiliser le mois complet pour les grands écrans et l'abréviation pour les petits
          const monthAbbr = month.substring(0, 3);
          // Utilisez des spans pour appliquer des styles différents
          button.innerHTML = `
            <span class="month-full">${month}</span>
            <span class="month-abbr">${monthAbbr}</span>
          `;
          
          // Mise en évidence du mois actuel
          if (isCurrentMonth) {
            button.classList.add('fc-button-active');
          }
          
          // Ajouter un attribut data-month pour faciliter la sélection CSS
          button.setAttribute('data-month', index);
          
          // Gestionnaire d'événement pour la navigation
          button.addEventListener('click', () => {
            // Supprimer la classe active de tous les boutons
            document.querySelectorAll('.fc-months-container .fc-button').forEach(btn => {
              btn.classList.remove('fc-button-active');
            });
            
            // Ajouter la classe active au bouton cliqué
            button.classList.add('fc-button-active');
            
            // Naviguer vers le mois
            navigateToMonth(index);
          });
          
          monthsContainer.appendChild(button);
        });
        
        // Assembler le conteneur principal
        navContainer.appendChild(yearNavContainer);
        navContainer.appendChild(monthsContainer);
        
        // Ajouter le conteneur à la barre d'outils centrale
        toolbarCenter.appendChild(navContainer);
        
        return true;
      } catch (error) {
        console.error("Erreur lors de l'ajout des boutons de navigation:", error);
        return false;
      }
    };
    
    // Tentatives multiples avec intervalles croissants
    const attempts = [200, 500, 1000, 2000];
    let attemptCount = 0;
    
    const tryInitialize = () => {
      if (initialized || attemptCount >= attempts.length) return;
      
      const result = initializeMonthButtons();
      
      if (result) {
        initialized = true;
      } else {
        // Programmer la prochaine tentative
        setTimeout(tryInitialize, attempts[attemptCount]);
        attemptCount++;
      }
    };
    
    // Première tentative
    tryInitialize();
    
    // Fonction pour réinitialiser les boutons après les changements de vue
    const resetButtons = () => {
      // Supprimer les boutons existants
      const container = document.querySelector('.fc-monthNav-container');
      if (container) {
        container.remove();
      }
      
      // Réinitialiser le flag pour permettre une nouvelle initialisation
      initialized = false;
      attemptCount = 0;
      
      // Retenter l'initialisation
      setTimeout(tryInitialize, 200);
    };
    
    // Attacher les gestionnaires d'événements pour les changements de vue
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.on('viewDidMount', resetButtons);
      
      // Aussi réinitialiser lors des changements de date
      const handleDatesSet = (info) => {
        // Mettre à jour l'année sélectionnée en fonction de la date du calendrier
        const calendarDate = calendarApi.getDate();
        const calendarYear = calendarDate.getFullYear();
        
        if (calendarYear !== selectedYear) {
          // Ne pas appeler setSelectedYear directement ici car c'est une prop
          // Utiliser un callback fourni par les props si nécessaire
        }
        
        // Mettre à jour l'affichage de l'année
        updateYearDisplay();
      };
      
      calendarApi.on('datesSet', handleDatesSet);
      
      return () => {
        // Nettoyage
        const container = document.querySelector('.fc-monthNav-container');
        if (container) {
          container.remove();
        }
        
        // Détacher les gestionnaires d'événements
        try {
          calendarApi.off('viewDidMount', resetButtons);
          calendarApi.off('datesSet', handleDatesSet);
        } catch (e) {
          console.error("Erreur lors du nettoyage des événements:", e);
        }
      };
    }
    
    return () => {
      // Nettoyage de secours
      const container = document.querySelector('.fc-monthNav-container');
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

// Fonction utilitaire pour obtenir les styles CSS pour le calendrier
function getCalendarStyles() {
  return `
    /* Conteneur principal de navigation */
    .fc-monthNav-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin: 0 auto;
      gap: 8px;
      width: 100%;
    }

    .fc-header-toolbar .fc-toolbar-chunk:first-child {
      width: 600px;
      display: flex;
    }
    
    /* Conteneur de navigation par année */
    // .fc-yearNav-container {
    //   display: flex;
    //   align-items: center;
    //   justify-content: center;
    //   margin-bottom: 8px;
    //   width: 100%;
    // }
    
    /* Affichage de l'année */
    .fc-year-display {
      margin: 0 16px;
      font-weight: bold;
      font-size: 1.4rem;
      min-width: 80px;
      text-align: center;
      color: #1d4ed8;
      user-select: none;
    }
    
    /* Conteneur des boutons de mois */
    .fc-months-container {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 6px;
      width: 100%;
    }
    
    /* Boutons des mois */
    .fc-months-container .fc-button {
      font-size: 0.9rem;
      padding: 8px 12px !important;
      margin: 0;
      min-width: 90px;
      text-align: center;
      border-radius: 6px;
      transition: all 0.2s ease;
      position: relative;
      overflow: hidden;
    }
    
    /* Gestion des versions abrégées/complètes des noms de mois */
    .fc-months-container .fc-button .month-full {
      display: inline;
    }
    
    .fc-months-container .fc-button .month-abbr {
      display: none;
    }
    
    /* Effets de survol et d'état actif */
    .fc-months-container .fc-button:hover {
      background-color: #2563eb !important;
      transform: translateY(-2px);
      box-shadow: 0 3px 6px rgba(0, 0, 0, 0.15);
    }
    
    .fc-months-container .fc-button-active {
      background-color: #1d4ed8 !important;
      font-weight: bold;
      box-shadow: 0 4px 8px rgba(29, 78, 216, 0.3);
      transform: translateY(-1px);
    }
    
    /* Style pour ajouter un indicateur sous le mois actif */
    .fc-months-container .fc-button-active::after {
      content: '';
      position: absolute;
      bottom: 2px;
      left: 25%;
      width: 50%;
      height: 3px;
      border-radius: 3px;
    }
    
    /* Boutons de navigation par année */
    .fc-yearNav-container .fc-button {
      font-size: 1rem;
      padding: 6px 14px !important;
      border-radius: 6px;
      transition: all 0.2s ease;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    
    .fc-yearNav-container .fc-button:hover {
      background-color: #2563eb !important;
      transform: translateY(-2px);
      box-shadow: 0 3px 6px rgba(0, 0, 0, 0.15);
    }
    
    /* Styles responsifs */
    @media (max-width: 768px) {
      .fc-months-container .fc-button {
        min-width: 70px;
        padding: 6px 8px !important;
        font-size: 0.85rem;
      }
      
      .fc-year-display {
        font-size: 1.2rem;
        margin: 0 10px;
      }
      
      .fc-yearNav-container .fc-button {
        font-size: 0.9rem;
        padding: 4px 10px !important;
      }
    }
    
    @media (max-width: 640px) {
      .fc-months-container .fc-button .month-full {
        display: none;
      }
      
      .fc-months-container .fc-button .month-abbr {
        display: inline;
      }
      
      .fc-months-container .fc-button {
        min-width: 50px;
        padding: 5px 7px !important;
      }
    }
    
    @media (max-width: 480px) {
      .fc-months-container .fc-button {
        font-size: 0.75rem;
        padding: 4px 5px !important;
        min-width: 40px;
      }
      
      .fc-monthNav-container {
        gap: 4px;
      }
      
      .fc-yearNav-container .fc-button {
        font-size: 0.8rem;
        padding: 3px 8px !important;
      }
    }
  `;
}