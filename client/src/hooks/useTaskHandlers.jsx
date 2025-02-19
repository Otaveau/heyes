import { useCallback } from 'react';
import { updateTask, createTask } from '../services/api/taskService';
import { validateWorkingDates, prepareTaskUpdate } from '../utils/taskUtils';
import { TOAST_CONFIG, ERROR_MESSAGES, DEFAULT_TASK_DURATION } from '../constants/constants';
import { toast } from 'react-toastify';
import { DateUtils } from '../utils/dateUtils';

export const useTaskHandlers = (
  setTasks,
  setCalendarState,
  statuses,
  tasks,
  externalTasks,
  dropZoneRefs,
  dropZones,
  setExternalTasks,
  holidays
) => {

  // Utils
  const handleTaskError = useCallback((error, errorMessage, revertFn = null) => {
    console.error('Erreur:', error);
    toast.error(errorMessage, TOAST_CONFIG);
    if (revertFn) revertFn();
  }, []);

  const updateTaskState = useCallback((taskId, updates) => {
    setTasks(prevTasks =>
      prevTasks.map(task => task.id === taskId ? { ...task, ...updates } : task)
    );
  }, [setTasks]);

  const validateAndHandleDates = useCallback((startDate, endDate, revertFn) => {
    if (!validateWorkingDates(startDate, endDate, holidays)) {
      toast.error('Impossible de créer ou terminer une tâche sur un week-end ou jour férié');
      if (revertFn) revertFn();
      return false;
    }
    return true;
  }, [holidays]);


  // Handlers
  const handleTaskSelection = useCallback((taskData) => {
    if (!taskData?.id) {
      console.warn(ERROR_MESSAGES.INVALID_TASK);
      return;
    }

    setCalendarState(prev => ({
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


  const handleEventModification = useCallback(async (event, updates, revertFn) => {
    const taskId = parseInt(event.id);
    
    if (!validateAndHandleDates(updates.start, updates.end, revertFn)) {
      return;
    }

    try {
      const processedUpdates = prepareTaskUpdate(updates, updates.resourceId);
      await updateTask(taskId, processedUpdates);
      updateTaskState(taskId, processedUpdates);
      return true;
    } catch (error) {
      handleTaskError(error, ERROR_MESSAGES.UPDATE_ERROR, revertFn);
      return false;
    }
  }, [validateAndHandleDates, updateTaskState, handleTaskError]);



  const handleEventResize = useCallback(async (info) => {
    if (info.isProcessing) {
      info.revert();
      return;
    }

    setCalendarState(prev => ({ ...prev, isProcessing: true }));
    
    try {
      const { event } = info;
      const statusId = event._def.extendedProps.statusId || event.extendedProps?.statusId;
      const resourceId = event._def.resourceIds[0];
      const success = await handleEventModification(
        event,
        {
          title: event.title,
          start: event.start,
          end: event.end,
          statusId: statusId,
          resourceId: resourceId
        },
        info.revert
      );

      if (success) {
        toast.success(`Tâche "${event.title}" redimensionnée`, TOAST_CONFIG);
      }
    } finally {
      setCalendarState(prev => ({ ...prev, isProcessing: false }));
    }
  }, [handleEventModification, setCalendarState]);


  const handleDateSelect = useCallback((selectInfo) => {
    const startDate = new Date(selectInfo.start);
    const endDate = selectInfo.end
      ? new Date(selectInfo.end)
      : new Date(startDate.getTime() + DEFAULT_TASK_DURATION);
  
    if (!validateAndHandleDates(startDate, endDate, () => selectInfo.view.calendar.unselect())) {
      return;
    }
  
    setCalendarState(prev => ({
      ...prev,
      selectedDates: { start: startDate, end: endDate, resourceId: selectInfo.resource?.id },
      isFormOpen: true,
    }));
  
    selectInfo.view.calendar.unselect();
  }, [validateAndHandleDates, setCalendarState]);


  const handleTaskSubmit = useCallback(async (formData, taskId) => {
    if (!formData?.title) {
      toast.error(ERROR_MESSAGES.TITLE_REQUIRED, TOAST_CONFIG);
      return;
    }
  
    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);
  
    if (!validateAndHandleDates(startDate, endDate)) {
      return;
    }
  
    try {
      setCalendarState(prev => ({ ...prev, isProcessing: true }));
  
      const sanitizedFormData = {
        title: formData.title.trim(),
        description: (formData.description || '').trim(),
        start: startDate,
        end: endDate,
        resourceId: formData.resourceId ? parseInt(formData.resourceId, 10) : null,
        statusId: formData.statusId ? parseInt(formData.statusId, 10) : null,
      };
  
      const result = taskId
        ? await updateTask(taskId, sanitizedFormData)
        : await createTask(sanitizedFormData);
  
      const formattedTask = {
        id: result.id || taskId,
        ...sanitizedFormData,
        start: new Date(result.start_date || result.startDate || sanitizedFormData.start),
        end: new Date(result.end_date || result.endDate || sanitizedFormData.end),
      };
  
      updateTaskState(formattedTask.id, formattedTask);
      setCalendarState(prev => ({ ...prev, isFormOpen: false, selectedTask: null }));
      toast.success(taskId ? 'Tâche mise à jour' : 'Tâche créée', TOAST_CONFIG);
    } catch (error) {
      handleTaskError(error, ERROR_MESSAGES.SAVE_ERROR);
    } finally {
      setCalendarState(prev => ({ ...prev, isProcessing: false }));
    }
  }, [validateAndHandleDates, handleTaskError, updateTaskState, setCalendarState]);


  const handleEventRemove = useCallback(async (info, targetStatusId) => {
    const taskId = parseInt(info.event.id);
    const task = tasks.find(t => t.id === taskId);

    if (!task) return;

    try {

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const endOfDay = new Date(today);
      endOfDay.setHours(23, 59, 59, 999);

      const updatedTask = {
        ...task,
        resourceId: null,
        statusId: targetStatusId,
        start: today,
        end: endOfDay
      };

      await updateTask(taskId, updatedTask);
      setTasks(prevTasks =>
        prevTasks.map(t =>
          t.id === taskId ? updatedTask : t
        )
      );

      toast.success(`Tâche déplacée vers ${dropZones.find(zone => zone.statusId === targetStatusId)?.title}`);
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la tâche:', error);
      info.revert();
      toast.error('Erreur lors de la mise à jour de la tâche');
    }
  }, [tasks, setTasks, dropZones]);


  const handleEventDragStop = useCallback((info) => {
    // Ajout d'une vérification de sécurité
    if (!dropZoneRefs?.current) {
      console.warn('dropZoneRefs.current is undefined');
      return;
    }

    const eventRect = info.jsEvent.target.getBoundingClientRect();

    dropZoneRefs.current.forEach((ref, index) => {
      if (!ref?.current) return; // Vérification supplémentaire

      const dropZoneEl = ref.current;
      const dropZoneRect = dropZoneEl.getBoundingClientRect();

      if (
        eventRect.left >= dropZoneRect.left &&
        eventRect.right <= dropZoneRect.right &&
        eventRect.top >= dropZoneRect.top &&
        eventRect.bottom <= dropZoneRect.bottom
      ) {
        handleEventRemove(info, dropZones[index].statusId);
      }
    });
  }, [dropZoneRefs, dropZones, handleEventRemove]);



  const handleEventDrop = useCallback(async (dropInfo) => {
    const { event } = dropInfo;
    
    const title = event.title;
    const startDate = event.start;
    const endDate = event._def.extendedProps.end || event._instance.range.end;
    const resourceId = event._def.resourceIds[0];
  
    await handleEventModification(
      event,
      {
        title: title,
        start: startDate,
        end: endDate,
        resourceId
      },
      dropInfo.revert
    );
  }, [handleEventModification]);


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
  
      const success = await handleEventModification(
        { id: taskId },
        {
          ...existingTask,
          start: newStartDate,
          end: newEndDate,
          resourceId: info.resource?.id
        }
      );
  
      if (success) {
        updateTaskState(parseInt(taskId), existingTask);
      }
    } catch (error) {
      handleTaskError(error, ERROR_MESSAGES.DROP_ERROR);
    }
  }, [externalTasks, handleEventModification, handleTaskError, updateTaskState]);


  const handleExternalTaskClick = (task) => {
    setCalendarState(prev => ({
      ...prev,
      isFormOpen: true,
      selectedTask: task,
      selectedDates: {
        start: task.start,
        end: task.end
      }
    }));
  };


  const handleEventReceive = useCallback((info) => {
  const taskId = parseInt(info.event.id);
  const resourceId = info.event._def.resourceIds[0];
  const startDate = info.event.start;
  const endDate = info.event.end || new Date(info.event.start.getTime() + 24 * 60 * 60 * 1000);

  const task = externalTasks.find(t => t.id === taskId.toString());
  if (!task) return;

  handleEventModification(
    info.event,
    {
      ...task,
      resourceId,
      start: startDate,
      end: endDate,
      statusId: '2'
    },
    info.revert
  ).then(success => {
    if (success) {
      setExternalTasks(prevTasks => prevTasks.filter(t => t.id !== taskId.toString()));
    }
  });
}, [externalTasks, handleEventModification, setExternalTasks]);

  return {
    handleDateSelect,
    handleTaskSubmit,
    handleCalendarEventClick,
    handleEventResize,
    handleEventDrop,
    handleExternalDrop,
    handleEventDragStop,
    handleExternalTaskClick,
    handleEventReceive,
  };
};
