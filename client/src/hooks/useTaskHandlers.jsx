import { useCallback } from 'react';
import { ERROR_MESSAGES, TOAST_CONFIG } from '../constants/constants';
import { toast } from 'react-toastify';
import { createTask, updateTask, deleteTask } from '../services/api/taskService';
import { DateUtils } from '../utils/dateUtils';

export const useTaskHandlers = (
  setTasks,         
  setCalendarState,
  tasks,             
  calendarTasks,         
  boardTasks,         
  setCalendarTasks, 
  setBoardTasks,
  dropZoneRefs,
  dropZones,
  holidays,
  calendarRef,
  setHasLocalChanges 
) => {

  const updateTaskStatus = useCallback((taskId, updates) => {
    // Mettre à jour les tâches brutes
    setTasks(prevTasks => {
      const updatedTasks = prevTasks.map(task => {
        if (task.id.toString() === taskId.toString()) {
          const updatedTask = { 
            ...task,
            ...updates,
            extendedProps: {
              ...task.extendedProps,
              ...(updates.extendedProps || {})
            }
          };
          
          // Si statusId est fourni directement (pas dans extendedProps)
          if (updates.statusId) {
            updatedTask.extendedProps.statusId = updates.statusId;
          }
          
          return updatedTask;
        }
        return task;
      });
      
      // Mettre à jour les listes filtrées
      setTimeout(() => {
        const calendar = updatedTasks.filter(task => task.resourceId);
        const board = updatedTasks.filter(task => !task.resourceId);
        
        setCalendarTasks(calendar);
        setBoardTasks(board);
      }, 0);
      
      return updatedTasks;
    });
    
    // Indiquer que des changements locaux ont été effectués
    setHasLocalChanges(true);
    
    // Rafraîchir le calendrier si la référence existe
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.refetchEvents();
    }
  }, [setTasks, setCalendarTasks, setBoardTasks, setHasLocalChanges, calendarRef]);


  const handleTaskUpdate = useCallback(async (taskId, updates, options = {}) => {
    const { revertFunction = null, successMessage = null, skipApiCall = false } = options;
    try {
      setCalendarState((prev) => ({ ...prev, isProcessing: true }));

      const existingTask = tasks.find(task => task.id.toString() === taskId.toString());

      const completeUpdates = {
        ...updates,
        title: updates.title || existingTask.title
      };

      updateTaskStatus(taskId, completeUpdates);

      let apiResponse = completeUpdates;
      if (!skipApiCall) {
        apiResponse = await updateTask(taskId, completeUpdates);
      }

      if (successMessage) {
        toast.success(successMessage, TOAST_CONFIG);
      }

      return apiResponse;
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
  }, [setCalendarState, updateTaskStatus, tasks]);

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
      start: startDate,
      end: endDate,
      resourceId: event._def.resourceIds[0],
      extendedProps: {
        statusId: event._def.extendedProps.statusId || existingTask.extendedProps?.statusId,
        description: event._def.extendedProps.description || existingTask.extendedProps?.description
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
        extendedProps: {
          statusId: formData.statusId ? formData.statusId : null
        }
      };

      if (taskId) {
        updateTaskStatus(taskId, taskData);
      } else {
        // Pour une nouvelle tâche, créer un ID temporaire
        const tempId = `temp-${Date.now()}`;
        const newTask = {
          id: tempId,
          ...taskData,
          allDay: true
        };
        
        // Ajouter à l'état brut
        setTasks(prevTasks => [...prevTasks, newTask]);
        
        // Mettre à jour la liste appropriée
        if (newTask.resourceId) {
          setCalendarTasks(prev => [...prev, newTask]);
        } else {
          setBoardTasks(prev => [...prev, newTask]);
        }
        
        taskId = tempId;
      }

      // Appeler l'API
      let updatedTask;
      if (taskId && !taskId.toString().startsWith('temp-')) {
        updatedTask = await updateTask(taskId, taskData);
      } else {
        updatedTask = await createTask(taskData);
        
        // Si c'était un ID temporaire, mettre à jour avec l'ID réel
        if (taskId.toString().startsWith('temp-')) {
          // Remplacer la tâche avec ID temporaire par celle avec ID réel
          setTasks(prevTasks => prevTasks.map(task => 
            task.id === taskId ? { ...task, id: updatedTask.id } : task
          ));
          
          // Mettre à jour les listes filtrées
          setTimeout(() => {
            const calendar = tasks.filter(task => task.resourceId);
            const board = tasks.filter(task => !task.resourceId);
            
            setCalendarTasks(calendar);
            setBoardTasks(board);
          }, 0);
        }
      }

      setCalendarState(prev => ({
        ...prev,
        isFormOpen: false,
        selectedTask: null,
      }));

      // Réinitialiser le flag des changements locaux puisque tout est synchronisé
      setHasLocalChanges(false);
      
      toast.success(taskId && !taskId.toString().startsWith('temp-') ? 'Tâche mise à jour' : 'Tâche créée', TOAST_CONFIG);
    } catch (error) {
      toast.error(taskId ? ERROR_MESSAGES.UPDATE_FAILED : ERROR_MESSAGES.CREATE_FAILED, TOAST_CONFIG);
      console.error('Erreur lors de la soumission de la tâche:', error);
    } finally {
      setCalendarState(prev => ({ ...prev, isProcessing: false }));
    }
  }, [holidays, setCalendarState, setHasLocalChanges, updateTaskStatus, setCalendarTasks, setBoardTasks, setTasks, tasks]);


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
    const updates = {
      start: startDate,
      end: endDate,
      resourceId,
      extendedProps: {
        statusId: event._def.extendedProps.statusId || existingTask.extendedProps?.statusId
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


  // Dépôt d'une tâche externe sur le calendrier
  const handleExternalDrop = useCallback(async (info) => {
    if (!info.draggedEl.parentNode) return;

    const startDate = info.date;
    // Vérifier si la date tombe sur un jour non ouvré
    if (DateUtils.isHolidayOrWeekend(startDate, holidays)) {
      toast.warning('Impossible de planifier sur un jour non ouvré', TOAST_CONFIG);
      return;
    }

       // Récupérer les infos de l'événement externe
    const taskId = info.draggedEl.getAttribute('data-task-id');
    const externalTask = boardTasks.find(task => task.id.toString() === taskId.toString());
    
    if (!externalTask) return false;

      const endDate = new Date(startDate.getTime() + 86400000); // +1 jour

      const updates = {
        title: externalTask.title,
        description: externalTask.extendedProps?.description || '',
        start: startDate,
        end: endDate,
        resourceId: info.resource?.id ? parseInt(info.resource.id) : null,
        extendedProps: {
          statusId: '2' // En cours
        }
      };

      updateTaskStatus(taskId, updates);
    
    // Le déplacer du board vers le calendrier
    setBoardTasks(prev => prev.filter(t => t.id.toString() !== taskId.toString()));
    
    // Mettre à jour sur le serveur
    await handleTaskUpdate(
      taskId,
      updates,
      {
        successMessage: `Tâche "${externalTask.title}" déplacée vers le calendrier`,
        skipApiCall: false // Appeler l'API pour synchroniser
      }
    );
    
    return true;
  }, [holidays, boardTasks, updateTaskStatus, setBoardTasks, handleTaskUpdate]);


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
  
         const updates = {
          resourceId: null, // Important: retirer du calendrier
          extendedProps: {
            statusId: dropZones[index].statusId
          }
        };
        
        // Mettre à jour les états
        updateTaskStatus(taskId, updates);
        
        // Déplacer du calendrier vers le board
        setCalendarTasks(prev => prev.filter(t => t.id.toString() !== taskId.toString()));
        
        // Mettre à jour sur le serveur
        await handleTaskUpdate(
          taskId,
          updates,
          {
            successMessage: `Tâche déplacée vers ${dropZones[index].title}`,
            skipApiCall: false // Appeler l'API pour synchroniser
          }
        );
        
        break;
      }
    }
  
    // Si aucune zone de dépôt n'a été trouvée, on peut revenir à l'état initial
    if (!dropFound && info.revert) {
      info.revert();
    }
  }, [dropZoneRefs, tasks, dropZones, updateTaskStatus, setCalendarTasks, handleTaskUpdate]);

  
  // Clic sur une tâche externe
 const handleExternalTaskClick = useCallback((task) => {
    // Utiliser boardTasks pour trouver la tâche complète
    const fullTask = boardTasks.find(t => t.id.toString() === task.id.toString());
    
    if (!fullTask) return;
    
    setCalendarState(prev => ({
      ...prev,
      isFormOpen: true,
      selectedTask: {
        id: fullTask.id,
        title: fullTask.title,
        description: fullTask.extendedProps?.description || '',
        statusId: fullTask.extendedProps?.statusId || task.statusId || '1',
        resourceId: fullTask.resourceId || null,
        start: fullTask.start || new Date(),
        end: fullTask.end || new Date(new Date().getTime() + 24 * 60 * 60 * 1000)
      }
    }));
  }, [setCalendarState, boardTasks]);


  // Réception d'un événement externe
  const handleEventReceive = useCallback(async (info) => {
    // Cette fonction est appelée après handleExternalDrop,
    // elle pourrait être utilisée pour des traitements supplémentaires
    console.log('Event received:', info.event);
  }, []);


  // Suppression d'une tâche
 const handleDeleteTask = useCallback(async (taskId) => {
    try {
      setCalendarState(prev => ({ ...prev, isProcessing: true }));

      // Mettre à jour localement d'abord
      setTasks(prevTasks => prevTasks.filter(task => task.id.toString() !== taskId.toString()));
      setCalendarTasks(prev => prev.filter(t => t.id.toString() !== taskId.toString()));
      setBoardTasks(prev => prev.filter(t => t.id.toString() !== taskId.toString()));
      
      // Indiquer des changements locaux
      setHasLocalChanges(true);

      // Appel API pour supprimer la tâche
      await deleteTask(taskId);

      // Réinitialiser le flag des changements locaux
      setHasLocalChanges(false);
      
      toast.success('Tâche supprimée', TOAST_CONFIG);
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast.error(ERROR_MESSAGES.DELETE_FAILED, TOAST_CONFIG);
      return false;
    } finally {
      setCalendarState(prev => ({ ...prev, isProcessing: false }));
    }
  }, [setCalendarState, setTasks, setCalendarTasks, setBoardTasks, setHasLocalChanges]);


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
    handleDeleteTask,
    updateTaskStatus
  };
};