import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import resourceTimelinePlugin from '@fullcalendar/resource-timeline';
import interactionPlugin, { Draggable } from '@fullcalendar/interaction';
import frLocale from '@fullcalendar/core/locales/fr';
import { useCalendarData } from '../../hooks/useCalendarData';
import { useTaskHandlers } from '../../hooks/useTaskHandlers';
import { TaskForm } from '../Tasks/TaskForm';
import { TaskBoard } from '../Tasks/TaskBoard';
import { DateUtils } from '../../utils/dateUtils';
import { createTask, updateTask, deleteTask } from '../../services/api/taskService';
import { toast } from 'react-toastify';
import { ERROR_MESSAGES, TOAST_CONFIG } from '../../constants/constants';
import '../../style/CalendarView.css';

export const CalendarView = () => {
  const [calendarState, setCalendarState] = useState({
    showWeekends: true,
    isFormOpen: false,
    selectedDates: null,
    selectedTask: null,
    isProcessing: false,
  });

  const dropZones = useMemo(() => [
    { id: 'todo', statusId: '1', title: 'À faire' },
    { id: 'inProgress', statusId: '2', title: 'En cours' },
    { id: 'blocked', statusId: '3', title: 'Bloqué' },
    { id: 'done', statusId: '4', title: 'Terminé' }
  ], []);

  const dropZoneRefs = useRef(dropZones.map(() => React.createRef()));
  const { tasks, setTasks, resources, holidays, statuses, isLoading } = useCalendarData();
  const [externalTasks, setExternalTasks] = useState([]);
  const draggablesRef = useRef([]);
  const calendarRef = useRef(null);

  // Fonction pour obtenir l'API du calendrier
  const getCalendarAPI = useCallback(() => {
    if (!calendarRef.current) return null;
    return calendarRef.current.getApi();
  }, []);

  // Fonction pour mettre à jour un événement dans le calendrier
  const updateCalendarEvent = useCallback((updatedTask) => {
    const calendarApi = getCalendarAPI();
    if (!calendarApi) return false;

    try {
      // Trouver l'événement existant
      const existingEvent = calendarApi.getEventById(updatedTask.id.toString());
      
      // Si la tâche a un resourceId, elle doit être dans le calendrier
      if (updatedTask.resourceId) {
        if (existingEvent) {
          // Mettre à jour l'événement existant
          existingEvent.setProp('title', updatedTask.title);
          existingEvent.setStart(updatedTask.start);
          existingEvent.setEnd(updatedTask.end);
          existingEvent.setResources([updatedTask.resourceId.toString()]);
          
          // Mettre à jour les propriétés étendues
          if (updatedTask.extendedProps) {
            Object.keys(updatedTask.extendedProps).forEach(key => {
              existingEvent.setExtendedProp(key, updatedTask.extendedProps[key]);
            });
          }
        } else {
          // Créer un nouvel événement dans le calendrier
          calendarApi.addEvent({
            id: updatedTask.id.toString(),
            title: updatedTask.title,
            start: updatedTask.start,
            end: updatedTask.end,
            resourceId: updatedTask.resourceId.toString(),
            allDay: true,
            extendedProps: updatedTask.extendedProps || {}
          });
        }
      } else if (existingEvent) {
        // Si pas de resourceId mais l'événement existe, le supprimer du calendrier
        existingEvent.remove();
      }
      
      return true;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du calendrier:', error);
      return false;
    }
  }, [getCalendarAPI]);

  // Fonction pour supprimer un événement du calendrier
  const removeCalendarEvent = useCallback((taskId) => {
    const calendarApi = getCalendarAPI();
    if (!calendarApi) return false;

    try {
      const existingEvent = calendarApi.getEventById(taskId.toString());
      if (existingEvent) {
        existingEvent.remove();
      }
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'événement:', error);
      return false;
    }
  }, [getCalendarAPI]);

  // Implémentation améliorée de handleTaskSubmit qui met à jour directement le calendrier
  const handleTaskSubmit = useCallback(async (formData, taskId) => {
    if (!formData?.title) {
      toast.error(ERROR_MESSAGES.TITLE_REQUIRED, TOAST_CONFIG);
      return;
    }

    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);

    if (DateUtils.isHolidayOrWeekend(startDate, holidays) || 
        DateUtils.isHolidayOrWeekend(endDate, holidays)) {
      toast.error('Dates invalides (week-end ou jour férié)', TOAST_CONFIG);
      return;
    }

    try {
      setCalendarState(prev => ({ ...prev, isProcessing: true }));

      const taskData = {
        title: formData.title.trim(),
        description: (formData.description || '').trim(),
        start: formData.startDate,
        end: formData.endDate,
        resourceId: formData.resourceId ? parseInt(formData.resourceId, 10) : null,
        statusId: formData.statusId ? formData.statusId : null,
      };

      let updatedTask;
      
      if (taskId) {
        // Mise à jour d'une tâche existante
        updatedTask = await updateTask(taskId, taskData);
        
        // Mettre à jour l'état global des tâches
        setTasks(prevTasks => prevTasks.map(task => 
          task.id.toString() === updatedTask.id.toString() ? updatedTask : task
        ));
      } else {
        // Création d'une nouvelle tâche
        updatedTask = await createTask(taskData);
        
        // Ajouter à l'état global des tâches
        setTasks(prevTasks => [...prevTasks, updatedTask]);
      }

      // Mettre à jour directement le calendrier
      if (updatedTask) {
        updateCalendarEvent(updatedTask);
        
        setCalendarState(prev => ({
          ...prev,
          isFormOpen: false,
          selectedTask: null,
        }));

        toast.success(taskId ? 'Tâche mise à jour' : 'Tâche créée', TOAST_CONFIG);
      }
    } catch (error) {
      console.error('Erreur lors de la soumission du formulaire:', error);
      toast.error(error.message || ERROR_MESSAGES.SUBMIT_ERROR, TOAST_CONFIG);
    } finally {
      setCalendarState(prev => ({ ...prev, isProcessing: false }));
    }
  }, [holidays, setCalendarState, setTasks, updateCalendarEvent]);

  // Implémentation améliorée de handleDeleteTask qui supprime directement du calendrier
  const handleDeleteTask = useCallback(async (taskId) => {
    if (!taskId) {
      toast.error(ERROR_MESSAGES.TASK_ID_REQUIRED, TOAST_CONFIG);
      return;
    }

    try {
      setCalendarState(prev => ({ ...prev, isProcessing: true }));
      
      // Confirmation avant suppression
      if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette tâche ?")) {
        return;
      }
      
      // Appel à l'API pour supprimer la tâche
      await deleteTask(taskId);
      
      // Supprimer du calendrier
      removeCalendarEvent(taskId);
      
      // Mettre à jour l'état des tâches
      setTasks(prevTasks => prevTasks.filter(task => task.id.toString() !== taskId.toString()));
      
      // Fermer le formulaire si la tâche supprimée était en cours d'édition
      setCalendarState(prev => {
        if (prev.selectedTask && prev.selectedTask.id.toString() === taskId.toString()) {
          return {
            ...prev,
            isFormOpen: false,
            selectedTask: null,
          };
        }
        return prev;
      });
      
      toast.success('Tâche supprimée', TOAST_CONFIG);
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast.error(error.message || ERROR_MESSAGES.DELETE_ERROR, TOAST_CONFIG);
    } finally {
      setCalendarState(prev => ({ ...prev, isProcessing: false }));
    }
  }, [removeCalendarEvent, setCalendarState, setTasks]);

  // Utiliser le gestionnaire de tâches pour les autres fonctions
  const {
    handleDateClick,
    handleExternalTaskClick,
    handleCalendarEventClick,
    handleEventDragStop,
    handleEventDrop,
    handleExternalDrop,
    handleEventResize,
    handleEventReceive
  } = useTaskHandlers(
    setTasks,
    setCalendarState,
    tasks,
    externalTasks,
    dropZoneRefs,
    dropZones,
    holidays,
    calendarRef,
    updateCalendarEvent  // Passer la fonction de mise à jour du calendrier
  );

  // Formater les tâches du calendrier
  const formattedCalendarTasks = useMemo(() => {
    if (!tasks || !Array.isArray(tasks)) {
      return [];
    }

    return tasks
      .filter(task => task.resourceId)
      .map(task => ({
        id: task.id?.toString() || '',
        title: task.title,
        start: task.start,
        end: task.end,
        resourceId: task.resourceId?.toString(),
        allDay: task.allDay || true,
        extendedProps: {
          ...task.extendedProps,
          statusId: task.extendedProps?.statusId || task.statusId || '1'
        }
      }));
  }, [tasks]);

  // Formater les tâches externes (backlog)
  const formattedExternalTasks = useMemo(() => {
    if (!tasks || !Array.isArray(tasks)) {
      return [];
    }

    return tasks
      .filter(task => !task.resourceId)
      .map(task => ({
        id: task.id?.toString() || '',
        statusId: task.extendedProps?.statusId || task.statusId || '1',
        title: task.title
      }));
  }, [tasks]);

  useEffect(() => {
    setExternalTasks(formattedExternalTasks);
  }, [formattedExternalTasks]);

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
          const task = externalTasks.find(t => t.id === taskId);

          if (!task) return {};

          return {
            id: task.id,
            title: task.title,
            start: task.start || new Date(),
            end: task.end || new Date(new Date().getTime() + 24 * 60 * 60 * 1000),
            allDay: true,
            extendedProps: { ...task }
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
  }, [externalTasks, dropZones]);

  // Gestion de l'événement eventsSet pour synchroniser l'état React si nécessaire
  const handleEventsSet = useCallback((events) => {
    // Cette fonction est optionnelle - elle permet de synchroniser l'état React 
    // avec l'état interne de FullCalendar si vous en avez besoin
    console.log('Événements mis à jour dans le calendrier:', events);
  }, []);

  return (
    <div className="flex flex-col dashboard">
      <div className="w-full p-4 calendar">
        <FullCalendar
          ref={calendarRef}
          locale={frLocale}
          timeZone='local'
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
          events={formattedCalendarTasks}
          resources={resources}
          resourceAreaWidth="15%"
          slotDuration={{ days: 1 }}
          selectConstraint={{
            start: '00:00',
            end: '24:00'
          }}
          weekends={true}
          eventsSet={handleEventsSet}
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
          externalTasks={externalTasks}
          handleExternalTaskClick={handleExternalTaskClick}
          onDeleteTask={handleDeleteTask}
        />
      </div>

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