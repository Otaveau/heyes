import { useCallback } from 'react';
import { updateTask, createTask } from '../services/api/taskService';
import { formatUTCDate } from '../utils/dateUtils';
import {
  TOAST_CONFIG,
  ERROR_MESSAGES,
  DEFAULT_TASK_DURATION,
  STATUS_IDS
} from '../constants/constants';
import { toast } from 'react-toastify';

export const useTaskHandlers = (setTasks, setCalendarState, statuses, tasks, externalTasks) => {

  const handleTaskSelection = useCallback((taskData) => {
    if (!taskData?.id) {
      console.warn(ERROR_MESSAGES.INVALID_TASK);
      return;
    }

    setCalendarState((prev) => ({
      ...prev,
      selectedTask: {
        id: taskData.id,
        title: taskData.title,
        start: taskData.start,
        end: taskData.end,
        description: taskData.description,
        resourceId: taskData.resourceId,
        statusId: taskData.statusId,
      },
      isFormOpen: true,
    }));
  }, [setCalendarState]);

 
  const handleCalendarEventClick = useCallback((clickInfo) => {
    const task = tasks.find((t) => t.id === parseInt(clickInfo.event.id));
    task ? handleTaskSelection(task) : console.warn('Tâche non trouvée:', clickInfo.event.id);
  }, [handleTaskSelection, tasks]);

  const handleEventResize = useCallback(async (info, isProcessing) => {
    if (isProcessing) {
      info.revert();
      return;
    }

    try {
      setCalendarState((prev) => ({ ...prev, isProcessing: true }));
      const { event } = info;
      
      const updates = prepareTaskUpdate({
        title: event.title,
        start: event.start,
        end: event.end
      });

      await updateTask(event.id, updates);
      updateTaskState(event.id, updates, setTasks);
      toast.success(`Tâche "${event.title}" redimensionnée`, TOAST_CONFIG);
    } catch (error) {
      handleTaskError(error, ERROR_MESSAGES.RESIZE_ERROR, info.revert);
    } finally {
      setCalendarState((prev) => ({ ...prev, isProcessing: false }));
    }
  }, [setCalendarState, setTasks]);

  
  const handleDateSelect = useCallback((selectInfo) => {
    const startDate = new Date(selectInfo.start);
    const endDate = selectInfo.end 
      ? new Date(selectInfo.end) 
      : new Date(startDate.getTime() + DEFAULT_TASK_DURATION);

    setCalendarState((prev) => ({
      ...prev,
      selectedDates: {
        start: startDate,
        end: endDate,
        resourceId: selectInfo.resource?.id,
      },
      isFormOpen: true,
    }));

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


  const handleEventDrop = useCallback(async (dropInfo) => {
    const { event } = dropInfo;
    const taskId = parseInt(event.id);
    const existingTask = tasks.find(t => t.id === taskId);
    const resourceId = event._def.resourceIds[0];

    try {
      const updates = prepareTaskUpdate({
        ...existingTask,
        start: event.start,
        end: event._def.extendedProps.end || event._instance.range.end
      }, resourceId);

      await updateTask(taskId, updates);
      updateTaskState(taskId, updates, setTasks);
    } catch (error) {
      handleTaskError(error, ERROR_MESSAGES.DROP_ERROR, dropInfo.revert);
    }
  }, [tasks, setTasks]);


  const handleExternalDrop = useCallback(async (info) => {
    if (!info.draggedEl.parentNode) return;

    try {
      const taskId = info.draggedEl.getAttribute('data-task-id');
      const existingTask = externalTasks.find(t => t.id.toString() === taskId);

      if (!existingTask) {
        throw new Error(`Task with id ${taskId} not found in externalTasks`);
      }

      const newStartDate = new Date(info.date);
      const newEndDate = existingTask.start && existingTask.end
        ? new Date(newStartDate.getTime() + (new Date(existingTask.end) - new Date(existingTask.start)))
        : new Date(newStartDate.getTime() + DEFAULT_TASK_DURATION);

      const updates = prepareTaskUpdate({
        ...existingTask,
        start: newStartDate,
        end: newEndDate
      }, info.resource?.id);

      const numericId = parseInt(taskId, 10);
      await updateTask(numericId, updates);
      updateTaskState(numericId, updates, setTasks);
    } catch (error) {
      handleTaskError(error, ERROR_MESSAGES.DROP_ERROR);
    }
  }, [externalTasks, setTasks]);

  

  const prepareTaskUpdate = (taskData, resourceId = null) => ({
    ...taskData,
    start: formatUTCDate(taskData.start),
    end: formatUTCDate(taskData.end),
    resourceId: resourceId ? parseInt(resourceId, 10) : null,
    statusId: STATUS_IDS.WIP,
    source: 'calendar',
    isCalendarTask: true
  });
  
  const handleTaskError = (error, errorMessage, revertFn = null) => {
    console.error('Erreur:', error);
    toast.error(errorMessage, TOAST_CONFIG);
    if (revertFn) revertFn();
  };
  
  const updateTaskState = (taskId, updates, setTasks) => {
    setTasks(prevTasks =>
      prevTasks.map(task => 
        task.id === taskId ? { ...task, ...updates } : task
      )
    );
  };


  return {
    handleDateSelect,
    handleTaskSubmit,
    handleCalendarEventClick,
    handleEventResize,
    handleEventDrop,
    handleExternalDrop,
    // handleDrop,
    // handleEventReceive,
  };
};
