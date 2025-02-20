import { useCallback } from 'react';
import { ERROR_MESSAGES, TOAST_CONFIG } from '../constants/constants';
import { toast } from 'react-toastify';
import { useTaskOperations } from './useTaskOperations';
import { DateUtils } from '../utils/dateUtils';

export const useTaskHandlers = (
  setTasks,
  setCalendarState,
  tasks,
  externalTasks,
  dropZoneRefs,
  dropZones,
  setExternalTasks,
  holidays
) => {
  const { updateTask, createNewTask, handleTaskError } = useTaskOperations(setTasks, setExternalTasks);

  //Utils
  function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  // Handlers
  const handleTaskSelection = useCallback((taskData) => {
    if (!taskData?.id) {
      console.warn(ERROR_MESSAGES.INVALID_TASK);
      return;
    }

    setCalendarState(prev => ({
      ...prev,
      selectedTask: taskData,
      isFormOpen: true,
    }));
  }, [setCalendarState]);

  const handleCalendarEventClick = useCallback((clickInfo) => {
    const eventId = clickInfo.event.id;
    const task = tasks.find((t) => t.id.toString() === eventId.toString());

    if (task) {
      handleTaskSelection(task);
    } else {
      console.warn('Tâche non trouvée:', eventId);
    }
  }, [handleTaskSelection, tasks]);

  const handleEventResize = useCallback(async (info) => {
    if (info.isProcessing) {
      info.revert();
      return;
    }

    try {
      setCalendarState((prev) => ({ ...prev, isProcessing: true }));
      const { event } = info;
      const startDate = event.start;
      const endDate = event.end;

      if(DateUtils.isHolidayOrWeekend(startDate) || DateUtils.isHolidayOrWeekend(endDate)) {
        info.revert();
        return;
      }

      const updates = {
        title: event.title,
        start: startDate,
        end: endDate,
        resourceId: event._def.resourceIds[0],
        statusId: event._def.extendedProps.statusId,
        description: event._def.extendedProps.description
      };

      await updateTask(event.id, updates);
      toast.success(`Tâche "${event.title}" redimensionnée`, TOAST_CONFIG);
    } catch (error) {
      handleTaskError(error, ERROR_MESSAGES.RESIZE_ERROR, info.revert);
    } finally {
      setCalendarState((prev) => ({ ...prev, isProcessing: false }));
    }
  }, [setCalendarState, updateTask, handleTaskError]);

  const handleDateSelect = useCallback((selectInfo) => {
    const startDate = selectInfo.start;
    const endDate = addDays(startDate, 1);

    if(DateUtils.isHolidayOrWeekend(startDate) || DateUtils.isHolidayOrWeekend(endDate)) {
      toast.error('Impossible de créer une tâche sur un week-end ou jour férié');
      selectInfo.view.calendar.unselect();
      return;
    }

    setCalendarState(prev => ({
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

    const startDate = formData.startDate;
    const endDate = formData.endDate;

    if(DateUtils.isHolidayOrWeekend(startDate) || DateUtils.isHolidayOrWeekend(endDate)) {
      toast.error('Impossible de créer une tâche sur un week-end ou jour férié');
      return;
    }

    try {
      setCalendarState(prev => ({ ...prev, isProcessing: true }));

      const taskData = {
        title: formData.title.trim(),
        description: (formData.description || '').trim(),
        start: startDate,
        end: endDate,
        resourceId: formData.resourceId ? parseInt(formData.resourceId, 10) : null,
        statusId: formData.statusId ? formData.statusId : null,
      };

      if (taskId) {
        await updateTask(taskId, taskData);
      } else {
        await createNewTask(taskData);
      }

      setCalendarState(prev => ({
        ...prev,
        isFormOpen: false,
        selectedTask: null,
      }));

      toast.success(taskId ? 'Tâche mise à jour' : 'Tâche créée', TOAST_CONFIG);
    } catch (error) {
      handleTaskError(error, ERROR_MESSAGES.SAVE_ERROR);
    } finally {
      setCalendarState(prev => ({ ...prev, isProcessing: false }));
    }
  }, [setCalendarState, updateTask, createNewTask, handleTaskError]);

  const handleEventDrop = useCallback(async (dropInfo) => {
    const { event } = dropInfo;
    const taskId = parseInt(event.id);
    const existingTask = tasks.find(t => t.id === taskId);
    const resourceId = event._def.resourceIds[0];
    const statusId = event._def.extendedProps.statusId || existingTask?.statusId;
    const startDate = event.start;
    const endDate = event.end;

    if(DateUtils.isHolidayOrWeekend(startDate) || DateUtils.isHolidayOrWeekend(endDate)) {
      dropInfo.revert();
      return;
    }

    try {
      const updates = {
        ...existingTask,
        start: startDate,
        end: endDate,
        resourceId,
        statusId
      };

      await updateTask(taskId, updates);
    } catch (error) {
      handleTaskError(error, ERROR_MESSAGES.DROP_ERROR, dropInfo.revert);
    }
  }, [tasks, updateTask, handleTaskError]);

  const handleExternalDrop = useCallback(async (info) => {
    if (!info.draggedEl.parentNode) return;

    try {
      const taskId = info.draggedEl.getAttribute('data-task-id');
      const existingTask = externalTasks.find(t => t.id.toString() === taskId);

      if (!existingTask) {
        throw new Error(`Task with id ${taskId} not found in externalTasks`);
      }

      const startDate = info.date;
      const endDate = addDays(startDate, 1);

      const updates = {
        title: existingTask.title,
        description: existingTask.description || '',
        start: startDate,
        end: endDate,
        resourceId: info.resource?.id ? parseInt(info.resource.id) : null,
        statusId: '2'
      };

      await updateTask(parseInt(taskId), updates);
      toast.success(`Tâche "${existingTask.title}" déplacée vers le calendrier`, TOAST_CONFIG);
    } catch (error) {
      handleTaskError(error, ERROR_MESSAGES.DROP_ERROR);
      if (info.revert) info.revert();
    }
  }, [externalTasks, updateTask, handleTaskError]);

  const handleEventDragStop = useCallback((info) => {
    if (!dropZoneRefs?.current) {
      console.warn('dropZoneRefs.current is undefined');
      return;
    }

    const eventRect = info.jsEvent.target.getBoundingClientRect();

    dropZoneRefs.current.forEach((ref, index) => {
      if (!ref?.current) return;

      const dropZoneEl = ref.current;
      const dropZoneRect = dropZoneEl.getBoundingClientRect();

      const isWithinDropZone =
        eventRect.left >= dropZoneRect.left &&
        eventRect.right <= dropZoneRect.right &&
        eventRect.top >= dropZoneRect.top &&
        eventRect.bottom <= dropZoneRect.bottom;

      if (isWithinDropZone) {
        const taskId = parseInt(info.event.id);
        const task = tasks.find(t => t.id === taskId);

        if (!task) return;

        const updates = {
          ...task,
          start: info.event.start,
          end: info.event.end,
          statusId: dropZones[index].statusId,
          resourceId: null
        };

        updateTask(taskId, updates).catch(error => {
          handleTaskError(error, ERROR_MESSAGES.DROP_ERROR, info.revert);
        });
      }
    });
  }, [dropZoneRefs, dropZones, tasks, updateTask, handleTaskError]);

  const handleExternalTaskClick = useCallback((task) => {
    setCalendarState(prev => ({
      ...prev,
      isFormOpen: true,
      selectedTask: task,
      selectedDates: {
        start: task.start,
        end: task.end
      }
    }));
  }, [setCalendarState]);

  const handleEventReceive = useCallback((info) => {
    const taskId = parseInt(info.event.id);
    const resourceId = info.event._def.resourceIds[0];
    const startDate = info.event.start;
    const endDate = addDays(startDate, 1);

    if(DateUtils.isHolidayOrWeekend(startDate) || DateUtils.isHolidayOrWeekend(endDate)) {
      info.revert();
      return;
    }

    const task = externalTasks.find(t => t.id === taskId.toString());
    if (!task) return;

    const updates = {
      ...task,
      start: startDate,
      end: endDate,
      resourceId,
      statusId: '2'
    };

    updateTask(taskId, updates).catch(error => {
      handleTaskError(error, ERROR_MESSAGES.DROP_ERROR, info.revert);
    });
  }, [externalTasks, updateTask, handleTaskError]);

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