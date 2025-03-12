import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import resourceTimelinePlugin from '@fullcalendar/resource-timeline';
import interactionPlugin, { Draggable } from '@fullcalendar/interaction';
import frLocale from '@fullcalendar/core/locales/fr';
import { useCalendarData } from '../../hooks/useCalendarData';
import { toast } from 'react-toastify';
import { TOAST_CONFIG } from '../../constants/constants';
import { TaskForm } from '../tasks/TaskForm';
import { TaskBoard } from '../tasks/TaskBoard';
import { DateUtils } from '../../utils/dateUtils';
import { useTaskHandlers } from '../../hooks/useTaskHandlers';
import '../../style/CalendarView.css';


export const CalendarView = () => {
  // État principal du calendrier
  const [calendarState, setCalendarState] = useState({
    showWeekends: true,
    isFormOpen: false,
    selectedDates: null,
    selectedTask: null,
    isProcessing: false,
    currentView: 'resourceTimelineYear', // Ajout d'un état pour suivre la vue actuelle
  });

  // Zones de dépôt pour le TaskBoard
  const dropZones = useMemo(() => [
    { id: 'todo', statusId: '1', title: 'À faire' },
    { id: 'inProgress', statusId: '2', title: 'En cours' },
    { id: 'blocked', statusId: '3', title: 'Bloqué' },
    { id: 'done', statusId: '4', title: 'Terminé' }
  ], []);


  const dropZoneRefs = useRef(dropZones.map(() => React.createRef()));
  const calendarRef = useRef(null);
  const draggablesRef = useRef([]);
  

  const { tasks, setTasks, resources, holidays, statuses } = useCalendarData();
  
  const [hasLocalChanges, setHasLocalChanges] = useState(false);
  
  const [calendarTasks, setCalendarTasks] = useState([]);
  const [boardTasks, setBoardTasks] = useState([]);

  // Traiter les tâches brutes quand elles changent
  useEffect(() => {
    if (!tasks || !Array.isArray(tasks)) return;

    const calendar = tasks.filter(task => task.resourceId);
    const board = tasks.filter(task => !task.resourceId);
    
    setCalendarTasks(calendar);
    setBoardTasks(board);
  }, [tasks]);


  // Fonction pour synchroniser les changements locaux avec le serveur
  const syncChanges = useCallback(async () => {
    if (!hasLocalChanges) return;
    
    try {
      // Simuler un délai de réseau
      await new Promise(resolve => setTimeout(resolve, 500));
      
      //toast.success('Changements synchronisés avec succès', TOAST_CONFIG);
      setHasLocalChanges(false);
    } catch (error) {
      console.error('Error syncing tasks:', error);
      toast.error('Erreur de synchronisation', TOAST_CONFIG);
    }
  }, [hasLocalChanges]);
  
  // Synchroniser périodiquement ou avant la navigation
  useEffect(() => {
    // Synchroniser toutes les 30 secondes si des changements existent
    const interval = setInterval(() => {
      if (hasLocalChanges) {
        syncChanges();
      }
    }, 30000);
    
    // Synchroniser avant de quitter la page
    const handleBeforeUnload = (e) => {
      if (hasLocalChanges) {
        syncChanges();
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasLocalChanges, syncChanges]);

  // Utiliser le hook useTaskHandlers modifié
  const {
    handleDateClick,
    handleTaskSubmit,
    handleExternalTaskClick,
    handleCalendarEventClick,
    handleEventDragStop,
    handleEventDrop,
    handleExternalDrop,
    handleEventDragStart,
    handleEventResize,
    handleEventReceive,
    handleDeleteTask,
    updateTaskStatus
    
  } = useTaskHandlers(
    setTasks,           
    setCalendarState,
    tasks,
    calendarTasks,
    boardTasks,
    setCalendarTasks,
    setBoardTasks,
    dropZoneRefs,
    dropZones,
    holidays,
    calendarRef,
    setHasLocalChanges
  );

  // Gestion des draggables
  useEffect(() => {
    // Nettoyer les anciens draggables
    draggablesRef.current.forEach(draggable => {
      if (draggable) draggable.destroy();
    });
    draggablesRef.current = [];

    // Créer les nouveaux draggables
    dropZoneRefs.current.forEach((ref, index) => {
      if (!ref.current) return;

      const draggable = new Draggable(ref.current, {
        itemSelector: '.fc-event',
        eventData: function (eventEl) {
          const taskId = eventEl.getAttribute('data-task-id');
          const task = boardTasks.find(t => t.id.toString() === taskId.toString());

          if (!task) return {};

          return {
            id: task.id,
            title: task.title,
            start: task.start || new Date(),
            end: task.end || new Date(new Date().getTime() + 24 * 60 * 60 * 1000),
            allDay: true,
            extendedProps: { 
              statusId: task.extendedProps?.statusId || task.statusId,
              description: task.extendedProps?.description || ''
            }
          };
        }
      });

      draggablesRef.current[index] = draggable;
    });

    return () => {
      draggablesRef.current.forEach(draggable => {
        if (draggable) draggable.destroy();
      });
      draggablesRef.current = [];
    };
  }, [boardTasks, dropZones]);

  // Nouveaux mois en français pour les boutons
  const months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  // Fonction pour naviguer vers un mois spécifique
  const navigateToMonth = (monthIndex) => {
    if (!calendarRef.current) return;
    
    // Accéder directement à l'API du calendrier
    const calendarApi = calendarRef.current.getApi();
    
    // Obtenir l'année courante
    const today = new Date();
    const year = today.getFullYear();
    
    // Créer la date cible pour le premier jour du mois sélectionné
    const targetDate = new Date(year, monthIndex, 1);
    
    // Logs pour faciliter le débogage
    console.log(`Navigating to: ${months[monthIndex]} ${year}`);
    
    try {
      // Pour les vues timeline, cette méthode est plus efficace que gotoDate
      // Elle fait défiler le calendrier jusqu'à la date/heure spécifiée
      calendarApi.scrollToTime({ days: targetDate.getDate() - 1, months: targetDate.getMonth(), years: targetDate.getFullYear() - calendarApi.getDate().getFullYear() });
      
      // Force un rendu
      setTimeout(() => {
        // Nous pouvons également essayer de manipuler directement le DOM si nécessaire
        const timelineBody = document.querySelector('.fc-timeline-body');
        if (timelineBody) {
          // Trouver tous les éléments d'en-tête de mois
          const headers = document.querySelectorAll('.fc-timeline-slot[data-date]');
          
          // Trouver l'élément correspondant au mois sélectionné
          let targetHeader = null;
          headers.forEach(header => {
            const headerDate = new Date(header.getAttribute('data-date'));
            if (headerDate.getMonth() === monthIndex) {
              targetHeader = header;
            }
          });
          
          // Si on a trouvé l'en-tête correspondant, faire défiler jusqu'à lui
          if (targetHeader) {
            const rect = targetHeader.getBoundingClientRect();
            const containerRect = timelineBody.getBoundingClientRect();
            
            // Calculer la position de défilement pour centrer l'élément
            const scrollLeft = rect.left + timelineBody.scrollLeft - containerRect.left - (containerRect.width / 2) + (rect.width / 2);
            
            // Animer le défilement
            timelineBody.scrollTo({
              left: scrollLeft,
              behavior: 'smooth'
            });
            
            console.log(`Scrolling to position: ${scrollLeft}`);
          }
        }
      }, 50);
    } catch (error) {
      console.error("Navigation error:", error);
      
      // Méthode de secours
      try {
        calendarApi.gotoDate(targetDate);
        console.log("Fallback navigation attempt");
      } catch (fallbackError) {
        console.error("Fallback navigation error:", fallbackError);
      }
    }
  };

  // Écouteur de changement de vue
  const handleViewChange = (viewInfo) => {
    setCalendarState(prev => ({ ...prev, currentView: viewInfo.view.type }));
  };

  // Ajouter un style pour le mois sélectionné
  useEffect(() => {
    // Ajouter une règle CSS pour la surbrillance des mois
    const style = document.createElement('style');
    style.textContent = `
      .highlighted-month {
        background-color: rgba(59, 130, 246, 0.1) !important;
        box-shadow: inset 0 0 0 2px #3b82f6 !important;
      }
      
      .month-button {
        transition: all 0.2s ease;
      }
      
      .month-button:hover {
        background-color: #e0e7ff;
        transform: translateY(-1px);
      }
      
      .month-button:active {
        transform: translateY(1px);
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div className="flex flex-col dashboard">
      {/* Nouveaux boutons de navigation par mois - toujours visibles */}
      {true && (
        <div className="month-navigation flex flex-wrap justify-center gap-2 mb-4 p-3 bg-gray-100 rounded shadow-sm">
          {months.map((month, index) => {
            // Déterminer si c'est le mois courant
            const today = new Date();
            const isCurrentMonth = today.getMonth() === index;
            
            return (
              <button
                key={month}
                className={`month-button px-3 py-1 text-sm ${isCurrentMonth ? 'bg-blue-100 border-blue-400 text-blue-800' : 'bg-white border-gray-300 text-gray-700'} border rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
                onClick={() => navigateToMonth(index)}
              >
                {month}
              </button>
            );
          })}
        </div>
      )}
      
      <div className="w-full p-4 calendar">
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
            left: 'prev,next today',
            center: 'title',
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
            // Met à jour la vue actuelle quand les dates ou la vue changent
            setCalendarState(prev => ({ ...prev, currentView: info.view.type }));
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
              // Griser la ligne entière de l'équipe
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
          eventDragStart={handleEventDragStart}
          eventDrop={handleEventDrop}
          drop={handleExternalDrop}
          select={handleDateClick}
          eventClick={handleCalendarEventClick}
          eventResize={handleEventResize}
          eventDragStop={handleEventDragStop}
          eventReceive={handleEventReceive}
        />
      </div>
      
      <div className="w-full mt-4">
        <TaskBoard
          dropZones={dropZones}
          dropZoneRefs={dropZoneRefs}
          externalTasks={boardTasks}
          handleExternalTaskClick={handleExternalTaskClick}
          onDeleteTask={handleDeleteTask}
          updateTaskStatus={updateTaskStatus}
        />
      </div>

      {/* Indicateur de changements non synchronisés */}
      {hasLocalChanges && (
        <div 
          className="fixed bottom-4 right-4 bg-yellow-100 p-2 rounded shadow cursor-pointer"
          onClick={syncChanges}
        >
          Changements non synchronisés. Cliquez pour synchroniser.
        </div>
      )}

      <TaskForm
        isOpen={calendarState.isFormOpen}
        onClose={() => setCalendarState((prev) => ({
          ...prev,
          isFormOpen: false,
          selectedTask: null,
          selectedDates: null,
        }))}
        selectedDates={calendarState.selectedDates}
        selectedTask={calendarState.selectedTask}
        resources={resources}
        statuses={statuses}
        onSubmit={handleTaskSubmit}
        isProcessing={calendarState.isProcessing}
      />
    </div>
  );
};