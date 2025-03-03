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
  holidays
) => {
  const { updateTask, createNewTask, handleTaskError } = useTaskOperations();

  const checkDatesValidity = useCallback((startDate, endDate) => {
    if (DateUtils.isHolidayOrWeekend(startDate, holidays) || DateUtils.isHolidayOrWeekend(endDate, holidays)) {
      toast.error('Impossible de créer ou modifier une tâche sur un week-end ou jour férié', TOAST_CONFIG);
      return false;
    }
    return true;
  }, [holidays]);

  // Gestionnaire de mise à jour synchronisée
  const handleTaskUpdate = useCallback(async (taskId, updatedTaskData, revertFunc) => {
    try {


      if (!checkDatesValidity(updatedTaskData.start, updatedTaskData.end)) {
        if (revertFunc) revertFunc();
        throw new Error('Dates invalides (week-end ou jour férié)');
      }
      const updatedTask = await updateTask(taskId, updatedTaskData);
      
      // Mise à jour locale des tâches
      setTasks(currentTasks => 
        currentTasks.map(task => 
          task.id === taskId ? updatedTask : task
        )
      );

      return updatedTask;
    } catch (error) {
      handleTaskError(error, null, revertFunc);
      throw error;
    }
  }, [checkDatesValidity, updateTask, setTasks, handleTaskError]);


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

      if (!checkDatesValidity(startDate, endDate)) {
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

      const updatedTask = await updateTask(event.id, updates);
    
      if (updatedTask) {
        // Mise à jour explicite de l'événement dans le calendrier
        const calendarApi = info.view.calendar;
        
        // Supprimer l'événement actuel
        event.remove();
        
        // Ajouter l'événement mis à jour
        calendarApi.addEvent({
          id: updatedTask.id,
          title: updatedTask.title,
          start: updatedTask.start,
          end: updatedTask.end,
          resourceId: updatedTask.resourceId,
          allDay: true,
          extendedProps: updatedTask.extendedProps
        });
        
        toast.success(`Tâche "${updatedTask.title}" redimensionnée`, TOAST_CONFIG);
      }
    } catch (error) {
      // Erreur déjà gérée dans handleTaskUpdate
      console.error('Erreur lors du redimensionnement:', error);
    } finally {
      setCalendarState((prev) => ({ ...prev, isProcessing: false }));
    }
  }, [checkDatesValidity, setCalendarState, updateTask]);


  const handleDateSelect = useCallback((selectInfo) => {
    const startDate = selectInfo.startStr;
    const endDate = startDate;

    if (!checkDatesValidity(startDate, endDate)) {
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
  }, [checkDatesValidity, setCalendarState]);


  const handleTaskSubmit = useCallback(async (formData, taskId) => {
    if (!formData?.title) {
      toast.error(ERROR_MESSAGES.TITLE_REQUIRED, TOAST_CONFIG);
      return;
    }

    const startDate = formData.startDate;
    const endDate = formData.endDate;

    if (!checkDatesValidity(startDate, endDate)) {
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

      let updatedTask;
      if (taskId) {
        updatedTask = await handleTaskUpdate(taskId, taskData);
      } else {
        updatedTask = await createNewTask(taskData);
        setTasks(prevTasks => [...prevTasks, updatedTask]);
      }

      setCalendarState(prev => ({
        ...prev,
        isFormOpen: false,
        selectedTask: null,
      }));

      toast.success(taskId ? 'Tâche mise à jour' : 'Tâche créée', TOAST_CONFIG);
    } catch (error) {
      // Erreur déjà gérée dans handleTaskUpdate ou createNewTask
    } finally {
      setCalendarState(prev => ({ ...prev, isProcessing: false }));
    }
  }, [checkDatesValidity, setCalendarState, handleTaskUpdate, createNewTask, setTasks]);


  const handleEventDrop = useCallback(async (dropInfo) => {
    const { event } = dropInfo;
    const taskId = parseInt(event.id);
    const existingTask = tasks.find(t => t.id === taskId);
    const resourceId = event._def.resourceIds[0];
    const statusId = event._def.extendedProps.statusId || existingTask?.statusId;
    const startDate = event.start;
    const endDate = event.end || startDate;

    if (!checkDatesValidity(startDate, endDate)) {
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

      await handleTaskUpdate(taskId, updates, dropInfo.revert);
    } catch (error) {
      console.warn('Failed to update task:', error);
    }
  }, [tasks, checkDatesValidity, handleTaskUpdate]);


  const handleExternalDrop = useCallback(async (info) => {
    if (!info.draggedEl.parentNode) return;

    try {
      const taskId = info.draggedEl.getAttribute('data-task-id');
      const existingTask = externalTasks.find(t => t.id.toString() === taskId);

      if (!existingTask) {
        throw new Error(`Task with id ${taskId} not found in externalTasks`);
      }

      const startDate = info.date;
      const endDate = startDate;

      if (!checkDatesValidity(startDate, endDate)) {
        info.revert();
        return;
      }

      const updates = {
        title: existingTask.title,
        description: existingTask.description || '',
        start: startDate,
        end: endDate,
        resourceId: info.resource?.id ? parseInt(info.resource.id) : null,
        statusId: '2'
      };

      await handleTaskUpdate(taskId, updates, info.revert);
    } catch (error) {
      console.warn('Failed to update task:', error);
    }
  }, [externalTasks, handleTaskUpdate, checkDatesValidity]);

  const handleEventDragStop = useCallback(async (info) => {
    if (!dropZoneRefs?.current) {
      console.warn('dropZoneRefs.current is undefined');
      return;
    }
  
    const eventRect = info.jsEvent.target.getBoundingClientRect();
    let dropFound = false;
  
    // Vérifier chaque zone de dépôt
    for (let index = 0; index < dropZoneRefs.current.length; index++) {
      const ref = dropZoneRefs.current[index];
      if (!ref?.current) continue;
  
      const dropZoneEl = ref.current;
      const dropZoneRect = dropZoneEl.getBoundingClientRect();
  
      const isWithinDropZone =
        eventRect.left >= dropZoneRect.left &&
        eventRect.right <= dropZoneRect.right &&
        eventRect.top >= dropZoneRect.top &&
        eventRect.bottom <= dropZoneRect.bottom;
  
      if (isWithinDropZone) {
        dropFound = true;
        const taskId = parseInt(info.event.id);
        const task = tasks.find(t => t.id === taskId);
  
        if (!task) {
          console.warn(`Task with id ${taskId} not found`);
          continue;
        }
  
        try {

          const startDate = info.event.start;
          const endDate = info.event.end || info.event.start;
          
          // Vérification des dates avant déplacement vers zone
          if (!checkDatesValidity(startDate, endDate)) {
            info.revert();
            break;
          }

          const updates = {
            ...task,
            start: info.event.start,
            end: info.event.end || info.event.start,
            statusId: dropZones[index].statusId,
            resourceId: null
          };
  
          await handleTaskUpdate(taskId, updates, info.revert);
          toast.success(`Tâche déplacée vers ${dropZones[index].title}`, TOAST_CONFIG);
          break;
        } catch (error) {
          console.warn('Failed to update task:', error);
          if (info.revert) info.revert();
        }
      }
    }
  
    // Si aucune zone de dépôt n'a été trouvée, on peut revenir à l'état initial
    if (!dropFound && info.revert) {
      info.revert();
    }
  }, [dropZoneRefs, tasks, checkDatesValidity, dropZones, handleTaskUpdate]);

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

  const handleEventReceive = useCallback(async (info) => {
    try {
      const taskId = parseInt(info.event.id);
      const resourceId = info.event._def.resourceIds[0];
      const startDate = info.event.start;
      const endDate = startDate;
  
      if (!checkDatesValidity(startDate, endDate)) {
        info.revert();
        return;
      }
  
      // Vérifier l'existence de la tâche
      const task = externalTasks.find(t => t.id === taskId.toString());
      if (!task) {
        console.warn(`Task with id ${taskId} not found in external tasks`);
        info.revert();
        return;
      }
  
      const updates = {
        ...task,
        start: startDate,
        end: endDate,
        resourceId,
        statusId: '2'
      };
  
      await handleTaskUpdate(taskId, updates, info.revert);
      toast.success(`Tâche "${task.title}" déplacée vers le calendrier`, TOAST_CONFIG);
  
    } catch (error) {
      console.warn('Failed to handle event receive:', error);
      if (info.revert) info.revert();
    }
  }, [checkDatesValidity, externalTasks, handleTaskUpdate]);

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