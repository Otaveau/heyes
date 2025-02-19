import { useCallback } from 'react';
import { updateTask, createTask } from '../services/api/taskService';
import { TaskUtils } from '../utils/taskUtils';
import { DateUtils } from '../utils/dateUtils';
import { TOAST_CONFIG, ERROR_MESSAGES, DEFAULT_TASK_DURATION } from '../constants/constants';
import { toast } from 'react-toastify';

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
  const handleTaskSelection = useCallback((taskData) => {
    if (!taskData?.id) {
      console.warn(ERROR_MESSAGES.INVALID_TASK);
      return;
    }
  
    setCalendarState(prev => ({
      ...prev,
      selectedTask: {
        id: taskData.id.toString(), // Conversion explicite en string
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
    // Conversion explicite en string pour la comparaison
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
      const statusId = event._def.extendedProps.statusId || event.extendedProps?.statusId;
      const isConge = event._def.extendedProps.isConge || event.title === 'CONGE';

      if (!TaskUtils.validateWorkingDates(event.start, event.end, holidays)) {
        info.revert();
        return;
      }

      const updates = TaskUtils.prepareTaskUpdate(
        {
          title: isConge ? 'CONGE' : event.title,
          start: event.start,
          end: event.end,
          ...event._def.extendedProps,
          isConge: isConge,
          statusId: statusId
        },
        event._def.resourceIds[0],
        statusId
      );

      await updateTask(event.id, updates);

      // Mettre à jour l'état local avec toutes les propriétés
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === parseInt(event.id)
            ? {
              ...task,
              ...updates,
              end: event.end,
              isConge: isConge,
              extendedProps: {
                ...task.extendedProps,
                ...updates,
                end: event.end,
              }
            }
            : task
        )
      );

      toast.success(`Tâche "${event.title}" redimensionnée`, TOAST_CONFIG);
    } catch (error) {
      handleTaskError(error, ERROR_MESSAGES.RESIZE_ERROR, info.revert);
    } finally {
      setCalendarState((prev) => ({ ...prev, isProcessing: false }));
    }
  }, [holidays, setCalendarState, setTasks]);


  const handleDateSelect = useCallback((selectInfo) => {
    const startDate = new Date(selectInfo.start);
    const endDate = selectInfo.end
      ? new Date(selectInfo.end)
      : new Date(startDate.getTime() + DEFAULT_TASK_DURATION);

    if (!TaskUtils.validateWorkingDates(startDate, endDate, holidays)) {
      toast.error('Impossible de créer ou terminer une tâche sur un week-end ou jour férié');
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
  }, [holidays, setCalendarState]);


  const handleTaskSubmit = useCallback(async (formData, taskId) => {
    if (!formData?.title) {
      toast.error(ERROR_MESSAGES.TITLE_REQUIRED, TOAST_CONFIG);
      return;
    }

    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);

    if (!TaskUtils.validateWorkingDates(startDate, endDate, holidays)) {
      toast.error('Impossible de créer ou terminer une tâche sur un week-end ou jour férié');
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

      setTasks(prevTasks => [
        ...prevTasks.filter(task => task.id !== taskId),
        formattedTask
      ]);

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
  }, [holidays, setCalendarState, setTasks]);


  const handleEventRemove = useCallback(async (info, targetStatusId) => {
    const taskId = parseInt(info.event.id);
    const task = tasks.find(t => t.id === taskId);

    if (!task) return;

    try {
      const updatedTask = {
        ...task,
        resourceId: null,
        statusId: targetStatusId,
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
    const taskId = parseInt(event.id);
    const existingTask = tasks.find(t => t.id === taskId);
    const resourceId = event._def.resourceIds[0];
    const statusId = event._def.extendedProps.statusId || existingTask.statusId;
    const startDate = event.start;
    const endDate = event._def.extendedProps.end || event._instance.range.end;

    if (!TaskUtils.validateWorkingDates(startDate, endDate, holidays)) {
      dropInfo.revert();
      return;
    }

    try {
      const updates = TaskUtils.prepareTaskUpdate({
        ...existingTask,
        start: event.start,
        end: event._def.extendedProps.end || event._instance.range.end
      },
        resourceId,
        statusId
      );

      await updateTask(taskId, updates);
      updateTaskState(taskId, updates, setTasks);
    } catch (error) {
      handleTaskError(error, ERROR_MESSAGES.DROP_ERROR, dropInfo.revert);
    }
  }, [tasks, holidays, setTasks]);


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
  
      if (!DateUtils.validateDateRange(newStartDate, newEndDate, holidays)) {
        return;
      }
  
      const numericId = parseInt(taskId, 10);
      
      // Création d'un objet de mise à jour complet
      const updates = {
        ...existingTask,
        id: numericId,
        title: existingTask.title,
        description: existingTask.description,
        start: newStartDate,
        end: newEndDate,
        resourceId: info.resource?.id || null,
        statusId: '2',
        // Assurez-vous que toutes les propriétés nécessaires sont présentes
        extendedProps: {
          description: existingTask.description,
          statusId: '2',
          resourceId: info.resource?.id || null
        }
      };
  
      // Mise à jour dans la base de données
      await updateTask(numericId, {
        title: updates.title,
        description: updates.description,
        start: updates.start,
        end: updates.end,
        resourceId: updates.resourceId,
        statusId: updates.statusId
      });
  
      // 1. D'abord retirer la tâche des tâches externes
      setExternalTasks(prevExternalTasks => 
        prevExternalTasks.filter(t => t.id.toString() !== taskId)
      );
  
      // 2. Ensuite mettre à jour les tâches du calendrier
      setTasks(prevTasks => {
        // Filtrer d'abord les tâches existantes avec le même ID
        const filteredTasks = prevTasks.filter(t => t.id.toString() !== taskId);
        // Puis ajouter la nouvelle tâche
        return [...filteredTasks, updates];
      });
      
      toast.success(`Tâche "${existingTask.title}" déplacée vers le calendrier`, TOAST_CONFIG);
    } catch (error) {
      handleTaskError(error, ERROR_MESSAGES.DROP_ERROR);
    }
  }, [externalTasks, holidays, setTasks, setExternalTasks]);
  



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

    if (!TaskUtils.validateWorkingDates(startDate, endDate, holidays)) {
      info.revert();
      return;
    }

    const task = externalTasks.find(t => t.id === taskId.toString());
    if (!task) return;

    const updates = TaskUtils.prepareTaskUpdate(
      {
        ...task,
        start: startDate,
        end: endDate
      },
      resourceId,
      '2'
    );

    updateTask(taskId, updates)
      .then(() => {
        setTasks(prevTasks => [...prevTasks, updates]);
        setExternalTasks(prevExternalTasks =>
          prevExternalTasks.filter(t => t.id !== taskId.toString())
        );
      })
      .catch(error => {
        console.error('Erreur lors de la mise à jour:', error);
        info.revert();
      });
  }, [holidays, externalTasks, setTasks, setExternalTasks]);


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
    handleEventDragStop,
    handleExternalTaskClick,
    handleEventReceive,
  };
};