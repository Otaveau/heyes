import { useCallback } from 'react';
import { updateTask } from '../services/api/taskService';
import { getStatusId } from '../utils/taskFormatters';
import { formatUTCDate } from '../utils/dateUtils';
import { TOAST_CONFIG } from '../constants/constants';
import { toast } from 'react-toastify';


export const useTaskHandlers = (setTasks, setCalendarState, statuses) => {
  
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
    if (!event?.start || !event?.end || event.extendedProps?.isProcessing) return;

    try {
      event.setExtendedProp('isProcessing', true);
      setCalendarState(prev => ({ ...prev, isProcessing: true }));

      const resourceId = event.getResources()[0]?.id;
      const statusType = event.extendedProps?.source === 'backlog' ? 'WIP' : event.extendedProps?.status;
      const statusId = event.extendedProps?.source === 'backlog' ? 
          getStatusId(statusType, statuses) : 
          event.extendedProps?.statusId;

      const updatedData = {
        title: event.title,
        startDate: formatUTCDate(event.start),
        endDate: formatUTCDate(event.end),
        description: event.extendedProps?.description || '',
        ownerId: parseInt(resourceId, 10),
        statusId: statusId
      };

      const taskId = parseInt(event.id, 10);
      await updateTask(taskId, updatedData);

      setTasks(prevTasks => {
        const taskExists = prevTasks.some(task => task.id === taskId);
        const updatedTask = {
          id: taskId,
          start: updatedData.startDate,
          end: updatedData.endDate,
          title: updatedData.title,
          description: updatedData.description,
          resourceId: updatedData.ownerId,
          statusId: updatedData.statusId,
          source: event.extendedProps?.source
        };

        return taskExists
          ? prevTasks.map(task => task.id === taskId ? updatedTask : task)
          : [...prevTasks, updatedTask];
      });

      toast.success(`Tâche "${updatedData.title}" mise à jour`, TOAST_CONFIG);
    } catch (error) {
      console.error('Erreur de déplacement:', error);
      toast.error('Erreur lors du déplacement', TOAST_CONFIG);
      dropInfo.revert?.();
    } finally {
      event.setExtendedProp('isProcessing', false);
      setCalendarState(prev => ({ ...prev, isProcessing: false }));
    }
  }, [setCalendarState]);

  return {
    handleTaskClick,
    handleEventClick,
    handleEventResize,
    handleEventDrop
  };
};