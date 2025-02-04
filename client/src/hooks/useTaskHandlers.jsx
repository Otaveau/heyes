import { useCallback } from 'react';
import { updateTask } from '../services/api/taskService';
import { getStatusId } from '../utils/taskFormatters';
import { formatUTCDate } from '../utils/dateUtils';
import { TOAST_CONFIG } from '../constants/constants';
import { toast } from 'react-toastify';


export const useTaskHandlers = (setTasks, setCalendarState, statuses, tasks) => {

  const handleTaskClick = useCallback((task) => {
    if (!task?.id) {
      console.warn('Tentative de click sur une tâche invalide');
      return;
    }

    setCalendarState(prev => ({
      ...prev,
      selectedTask: {
        id: task.id,
        title: task.title,
        start: task.start,
        end: task.end,
        description: task.description,
        resourceId: task.resourceId,
        statusId: task.statusId
      },
      isFormOpen: true
    }));
  }, [setCalendarState]);

  const handleEventClick = useCallback((clickInfo, tasks) => {
    const task = tasks.find(t => t.id === parseInt(clickInfo.event.id));
    if (task) {
      handleTaskClick(task);
    } else {
      console.warn('Tâche non trouvée:', clickInfo.event.id);
    }
  }, [handleTaskClick]);

  const handleEventResize = useCallback(async (info, isProcessing) => {
    if (isProcessing) {
      info.revert();
      return;
    }

    try {
      setCalendarState(prev => ({ ...prev, isProcessing: true }));

      const { event } = info;
      if (!event.start || !event.end) {
        throw new Error('Dates invalides');
      }

      const updatedData = {
        startDate: formatUTCDate(event.start),
        endDate: formatUTCDate(event.end)
      };

      await updateTask(event.id, updatedData);

      setTasks(prevTasks => prevTasks.map(task =>
        task.id === event.id
          ? { ...task, start: event.start, end: event.end }
          : task
      ));

      toast.success(`Tâche "${event.title}" redimensionnée`, TOAST_CONFIG);
    } catch (error) {
      console.error('Erreur de redimensionnement:', error);
      toast.error('Erreur lors du redimensionnement', TOAST_CONFIG);
      info.revert();
    } finally {
      setCalendarState(prev => ({ ...prev, isProcessing: false }));
    }
  }, [setCalendarState, setTasks]);

  const handleEventDrop = useCallback(async (dropInfo, isProcessing, statuses, tasks, setTasks) => {

    const { event } = dropInfo;

    console.log('event :', event);

    if (!event?.start || !event?.end || isProcessing) return;

    try {
      event.setExtendedProp('isProcessing', true);
      setCalendarState(prev => ({ ...prev, isProcessing: true }));

      const resourceId = event.getResources()[0]?.id;
      const isFromBacklog = event.extendedProps?.source === 'backlog';
      const statusId = isFromBacklog
        ? getStatusId('WIP', statuses)
        : event.extendedProps?.statusId;

      // Vérifier si la tâche existe déjà dans le calendrier
      const existingTask = tasks.find(t => t.id === parseInt(event.id, 10));

      const updatedData = {
        title: event.title,
        startDate: formatUTCDate(event.start),
        endDate: formatUTCDate(event.end),
        description: event.extendedProps?.description || existingTask?.description || '',
        ownerId: resourceId ? parseInt(resourceId, 10) : null,
        statusId: statusId
      };

      const taskId = parseInt(event.id, 10);
      const result = await updateTask(taskId, updatedData);

      const updatedTask = {
        id: taskId,
        title: result.title,
        description: result.description,
        start: new Date(result.start_date || result.startDate),
        end: new Date(result.end_date || result.endDate),
        resourceId: result.owner_id || result.ownerId,
        statusId: result.status_id || result.statusId,
        extendedProps: {
          ...event.extendedProps,
          source: null // Réinitialiser la source après le drop
        }
      };

      setTasks(prevTasks =>
        prevTasks.map(task => task.id === taskId ? updatedTask : task)
      );

      const actionType = isFromBacklog ? 'planifiée' : 'mise à jour';
      toast.success(`Tâche "${result.title}" ${actionType}`, TOAST_CONFIG);
    } catch (error) {
      console.error('Erreur de déplacement:', error);
      toast.error('Erreur lors du déplacement', TOAST_CONFIG);
      dropInfo.revert?.();
    } finally {
      event.setExtendedProp('isProcessing', false);
      setCalendarState(prev => ({ ...prev, isProcessing: false }));
    }
  }, [setCalendarState]);

  const handleDrop = useCallback((dropInfo) => {
    console.log('TaskHandlers - handleDrop début:', dropInfo);
    try {
      const draggedEl = dropInfo.draggedEl;
      const taskInfo = draggedEl.dataset.taskInfo;
      console.log('TaskHandlers - taskInfo trouvé:', taskInfo);

      if (!taskInfo) {
        console.warn('TaskHandlers - Pas de taskInfo dans draggedEl');
        return;
      }

      const taskData = JSON.parse(taskInfo);
      console.log('TaskHandlers - taskData parsé:', taskData);

      const event = {
        id: taskData.id.toString(),
        title: taskData.title,
        start: dropInfo.date,
        end: dropInfo.date,
        resourceId: dropInfo.resource?.id,
        extendedProps: {
          description: taskData.description,
          source: 'backlog',
          statusId: taskData.statusId,
          originalTask: taskData
        }
      };

      console.log('TaskHandlers - Création event:', event);
      dropInfo.view.calendar.addEvent(event);
      return false;
    } catch (error) {
      console.error('TaskHandlers - Erreur dans handleDrop:', error);
      return false;
    }
  }, []);

  const handleEventReceive = useCallback((info) => {
    console.log('TaskHandlers - handleEventReceive début:', info);
    if (!info.event || info.event.extendedProps?.isProcessing) {
      console.log('TaskHandlers - Event déjà en cours de traitement ou invalide');
      return;
    }

    const dropInfo = {
      event: info.event,
      oldResource: null,
      newResource: info.event.getResources()[0],
      oldEvent: null
    };

    console.log('TaskHandlers - Appel handleEventDrop avec:', dropInfo);
    handleEventDrop(dropInfo, false, statuses, tasks, setTasks);
  }, [handleEventDrop, statuses, tasks, setTasks]);



  return {
    handleTaskClick,
    handleEventClick,
    handleEventResize,
    handleEventDrop,
    handleDrop,
    handleEventReceive
  };
};