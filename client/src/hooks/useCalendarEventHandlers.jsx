import { useCallback } from 'react';
import { ERROR_MESSAGES, TOAST_CONFIG } from '../constants/constants';
import { toast } from 'react-toastify';
import { DateUtils } from '../utils/dateUtils';

export const useCalendarEventHandlers = (
  setCalendarState,
  tasks,
  updateTaskStatus,
  handleTaskUpdate,
  holidays
) => {
  // Sélection d'une tâche pour édition
  const handleTaskSelection = useCallback((taskData) => {
    if (!taskData?.id) {
      console.warn(ERROR_MESSAGES.INVALID_TASK);
      return;
    }

    setCalendarState(prev => ({
      ...prev,
      selectedTask: taskData,
      selectedDates: {
        start: taskData.start,
        end: taskData.end,
        resourceId: taskData.resourceId
      },
      isFormOpen: true,
    }));
  }, [setCalendarState]);

  // Clic sur un événement du calendrier
  const handleCalendarEventClick = useCallback((clickInfo) => {
    const eventId = clickInfo.event.id;
    const task = tasks.find((t) => t.id.toString() === eventId.toString());

    if (task) {
      handleTaskSelection(task);
    } else {
      console.warn('Tâche non trouvée:', eventId);
    }
  }, [handleTaskSelection, tasks]);

  // Sélection d'une date sur le calendrier
  const handleDateClick = useCallback((selectInfo) => {
    const startDate = selectInfo.start;

    setCalendarState(prev => ({
      ...prev,
      selectedDates: {
        start: startDate,
        end: startDate,
        resourceId: selectInfo.resource?.id,
      },
      isFormOpen: true,
    }));

    selectInfo.view.calendar.unselect();
  }, [setCalendarState]);

  // Déplacement d'un événement dans le calendrier
  const handleEventDrop = useCallback(async (dropInfo) => {
    const { event } = dropInfo;
    const startDate = event.start;
    const endDate = event.end || new Date(startDate.getTime() + 86400000);
    const exclusiveEndDate = endDate;
    const inclusiveEndDate = new Date(exclusiveEndDate);
    inclusiveEndDate.setDate(inclusiveEndDate.getDate() - 1);

    // Validation des dates
    if (!DateUtils.hasValidEventBoundaries(startDate, inclusiveEndDate, holidays)) {
      dropInfo.revert();
      toast.warning('Les dates de début et de fin doivent être des jours ouvrés', TOAST_CONFIG);
      return;
    }

    const taskId = event.id;
    const existingTask = tasks.find(t => t.id.toString() === taskId.toString());

    if (!existingTask) {
      console.warn(`Tâche avec l'ID ${taskId} introuvable`);
      dropInfo.revert();
      return;
    }

    const resourceId = event._def.resourceIds[0];

    // Préparer les mises à jour avec les deux formats de dates
    const updates = {
      title: event.title,
      start: startDate, // Date de début (toujours inclusive)
      end: endDate,   // Date de fin exclusive pour FullCalendar
      exclusiveEndDate: exclusiveEndDate, // Explicitement stocker la date exclusive
      resourceId,
      statusId: event._def.extendedProps.statusId || existingTask.extendedProps?.statusId,
      extendedProps: {
        statusId: event._def.extendedProps.statusId || existingTask.extendedProps?.statusId,
        inclusiveEndDate: inclusiveEndDate // Stocker la date inclusive dans les propriétés étendues
      }
    };

    await handleTaskUpdate(
      taskId,
      updates,
      {
        revertFunction: dropInfo.revert,
        successMessage: `Tâche "${event.title}" déplacée`
      }
    );
  }, [tasks, handleTaskUpdate, holidays]);

  // Redimensionnement d'un événement
  const handleEventResize = useCallback(async (info) => {

    const { event } = info;
    const startDate = event.start;
    const endDate = event.end || new Date(startDate.getTime() + 86400000);

    const exclusiveEndDate = endDate;
    const inclusiveEndDate = new Date(exclusiveEndDate);
    inclusiveEndDate.setDate(inclusiveEndDate.getDate() - 1);

    // Validation des dates avec la date de fin inclusive
    if (!DateUtils.hasValidEventBoundaries(startDate, inclusiveEndDate, holidays)) {
      info.revert();
      toast.warning('Les dates de début et de fin doivent être des jours ouvrés', TOAST_CONFIG);
      return;
    }

    const existingTask = tasks.find(task => task.id.toString() === event.id.toString());
    if (!existingTask) {
      console.warn(`Tâche avec l'ID ${event.id} introuvable`);
      info.revert();
      return;
    }
    // Préparer les mises à jour avec les deux formats de dates
    const updates = {
      start: startDate,
      end: endDate, 
      exclusiveEndDate: exclusiveEndDate,
      resourceId: event._def.resourceIds[0],
      statusId: event._def.extendedProps.statusId || existingTask.extendedProps?.statusId,
      extendedProps: {
        statusId: event._def.extendedProps.statusId || existingTask.extendedProps?.statusId,
        inclusiveEndDate: inclusiveEndDate // Stocker la date inclusive dans les propriétés étendues
      }
    };

    await handleTaskUpdate(
      event.id,
      updates,
      {
        revertFunction: info.revert,
        successMessage: `Tâche "${event.title}" redimensionnée`
      }
    );
  }, [handleTaskUpdate, holidays, tasks]);


  return {
    handleCalendarEventClick,
    handleDateClick,
    handleEventDrop,
    handleEventResize,
    handleTaskSelection
  };
};