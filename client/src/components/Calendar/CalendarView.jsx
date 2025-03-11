import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import resourceTimelinePlugin from '@fullcalendar/resource-timeline';
import interactionPlugin, { Draggable } from '@fullcalendar/interaction';
import frLocale from '@fullcalendar/core/locales/fr';
import { useCalendarData } from '../../hooks/useCalendarData';
import { toast } from 'react-toastify';
import { TaskForm } from '../tasks/TaskForm';
import { TaskBoard } from '../tasks/TaskBoard';
import { DateUtils } from '../../utils/dateUtils';
import { useTaskHandlers } from '../../hooks/useTaskHandlers';
import '../../style/CalendarView.css';

// Configuration du toast (si non définie ailleurs)
const TOAST_CONFIG = {
  position: "top-right",
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true
};

export const CalendarView = () => {
  // État principal du calendrier
  const [calendarState, setCalendarState] = useState({
    showWeekends: true,
    isFormOpen: false,
    selectedDates: null,
    selectedTask: null,
    isProcessing: false,
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

    console.log ('tasks :', tasks);
    
    // Séparer les tâches en deux groupes
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
    setTasks,           // Pour mettre à jour les tâches brutes
    setCalendarState,      // Pour gérer l'état du calendrier
    tasks,              // Toutes les tâches
    calendarTasks,         // Tâches filtrées pour le calendrier
    boardTasks,            // Tâches filtrées pour le TaskBoard
    setCalendarTasks,      // Pour mettre à jour les tâches du calendrier
    setBoardTasks,         // Pour mettre à jour les tâches du TaskBoard
    dropZoneRefs,          // Références aux zones de dépôt
    dropZones,             // Configuration des zones
    holidays,              // Jours fériés
    calendarRef,
    setHasLocalChanges           // Référence au calendrier
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

  return (
    <div className="flex flex-col dashboard">
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
          resourceGroupField="team" // Activer le regroupement par le champ parentId
          resourcesInitiallyExpanded={true} // Les groupes sont développés par défaut
          resourceLabelDidMount={(info) => {
            if (!info.resource.extendedProps?.team) {
              info.el.style.fontWeight = 'bold';
              info.el.style.backgroundColor = '#f3f4f6';
              info.el.style.borderBottom = '1px solid #e5e7eb';
              info.el.style.color = '#4b5563';
            }
          }}
          slotDuration={{ days: 1 }}
          selectConstraint={{
            start: '00:00',
            end: '24:00'
          }}
          weekends={true}
          eventAllow={(dropInfo) => {
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