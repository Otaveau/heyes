import { useCallback } from 'react';
import { ERROR_MESSAGES, TOAST_CONFIG } from '../constants/constants';
import { toast } from 'react-toastify';
import { createTask, updateTask, deleteTask } from '../services/api/taskService';
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

  const handleTaskUpdate = useCallback(async (taskId, updates, options = {}) => {
    const { revertFunction = null, successMessage = null } = options;
    try {
      setCalendarState((prev) => ({ ...prev, isProcessing: true }));

      const existingTask = tasks.find(task => task.id.toString() === taskId.toString());

      const completeUpdates = {
        ...updates,
        title: updates.title || existingTask.title
      };

      const apiResponse = await updateTask(taskId, completeUpdates);

      // Créer un nouvel objet de tâche avec le format attendu par FullCalendar
      const updatedTask = {
        id: apiResponse.id || existingTask.id,
        title: apiResponse.title || completeUpdates.title,
        start: apiResponse.start || completeUpdates.start || existingTask.start,
        end: apiResponse.end || completeUpdates.end || existingTask.end,
        resourceId: (apiResponse.resourceId || completeUpdates.resourceId || existingTask.resourceId)?.toString(),
        allDay: true,
        extendedProps: {
          statusId: (apiResponse.statusId || completeUpdates.statusId || existingTask.extendedProps?.statusId)?.toString(),
          description: apiResponse.description || completeUpdates.description || existingTask.extendedProps?.description || '',
          // Conserver toutes les autres propriétés extended qui pourraient exister
          ...existingTask.extendedProps,
        }
      };

      // Mettre à jour l'état local des tâches avec une nouvelle référence
      setTasks(prevTasks => {
        const newTasks = prevTasks.map(task =>
          task.id.toString() === taskId.toString()
            ? updatedTask
            : task
        );
        console.log('Tasks state updated with new task data:', newTasks);
        return newTasks;
      });

      if (successMessage) {
        toast.success(successMessage, TOAST_CONFIG);
      }

      return updatedTask;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la tâche:', error);
      toast.error(ERROR_MESSAGES.UPDATE_FAILED, TOAST_CONFIG);

      if (revertFunction) {
        revertFunction();
      }
      return null;
    } finally {
      setCalendarState((prev) => ({ ...prev, isProcessing: false }));
    }
  }, [setCalendarState, setTasks, tasks]);


  // Sélection d'une tâche pour édition
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

  // Redimensionnement d'un événement
  const handleEventResize = useCallback(async (info) => {
    if (info.isProcessing) {
      info.revert();
      return;
    }

    const { event } = info;
    const startDate = event.start;
    const endDate = event.end;

    // Vérifier que l'événement commence et se termine sur des jours ouvrés
    if (!DateUtils.hasValidEventBoundaries(startDate, endDate, holidays)) {
      info.revert();
      toast.warning('Les dates de début et de fin doivent être des jours ouvrés', TOAST_CONFIG);
      return;
    }

    // Récupérer la tâche existante pour obtenir toutes ses propriétés
    const existingTask = tasks.find(task => task.id.toString() === event.id.toString());
    if (!existingTask) {
      console.warn(`Tâche avec l'ID ${event.id} introuvable`);
      info.revert();
      return;
    }

    const updates = {
      title: event.title || existingTask.title, // S'assurer que le titre est inclus
      start: startDate,
      end: endDate,
      resourceId: event._def.resourceIds[0],
      statusId: event._def.extendedProps.statusId || existingTask.statusId,
      description: event._def.extendedProps.description || existingTask.description
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

  // Sélection d'une date sur le calendrier
  const handleDateClick = useCallback((selectInfo) => {
    const startDate = selectInfo.start;
    const endDate = startDate;

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

  // Soumission du formulaire de tâche
  const handleTaskSubmit = useCallback(async (formData, taskId) => {
    if (!formData?.title) {
      toast.error(ERROR_MESSAGES.TITLE_REQUIRED, TOAST_CONFIG);
      return;
    }

    const startDate = formData.startDate;
    const endDate = formData.endDate;

    // Vérifier que les dates de début et fin sont des jours ouvrés
    if (!DateUtils.hasValidEventBoundaries(startDate, endDate, holidays)) {
      toast.warning('Les dates de début et de fin doivent être des jours ouvrés', TOAST_CONFIG);
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
        updatedTask = await updateTask(taskId, taskData);
        setTasks(prevTasks =>
          prevTasks.map(task =>
            task.id.toString() === taskId.toString() ? { ...task, ...updatedTask } : task
          )
        );
      } else {
        updatedTask = await createTask(taskData);
        setTasks(prevTasks => [...prevTasks, updatedTask]);
      }

      setCalendarState(prev => ({
        ...prev,
        isFormOpen: false,
        selectedTask: null,
      }));

      toast.success(taskId ? 'Tâche mise à jour' : 'Tâche créée', TOAST_CONFIG);
    } catch (error) {
      toast.error(taskId ? ERROR_MESSAGES.UPDATE_FAILED : ERROR_MESSAGES.CREATE_FAILED, TOAST_CONFIG);
      console.error('Erreur lors de la soumission de la tâche:', error);
    } finally {
      setCalendarState(prev => ({ ...prev, isProcessing: false }));
    }
  }, [setCalendarState, setTasks, holidays]);

  // Déplacement d'un événement
  const handleEventDrop = useCallback(async (dropInfo) => {
    const { event } = dropInfo;
    const startDate = event.start;
    const endDate = event.end || new Date(startDate.getTime() + 86400000); // +1 jour si pas de fin

    // Vérifier que l'événement commence et se termine sur des jours ouvrés
    if (!DateUtils.hasValidEventBoundaries(startDate, endDate, holidays)) {
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
    const statusId = event._def.extendedProps.statusId || existingTask.statusId;

    const updates = {
      start: startDate,
      end: endDate,
      resourceId,
      statusId,
      title: existingTask.title // Ajouter explicitement le titre
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

  // Dépôt d'une tâche externe sur le calendrier
  const handleExternalDrop = useCallback(async (info) => {
    if (!info.draggedEl.parentNode) return;

    const startDate = info.date;
    // Vérifier si la date tombe sur un jour non ouvré
    if (DateUtils.isHolidayOrWeekend(startDate, holidays)) {
      toast.warning('Impossible de planifier sur un jour non ouvré', TOAST_CONFIG);
      return;
    }

    try {
      const taskId = info.draggedEl.getAttribute('data-task-id');
      const existingTask = externalTasks.find(t => t.id.toString() === taskId);

      if (!existingTask) {
        throw new Error(`Task with id ${taskId} not found in externalTasks`);
      }

      const endDate = new Date(startDate.getTime() + 86400000); // +1 jour

      const updates = {
        title: existingTask.title,
        description: existingTask.description || '',
        start: startDate,
        end: endDate,
        resourceId: info.resource?.id ? parseInt(info.resource.id) : null,
        statusId: '2' // En cours
      };

      await handleTaskUpdate(
        taskId,
        updates,
        {
          successMessage: `Tâche "${existingTask.title}" déplacée vers le calendrier`
        }
      );
    } catch (error) {
      console.error('Erreur lors du dépôt externe:', error);
      toast.error(ERROR_MESSAGES.UPDATE_FAILED, TOAST_CONFIG);
    }
  }, [externalTasks, handleTaskUpdate, holidays]);

  // Arrêt du glisser-déposer d'un événement
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
        const taskId = info.event.id;
        const task = tasks.find(t => t.id.toString() === taskId.toString());

        if (!task) {
          console.warn(`Task with id ${taskId} not found`);
          continue;
        }

        const startDate = info.event.start;
        const endDate = info.event.end || info.event.start;

        const updates = {
          start: startDate,
          end: endDate,
          statusId: dropZones[index].statusId,
          resourceId: null
        };

        await handleTaskUpdate(
          taskId,
          updates,
          {
            successMessage: `Tâche déplacée vers ${dropZones[index].title}`
          }
        );
        break;
      }
    }

    // Si aucune zone de dépôt n'a été trouvée, on peut revenir à l'état initial
    if (!dropFound && info.revert) {
      info.revert();
    }
  }, [dropZoneRefs, tasks, dropZones, handleTaskUpdate]);

  // Clic sur une tâche externe
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

  // Réception d'un événement externe
  const handleEventReceive = useCallback(async (info) => {
    try {
      const taskId = info.event.id;
      const resourceId = info.event._def.resourceIds[0];
      const startDate = info.event.start;
      const endDate = new Date(startDate.getTime() + 86400000); // +1 jour par défaut

      // Vérifier si la date tombe sur un jour non ouvré
      if (DateUtils.isHolidayOrWeekend(startDate, holidays)) {
        info.revert();
        toast.warning('Impossible de planifier sur un jour non ouvré', TOAST_CONFIG);
        return;
      }

      // Vérifier l'existence de la tâche
      const task = externalTasks.find(t => t.id.toString() === taskId.toString());
      if (!task) {
        console.warn(`Task with id ${taskId} not found in external tasks`);
        info.revert();
        return;
      }

      const updates = {
        start: startDate,
        end: endDate,
        resourceId,
        statusId: '2' // En cours
      };

      await handleTaskUpdate(
        taskId,
        updates,
        {
          revertFunction: info.revert,
          successMessage: `Tâche "${task.title}" placée dans le calendrier`
        }
      );
    } catch (error) {
      console.error('Erreur lors de la réception d\'événement:', error);
      if (info.revert) info.revert();
    }
  }, [externalTasks, handleTaskUpdate, holidays]);

  // Suppression d'une tâche
  const handleDeleteTask = useCallback(async (taskId) => {
    try {
      setCalendarState(prev => ({ ...prev, isProcessing: true }));

      // Appel API pour supprimer la tâche
      await deleteTask(taskId);

      // Mettre à jour l'état local
      setTasks(prevTasks => prevTasks.filter(task => task.id.toString() !== taskId.toString()));

      toast.success('Tâche supprimée', TOAST_CONFIG);
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast.error(ERROR_MESSAGES.DELETE_FAILED, TOAST_CONFIG);
      return false;
    } finally {
      setCalendarState(prev => ({ ...prev, isProcessing: false }));
    }
  }, [setCalendarState, setTasks]);

  return {
    handleDateClick,
    handleTaskSubmit,
    handleCalendarEventClick,
    handleEventResize,
    handleEventDrop,
    handleExternalDrop,
    handleEventDragStop,
    handleExternalTaskClick,
    handleEventReceive,
    handleDeleteTask
  };
};