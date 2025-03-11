import { useCallback, useRef, useEffect } from 'react';
import { ERROR_MESSAGES, TOAST_CONFIG } from '../constants/constants';
import { toast } from 'react-toastify';
import { createTask, updateTask, deleteTask } from '../services/api/taskService';
import { DateUtils } from '../utils/dateUtils';
import { 
  applyDragDropStyles, 
  cleanupDragDropStyles,
  highlightTaskBoard,
  cleanupAllHighlights
} from '../utils/dndUtils';


/**
 * Hook principal pour la gestion des tâches dans le calendrier et le TaskBoard
 */
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
  // Références pour les effets visuels
  const ghostElementRef = useRef(null);
  const dropTimeoutRef = useRef(null);


  // Appliquer les styles nécessaires au chargement
  useEffect(() => {
    // Injecter les styles CSS
    applyDragDropStyles();
    
    // Nettoyage au démontage
    return () => {
      cleanupAllHighlights(dropZoneRefs);
      if (ghostElementRef.current) {
        document.body.removeChild(ghostElementRef.current);
        ghostElementRef.current = null;
      }
    };
  }, [cleanupAllHighlights, dropZoneRefs]);

  // Gérer l'annulation du drag par touche Echap ou clic en dehors
  useEffect(() => {
    const handleDragCancel = () => {
      if (ghostElementRef.current) {
        if (ghostElementRef.current) {
          document.body.removeChild(ghostElementRef.current);
          ghostElementRef.current = null;
        }
        cleanupAllHighlights(dropZoneRefs);
        if (window.ghostMoveHandler) {
          document.removeEventListener('mousemove', window.ghostMoveHandler);
          window.ghostMoveHandler = null;
        }
      }
    };
    
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') handleDragCancel();
    };
    
    const handleMouseUp = () => {
      setTimeout(() => {
        if (ghostElementRef.current) {
          handleDragCancel();
        }
      }, 100);
    };
    
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [cleanupAllHighlights, dropZoneRefs]);

  

  // Mise à jour des listes de tâches filtrées
  const updateFilteredTasks = useCallback((updatedTasks) => {
    const calendar = updatedTasks.filter(task => task.resourceId);
    const board = updatedTasks.filter(task => !task.resourceId);
    setCalendarTasks(calendar);
    setBoardTasks(board);
    
    // Rafraîchir le calendrier si nécessaire
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.refetchEvents();
    }
  }, [calendarRef, setCalendarTasks, setBoardTasks]);


  // Fonction principale de mise à jour d'une tâche
  const updateTaskStatus = useCallback((taskId, updates) => {
    setTasks(prevTasks => {
      const updatedTasks = prevTasks.map(task => 
        task.id.toString() === taskId.toString() 
          ? {
              ...task,
              ...updates,
              extendedProps: {
                ...task.extendedProps,
                ...(updates.extendedProps || {})
              }
            }
          : task
      );

      // Mettre à jour les listes filtrées avec un délai minimal
      setTimeout(() => updateFilteredTasks(updatedTasks), 0);
      return updatedTasks;
    });

    // Indiquer que des changements locaux ont été effectués
    setHasLocalChanges(true);
  }, [setTasks, updateFilteredTasks, setHasLocalChanges]);


  // Mise à jour d'une tâche avec appel API
  const handleTaskUpdate = useCallback(async (taskId, updates, options = {}) => {
    const { revertFunction = null, successMessage = null, skipApiCall = false } = options;
    try {
      setCalendarState((prev) => ({ ...prev, isProcessing: true }));

      const existingTask = tasks.find(task => task.id.toString() === taskId.toString());
      const completeUpdates = {
        ...updates,
        title: updates.title || existingTask.title
      };

      // Mise à jour locale
      updateTaskStatus(taskId, completeUpdates);

      // Appel API si nécessaire
      let apiResponse = completeUpdates;
      if (!skipApiCall) {
        apiResponse = await updateTask(taskId, completeUpdates);
        setHasLocalChanges(false); // Réinitialiser le flag après synchronisation
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
  }, [setCalendarState, updateTaskStatus, tasks, setHasLocalChanges]);


  // Soumission du formulaire de tâche (création/modification)
  const handleTaskSubmit = useCallback(async (formData, taskId) => {
    if (!formData?.title) {
      toast.error(ERROR_MESSAGES.TITLE_REQUIRED, TOAST_CONFIG);
      return;
    }

    const startDate = formData.startDate;
    const endDate = formData.endDate;

    // Validation des dates
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

      // Modification ou création
      if (taskId) {
        updateTaskStatus(taskId, taskData);
      } else {
        // Création avec ID temporaire
        const tempId = `temp-${Date.now()}`;
        const newTask = { id: tempId, ...taskData, allDay: true };
        
        setTasks(prevTasks => [...prevTasks, newTask]);
        
        if (newTask.resourceId) {
          setCalendarTasks(prev => [...prev, newTask]);
        } else {
          setBoardTasks(prev => [...prev, newTask]);
        }
        
        taskId = tempId;
      }

      // Appel API
      let updatedTask;
      if (taskId && !taskId.toString().startsWith('temp-')) {
        updatedTask = await updateTask(taskId, taskData);
      } else {
        updatedTask = await createTask(taskData);
        
        // Mise à jour de l'ID temporaire
        if (taskId.toString().startsWith('temp-')) {
          setTasks(prevTasks => {
            const updatedTasks = prevTasks.map(task =>
              task.id === taskId ? { ...task, id: updatedTask.id } : task
            );
            
            setTimeout(() => updateFilteredTasks(updatedTasks), 0);
            return updatedTasks;
          });
        }
      }

      // Terminer et réinitialiser
      setCalendarState(prev => ({
        ...prev,
        isFormOpen: false,
        selectedTask: null,
      }));
      
      setHasLocalChanges(false);
      toast.success(taskId && !taskId.toString().startsWith('temp-') ? 'Tâche mise à jour' : 'Tâche créée', TOAST_CONFIG);
    } catch (error) {
      toast.error(taskId ? ERROR_MESSAGES.UPDATE_FAILED : ERROR_MESSAGES.CREATE_FAILED, TOAST_CONFIG);
      console.error('Erreur lors de la soumission de la tâche:', error);
    } finally {
      setCalendarState(prev => ({ ...prev, isProcessing: false }));
    }
  }, [holidays, setCalendarState, updateTaskStatus, setCalendarTasks, setBoardTasks, setTasks, setHasLocalChanges, updateFilteredTasks]);


  // Suppression d'une tâche
  const handleDeleteTask = useCallback(async (taskId) => {
    try {
      setCalendarState(prev => ({ ...prev, isProcessing: true }));
      
      // Mise à jour locale d'abord
      setTasks(prevTasks => prevTasks.filter(task => task.id.toString() !== taskId.toString()));
      setCalendarTasks(prev => prev.filter(t => t.id.toString() !== taskId.toString()));
      setBoardTasks(prev => prev.filter(t => t.id.toString() !== taskId.toString()));
      
      setHasLocalChanges(true);
      
      // Appel API
      await deleteTask(taskId);
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
    const task = calendarTasks.find((t) => t.id.toString() === eventId.toString());

    if (task) {
      handleTaskSelection(task);
    } else {
      console.warn('Tâche non trouvée:', eventId);
    }
  }, [handleTaskSelection, calendarTasks]);


  // Sélection d'une date sur le calendrier
  const handleDateClick = useCallback((selectInfo) => {
    const startDate = selectInfo.start;
    
    setCalendarState(prev => ({
      ...prev,
      selectedDates: {
        start: startDate,
        end: startDate,
        resourceId: selectInfo.resource?.id,
      },
      isFormOpen: true,
    }));

    selectInfo.view.calendar.unselect();
  }, [setCalendarState]);


  // Clic sur une tâche externe
  const handleExternalTaskClick = useCallback((task) => {
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


  // Mettre en surbrillance le TaskBoard
  const highlightTaskBoard = useCallback((isHighlighted) => {
    const taskBoardContainer = document.querySelector('.taskboard-container');
    if (taskBoardContainer) {
      if (isHighlighted) {
        taskBoardContainer.classList.add('taskboard-highlight');
      } else {
        taskBoardContainer.classList.remove('taskboard-highlight');
        taskBoardContainer.classList.remove('taskboard-highlight-intense');
      }
    }
  }, []);

  // Mettre à jour la surbrillance des zones de dépôt pendant le déplacement
  const highlightDropZonesOnDrag = useCallback((event) => {
    if (!ghostElementRef.current) return;
    
    const mouseX = event.clientX;
    const mouseY = event.clientY;
    let foundMatch = false;
    
    if (dropZoneRefs?.current) {
      dropZoneRefs.current.forEach(ref => {
        if (!ref?.current) return;
        
        const dropZoneEl = ref.current;
        const rect = dropZoneEl.getBoundingClientRect();
        
        const isOver = 
          mouseX >= rect.left && 
          mouseX <= rect.right && 
          mouseY >= rect.top && 
          mouseY <= rect.bottom;
        
        if (isOver) {
          dropZoneEl.classList.add('dropzone-active');
          foundMatch = true;
        } else {
          dropZoneEl.classList.remove('dropzone-active');
        }
      });
    }
    
    const taskBoardContainer = document.querySelector('.taskboard-container');
    if (taskBoardContainer && foundMatch) {
      taskBoardContainer.classList.add('taskboard-highlight-intense');
    } else if (taskBoardContainer) {
      taskBoardContainer.classList.remove('taskboard-highlight-intense');
    }
  }, [dropZoneRefs]);

  
  // Créer l'élément fantôme pour le glisser-déposer
  const createGhostElement = useCallback((info) => {
    if (ghostElementRef.current) {
      document.body.removeChild(ghostElementRef.current);
    }

    const ghostEl = document.createElement('div');
    ghostEl.className = 'task-ghost-element';
    
    const originalRect = info.el.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(info.el);
    
    ghostEl.innerHTML = `<div class="ghost-title">${info.event.title}</div>`;
    ghostEl.style.position = 'fixed';
    ghostEl.style.zIndex = '9999';
    ghostEl.style.pointerEvents = 'none';
    ghostEl.style.width = `${originalRect.width}px`;
    ghostEl.style.height = `${originalRect.height}px`;
    ghostEl.style.backgroundColor = computedStyle.backgroundColor || '#4a6cf7';
    ghostEl.style.color = computedStyle.color || 'white';
    ghostEl.style.borderRadius = computedStyle.borderRadius || '4px';
    ghostEl.style.padding = computedStyle.padding || '4px';
    ghostEl.style.opacity = '0.9';
    ghostEl.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
    ghostEl.style.transition = 'transform 0.05s ease';
    ghostEl.style.fontFamily = computedStyle.fontFamily;
    ghostEl.style.fontSize = computedStyle.fontSize;
    ghostEl.style.display = 'flex';
    ghostEl.style.alignItems = 'center';
    ghostEl.style.justifyContent = 'center';
    ghostEl.style.overflow = 'hidden';
    ghostEl.style.textOverflow = 'ellipsis';
    ghostEl.style.whiteSpace = 'nowrap';
    
    ghostEl.style.left = `${info.jsEvent.clientX + 15}px`;
    ghostEl.style.top = `${info.jsEvent.clientY + 15}px`;
    
    document.body.appendChild(ghostEl);
    ghostElementRef.current = ghostEl;
    
    const updateGhostPosition = (e) => {
      if (ghostElementRef.current) {
        ghostElementRef.current.style.left = `${e.clientX + 15}px`;
        ghostElementRef.current.style.top = `${e.clientY + 15}px`;
        
        highlightDropZonesOnDrag(e);
        
        ghostElementRef.current.style.transform = 'scale(1.05)';
        
        clearTimeout(dropTimeoutRef.current);
        dropTimeoutRef.current = setTimeout(() => {
          if (ghostElementRef.current) {
            ghostElementRef.current.style.transform = 'scale(1)';
          }
        }, 50);
      }
    };
    
    document.addEventListener('mousemove', updateGhostPosition);
    window.ghostMoveHandler = updateGhostPosition;
    
    return updateGhostPosition;
  }, [highlightDropZonesOnDrag]);

  // Animation de transition vers le TaskBoard
  const simulateImmediateAppearance = useCallback((taskId, targetDropZone) => {
    const dropZoneIndex = dropZones.findIndex(dz => dz.id === targetDropZone.id);
    const dropZoneRef = dropZoneRefs.current[dropZoneIndex];
    
    if (!dropZoneRef || !dropZoneRef.current || !ghostElementRef.current) return;
    
    const dropZoneRect = dropZoneRef.current.getBoundingClientRect();
    const ghostRect = ghostElementRef.current.getBoundingClientRect();
    
    const ghost = ghostElementRef.current;
    
    // Position cible centrée dans la zone
    const targetX = dropZoneRect.left + (dropZoneRect.width / 2) - (ghostRect.width / 2);
    const targetY = dropZoneRect.top + 10; 
    
    ghost.style.transition = 'left 0.2s ease, top 0.2s ease, opacity 0.2s ease, transform 0.2s ease';
    ghost.style.left = `${targetX}px`;
    ghost.style.top = `${targetY}px`;
    ghost.style.transform = 'scale(0.9)';
    
    // Créer un placeholder temporaire
    const placeholderTask = document.createElement('div');
    placeholderTask.className = 'fc-event temporary-task-placeholder';
    placeholderTask.setAttribute('data-task-id', taskId);
    placeholderTask.style.opacity = '0';
    placeholderTask.style.height = `${ghostRect.height}px`;
    placeholderTask.style.margin = '8px 0';
    placeholderTask.style.transition = 'opacity 0.2s ease';
    placeholderTask.innerText = ghostElementRef.current.innerText;
    
    dropZoneRef.current.appendChild(placeholderTask);
    
    setTimeout(() => placeholderTask.style.opacity = '1', 50);
    
    setTimeout(() => {
      ghost.style.opacity = '0';
      
      setTimeout(() => {
        if (ghostElementRef.current) {
          document.body.removeChild(ghostElementRef.current);
          ghostElementRef.current = null;
        }
        
        try {
          if (placeholderTask.parentNode) {
            placeholderTask.parentNode.removeChild(placeholderTask);
          }
        } catch (e) {
          console.log('Placeholder déjà supprimé par React');
        }
      }, 200);
    }, 180);
  }, [dropZones, dropZoneRefs]);


  // Vérifier si un événement est au-dessus d'une zone de dépôt
  const isEventOverDropZone = useCallback((eventPosition) => {
    if (!dropZoneRefs?.current) return null;
    
    // Réinitialiser les styles de toutes les zones
    dropZoneRefs.current.forEach(ref => {
      if (ref?.current) ref.current.classList.remove('active-drop-target');
    });
    
    // Vérifier chaque zone
    for (let index = 0; index < dropZoneRefs.current.length; index++) {
      const ref = dropZoneRefs.current[index];
      if (!ref?.current) continue;
      
      const dropZoneEl = ref.current;
      const rect = dropZoneEl.getBoundingClientRect();
      
      if (eventPosition.x >= rect.left && 
          eventPosition.x <= rect.right && 
          eventPosition.y >= rect.top && 
          eventPosition.y <= rect.bottom) {
        
        dropZoneEl.classList.add('active-drop-target');
        return { dropZone: dropZones[index] };
      }
    }
    
    return null;
  }, [dropZoneRefs, dropZones]);


  // Début du glisser-déposer
  const handleEventDragStart = useCallback((info) => {
    console.log('Début du glisser-déposer:', info.event.title);
    
    // Utiliser la fonction importée au lieu de la fonction locale
    highlightTaskBoard(true);
    
    createGhostElement(info);
    
    if (info.el) {
      info.el.style.opacity = '0';
    }
    
    if (dropZoneRefs?.current) {
      dropZoneRefs.current.forEach(ref => {
        if (ref?.current) {
          ref.current.classList.add('potential-drop-target');
        }
      });
    }
  }, [createGhostElement, dropZoneRefs, highlightTaskBoard]);


  // Préparation d'un événement pour le TaskBoard
  const prepareEventForTaskBoard = useCallback((event, targetDropZone) => {
    return { statusId: targetDropZone.statusId };
  }, []);

  
  // Fin du glisser-déposer
  const handleEventDragStop = useCallback(async (info) => {
    // Nettoyer tous les effets visuels
    highlightTaskBoard(false);
    cleanupAllHighlights(dropZoneRefs);
    
    if (window.ghostMoveHandler) {
      document.removeEventListener('mousemove', window.ghostMoveHandler);
      window.ghostMoveHandler = null;
    }
    
    if (info.el) {
      info.el.classList.remove('dragging-event');
      info.el.style.opacity = '1';
    }
    
    // Vérifier si l'événement est sur une zone de dépôt
    const eventPosition = {
      x: info.jsEvent.clientX,
      y: info.jsEvent.clientY
    };
    
    const dropTarget = isEventOverDropZone(eventPosition);
    
    if (dropTarget) {
      const { dropZone } = dropTarget;
      const taskId = info.event.id;
      const task = tasks.find(t => t.id.toString() === taskId.toString());
      
      if (!task) {
        console.warn(`Task with id ${taskId} not found`);
        return;
      }
      
      // Préparer l'événement et cacher l'original
      const customUpdates = prepareEventForTaskBoard(info.event, dropZone);
      
      if (info.el) info.el.style.display = 'none';
      info.event.remove();
      
      // Animer la transition vers le TaskBoard
      simulateImmediateAppearance(taskId, dropZone);
      
      // Préparer les mises à jour
      const updates = {
        resourceId: null,
        statusId: dropZone.statusId,
        extendedProps: {
          statusId: dropZone.statusId,
          ...customUpdates
        },
        title: task.title
      };
      
      // Mettre à jour l'état
      updateTaskStatus(taskId, updates);
      
      // Mise à jour sur le serveur
      try {
        await updateTask(taskId, updates);
        toast.success(`Tâche déplacée vers ${dropZone.title}`, TOAST_CONFIG);
        setHasLocalChanges(false);
      } catch (error) {
        console.error('Erreur lors de la mise à jour de la tâche:', error);
        toast.error(ERROR_MESSAGES.UPDATE_FAILED, TOAST_CONFIG);
      }
    }
  }, [highlightTaskBoard, dropZoneRefs, isEventOverDropZone, tasks, prepareEventForTaskBoard, simulateImmediateAppearance, updateTaskStatus, setHasLocalChanges]);


  // Déplacement d'un événement dans le calendrier
  const handleEventDrop = useCallback(async (dropInfo) => {
    const { event } = dropInfo;
    const startDate = event.start;
    const endDate = event.end || new Date(startDate.getTime() + 86400000);
    
    // Validation des dates
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

  // Redimensionnement d'un événement
  const handleEventResize = useCallback(async (info) => {
    if (info.isProcessing) {
      info.revert();
      return;
    }
    
    const { event } = info;
    const startDate = event.start;
    const endDate = event.end;
    
    // Validation des dates
    if (!DateUtils.hasValidEventBoundaries(startDate, endDate, holidays)) {
      info.revert();
      toast.warning('Les dates de début et de fin doivent être des jours ouvrés', TOAST_CONFIG);
      return;
    }
    
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

  // Dépôt d'une tâche externe sur le calendrier
  const handleExternalDrop = useCallback(async (info) => {
    if (info.draggedEl) {
      info.draggedEl.style.opacity = '0';
    }
    
    if (info.draggedEl.dataset.processed === 'true') {
      return;
    }
    
    info.draggedEl.dataset.processed = 'true';
    
    setTimeout(() => {
      if (info.draggedEl && info.draggedEl.dataset) {
        delete info.draggedEl.dataset.processed;
      }
    }, 100);
    
    if (!info.draggedEl.parentNode) return;
    
    const startDate = info.date;
    
    if (DateUtils.isHolidayOrWeekend(startDate, holidays)) {
      toast.warning('Impossible de planifier sur un jour non ouvré', TOAST_CONFIG);
      return;
    }
    
    const taskId = info.draggedEl.getAttribute('data-task-id');
    const externalTask = boardTasks.find(task => task.id.toString() === taskId.toString());
    
    if (!externalTask) return false;
    
    const endDate = new Date(startDate.getTime() + 86400000);
    
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
    
    setTimeout(() => {
      setBoardTasks(prev => prev.filter(t => t.id.toString() !== taskId.toString()));
      if (info.draggedEl) {
        info.draggedEl.style.opacity = '1';
      }
    }, 50);
    
    await handleTaskUpdate(
      taskId,
      updates,
      {
        successMessage: `Tâche "${externalTask.title}" droppée vers le calendrier`,
        skipApiCall: false
      }
    );
    
    return true;
  }, [holidays, boardTasks, updateTaskStatus, setBoardTasks, handleTaskUpdate]);

  // Réception d'un événement externe
  const handleEventReceive = useCallback((info) => {
    if (info.event.extendedProps.processed) {
      console.log('Événement déjà traité, ignorer');
      return;
    }
    info.event.setExtendedProp('processed', true);
    info.event.remove();
  }, []);

  // Retourner toutes les fonctions nécessaires
  return {
    handleDateClick,
    handleTaskSubmit,
    handleCalendarEventClick,
    handleEventResize,
    handleEventDrop,
    handleExternalDrop,
    handleEventDragStop,
    handleEventDragStart,
    handleExternalTaskClick,
    handleEventReceive,
    handleDeleteTask,
    updateTaskStatus
  };
};