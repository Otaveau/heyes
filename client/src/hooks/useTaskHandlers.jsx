import { useCallback } from 'react';
import { updateTask, createTask } from '../services/api/taskService';
import { formatUTCDate } from '../utils/dateUtils';
import { TOAST_CONFIG, ERROR_MESSAGES, DEFAULT_TASK_DURATION } from '../constants/constants';
import { toast } from 'react-toastify';

export const useTaskHandlers = (setTasks, setCalendarState, statuses, tasks) => {

  // Gestionnaire de sélection de tâche (logique métier)
const handleTaskSelection = useCallback((taskData) => {
  if (!taskData?.id) {
    console.warn(ERROR_MESSAGES.INVALID_TASK);
    return;
  }

  const selectedTask = {
    id: taskData.id,
    title: taskData.title,
    start: taskData.start,
    end: taskData.end,
    description: taskData.description,
    resourceId: taskData.resourceId,
    statusId: taskData.statusId,
  };

  setCalendarState((prev) => ({
    ...prev,
    selectedTask,
    isFormOpen: true,
  }));
}, [setCalendarState]);

// Gestionnaire de clic sur l'événement du calendrier (logique UI)
const handleCalendarEventClick = useCallback((clickInfo) => {
  const task = tasks.find((t) => t.id === parseInt(clickInfo.event.id));
  
  if (!task) {
    console.warn('Tâche non trouvée:', clickInfo.event.id);
    return;
  }
  
  handleTaskSelection(task);
}, [handleTaskSelection, tasks]);

  const handleEventResize = useCallback(async (info, isProcessing) => {
    if (isProcessing) {
      info.revert();
      return;
    }

    try {
      setCalendarState((prev) => ({ ...prev, isProcessing: true }));

      const { event } = info;
      if (!event.start || !event.end) {
        throw new Error('Dates invalides');
      }

      const updatedData = {
        startDate: formatUTCDate(event.start),
        endDate: formatUTCDate(event.end),
      };

      await updateTask(event.id, updatedData);

      setTasks((prevTasks) => prevTasks.map((task) =>
        task.id === event.id
          ? { ...task, start: event.start, end: event.end }
          : task
      ));

      toast.success(`Tâche "${event.title}" redimensionnée`, TOAST_CONFIG);
    } catch (error) {
      console.error('Erreur de redimensionnement:', error);
      toast.error(ERROR_MESSAGES.RESIZE_ERROR, TOAST_CONFIG);
      info.revert();
    } finally {
      setCalendarState((prev) => ({ ...prev, isProcessing: false }));
    }
  }, [setCalendarState, setTasks]);

  // const handleEventDrop = useCallback(async (dropInfo, isProcessing) => {
  //   const { event } = dropInfo;

  //   if (!event?.start || !event?.end || isProcessing) return;

  //   try {
  //     event.setExtendedProp('isProcessing', true);
  //     setCalendarState((prev) => ({ ...prev, isProcessing: true }));

  //     const resourceId = event.getResources()[0]?.id;
  //     const isFromBacklog = event.extendedProps?.source === 'backlog';
  //     const statusId = isFromBacklog
  //       ? getStatusId('WIP', statuses)
  //       : event.extendedProps?.statusId;

  //     const existingTask = tasks.find((t) => t.id === parseInt(event.id, 10));

  //     const updatedData = {
  //       title: event.title,
  //       startDate: formatUTCDate(event.start),
  //       endDate: formatUTCDate(event.end),
  //       description: event.extendedProps?.description || existingTask?.description || '',
  //       ownerId: resourceId ? parseInt(resourceId, 10) : null,
  //       statusId: statusId,
  //     };

  //     const taskId = parseInt(event.id, 10);
  //     const result = await updateTask(taskId, updatedData);

  //     const updatedTask = {
  //       id: taskId,
  //       title: result.title,
  //       description: result.description,
  //       start: new Date(result.start_date || result.startDate),
  //       end: new Date(result.end_date || result.endDate),
  //       resourceId: result.owner_id || result.ownerId,
  //       statusId: result.status_id || result.statusId,
  //       extendedProps: {
  //         ...event.extendedProps,
  //         source: null, // Réinitialiser la source après le drop
  //       },
  //     };

  //     setTasks((prevTasks) =>
  //       prevTasks.map((task) => (task.id === taskId ? updatedTask : task))
  //     );

  //     const actionType = isFromBacklog ? 'planifiée' : 'mise à jour';
  //     toast.success(`Tâche "${result.title}" ${actionType}`, TOAST_CONFIG);
  //   } catch (error) {
  //     console.error('Erreur de déplacement:', error);
  //     toast.error(ERROR_MESSAGES.DROP_ERROR, TOAST_CONFIG);
  //     dropInfo.revert?.();
  //   } finally {
  //     event.setExtendedProp('isProcessing', false);
  //     setCalendarState((prev) => ({ ...prev, isProcessing: false }));
  //   }
  // }, [setCalendarState, setTasks, statuses, tasks]);

  // const handleDrop = useCallback((dropInfo) => {
  //   try {
  //     const draggedEl = dropInfo.draggedEl;
  //     const taskData = JSON.parse(draggedEl.dataset.event || draggedEl.getAttribute('data-event'));

  //     if (!taskData) {
  //       console.warn('Pas de données de tâche trouvées');
  //       return;
  //     }

  //     const event = {
  //       id: taskData.id.toString(),
  //       title: taskData.title,
  //       start: dropInfo.date,
  //       end: dropInfo.date,
  //       resourceId: dropInfo.resource?.id,
  //       extendedProps: {
  //         description: taskData.description,
  //         source: 'backlog',
  //         statusId: taskData.statusId,
  //         originalTask: taskData,
  //       },
  //     };

  //     dropInfo.view.calendar.addEvent(event);
  //     return false;
  //   } catch (error) {
  //     console.error('Erreur dans handleDrop:', error);
  //     return false;
  //   }
  // }, []);

  // const handleEventReceive = useCallback((info) => {
  //   if (!info.event || info.event.extendedProps?.isProcessing) {
  //     return;
  //   }

  //   const dropInfo = {
  //     event: info.event,
  //     oldResource: null,
  //     newResource: info.event.getResources()[0],
  //     oldEvent: null,
  //   };

  //   handleEventDrop(dropInfo, false);
  // }, [handleEventDrop]);

  const handleDateSelect = useCallback((selectInfo) => {

  
      const startDate = new Date(selectInfo.start);
      const endDate = selectInfo.end ? new Date(selectInfo.end) : new Date(startDate.getTime() + DEFAULT_TASK_DURATION);
      
      setCalendarState((prev) => {
        const newState = {
          ...prev,
          selectedDates: {
            start: startDate,
            end: endDate,
            resourceId: selectInfo.resource?.id,
          },
          isFormOpen: true,
        };
        console.log('New calendar state:', newState);
        return newState;
      });
      
      selectInfo.view.calendar.unselect();
    }, [setCalendarState]);


  const handleTaskSubmit = useCallback(async (formData, taskId) => {
    if (!formData?.title) {
      toast.error(ERROR_MESSAGES.TITLE_REQUIRED, TOAST_CONFIG);
      return;
    }

    try {
      setCalendarState((prev) => ({ ...prev, isProcessing: true }));

      const sanitizedFormData = {
        title: formData.title.trim(),
        description: (formData.description || '').trim(),
        start: new Date(formData.startDate),
        end: new Date(formData.endDate),
        resourceId: formData.resourceId ? parseInt(formData.resourceId, 10) : null,
        statusId: formData.statusId ? parseInt(formData.statusId, 10) : null,
      };

      const result = taskId
        ? await updateTask(taskId, sanitizedFormData)
        : await createTask(sanitizedFormData);

        const formattedTask = {
          id: result.id || taskId,
          title: result.title || sanitizedFormData.title,
          start: new Date(result.start_date || result.startDate || sanitizedFormData.start),
          end: new Date(result.end_date || result.endDate || sanitizedFormData.end),
          description: result.description || sanitizedFormData.description,
          resourceId: result.owner_id || result.ownerId || sanitizedFormData.resourceId,
          statusId: result.status_id || result.statusId || sanitizedFormData.statusId,
        };

      setTasks((prevTasks) => {
        const otherTasks = taskId ? prevTasks.filter((task) => task.id !== taskId) : prevTasks;
        return [...otherTasks, formattedTask];
      });

      setCalendarState((prev) => ({
        ...prev,
        isFormOpen: false,
        selectedTask: null,
      }));

      toast.success(taskId ? 'Tâche mise à jour' : 'Tâche créée', TOAST_CONFIG);
    } catch (error) {
      console.error('Erreur de sauvegarde:', error);
      toast.error(ERROR_MESSAGES.SAVE_ERROR, TOAST_CONFIG);
    } finally {
      setCalendarState((prev) => ({ ...prev, isProcessing: false }));
    }
  }, [setCalendarState, setTasks]);

  // const handleStatusUpdate = useCallback(async (taskId, statusId) => {
  //   if (!taskId || !statusId) return;

  //   try {
  //     setCalendarState((prev) => ({ ...prev, isProcessing: true }));

  //     const existingTask = tasks.find((t) => t.id === taskId);
  //     const updatedTask = await updateTaskStatus(taskId, statusId);

  //     setTasks((prevTasks) =>
  //       prevTasks.map((task) =>
  //         task.id === taskId
  //           ? {
  //               ...task,
  //               statusId: statusId,
  //               ownerId: updatedTask.owner_id,
  //               startDate: updatedTask.start_date,
  //               endDate: updatedTask.end_date,
  //             }
  //           : task
  //       )
  //     );

  //     toast.success(`Statut ${existingTask ? `de "${existingTask.title}"` : ''} mis à jour`, TOAST_CONFIG);
  //   } catch (error) {
  //     console.error('Erreur de mise à jour du statut:', error);
  //     toast.error(ERROR_MESSAGES.STATUS_UPDATE_ERROR, TOAST_CONFIG);
  //   } finally {
  //     setCalendarState((prev) => ({ ...prev, isProcessing: false }));
  //   }
  // }, [setCalendarState, setTasks, tasks]);





  return {
    handleDateSelect,
    handleTaskSubmit,
    handleCalendarEventClick,
    handleEventResize,
    // handleDrop,
    // handleEventReceive,
  };
};
