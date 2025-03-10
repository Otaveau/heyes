import { useCallback, useRef, useEffect } from 'react';
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

  const ghostElementRef = useRef(null);
  const dropTimeoutRef = useRef(null);

  const highlightDropZonesOnDrag = useCallback((event) => {
    // Si le drag n'est pas en cours, ne rien faire
    if (!ghostElementRef.current) return;
    
    // Position du curseur
    const mouseX = event.clientX;
    const mouseY = event.clientY;
    
    let foundMatch = false;
    
    // Vérifier chaque zone de dépôt
    if (dropZoneRefs?.current) {
      dropZoneRefs.current.forEach(ref => {
        if (!ref?.current) return;
        
        const dropZoneEl = ref.current;
        const rect = dropZoneEl.getBoundingClientRect();
        
        // Vérifier si le curseur est au-dessus de cette zone
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
    
    // Mettre à jour l'état global du TaskBoard
    const taskBoardContainer = document.querySelector('.taskboard-container');
    if (taskBoardContainer) {
      // Si le curseur est au-dessus d'une zone, accentuer la surbrillance du TaskBoard
      if (foundMatch) {
        taskBoardContainer.classList.add('taskboard-highlight-intense');
      } else {
        taskBoardContainer.classList.remove('taskboard-highlight-intense');
      }
    }
  }, [dropZoneRefs]);

  const applyDragDropStyles = useCallback(() => {
    // Vérifier si les styles sont déjà ajoutés
    let styleElement = document.getElementById('drag-drop-styles');

    if (!styleElement) {
      // Créer un élément de style
      styleElement = document.createElement('style');
      styleElement.id = 'drag-drop-styles';
      styleElement.textContent = `
        /* Transitions fluides pour les éléments du TaskBoard */
        .fc-event {
          transition: opacity 0.2s ease, transform 0.2s ease;
        }

        .taskboard-highlight {
          box-shadow: 0 0 0 2px rgba(74, 108, 247, 0.5), 0 0 15px rgba(74, 108, 247, 0.4);
          border-radius: 8px;
          animation: pulse-border 1.5s infinite ease-in-out;
          transition: all 0.3s ease-in-out;
        }

        @keyframes pulse-border {
          0% {
            box-shadow: 0 0 0 2px rgba(74, 108, 247, 0.5), 0 0 15px rgba(74, 108, 247, 0.4);
          }
          50% {
            box-shadow: 0 0 0 4px rgba(74, 108, 247, 0.6), 0 0 20px rgba(74, 108, 247, 0.5);
          }
          100% {
            box-shadow: 0 0 0 2px rgba(74, 108, 247, 0.5), 0 0 15px rgba(74, 108, 247, 0.4);
          }
        }
        
        /* Élément fantôme */
        .task-ghost-element {
          font-weight: bold;
          border: 2px solid rgba(74, 108, 247, 0.7);
          transform-origin: center center;
        }
        
        /* Animation d'apparition dans le TaskBoard */
        .task-added {
          animation: taskAddedAnimation 0.5s ease-in-out;
        }
        
        /* Placeholder temporaire */
        .temporary-task-placeholder {
          background-color: rgba(74, 108, 247, 0.2);
          border: 2px dashed rgba(74, 108, 247, 0.7);
          border-radius: 4px;
          box-shadow: none;
        }
      `;

      // Ajouter l'élément au head du document
      document.head.appendChild(styleElement);
    }
  }, []);

  const highlightTaskBoard = useCallback((isHighlighted) => {
    // Sélectionner le conteneur du TaskBoard (ajustez le sélecteur selon votre structure)
    const taskBoardContainer = document.querySelector('.taskboard-container');

    if (taskBoardContainer) {
      if (isHighlighted) {
        // Ajouter une classe pour la surbrillance
        taskBoardContainer.classList.add('taskboard-highlight');
      } else {
        // Retirer la classe de surbrillance
        taskBoardContainer.classList.remove('taskboard-highlight');
      }
    }
  }, []);


  useEffect(() => {
    applyDragDropStyles();
  }, [applyDragDropStyles]);


  const updateTaskStatus = useCallback((taskId, updates) => {

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

          console.log('updatedTask :', updatedTask);

          // if (updates.statusId) {
          //   updatedTask.extendedProps.statusId = updates.statusId;
          // }

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
    const task = calendarTasks.find((t) => t.id.toString() === eventId.toString());

    if (task) {
      handleTaskSelection(task);
    } else {
      console.warn('Tâche non trouvée:', eventId);
    }
  }, [handleTaskSelection, calendarTasks]);


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
          setTasks(prevTasks => {
            const updatedTasks = prevTasks.map(task =>
              task.id === taskId ? { ...task, id: updatedTask.id } : task
            );

            // Mettre à jour les listes filtrées
            setTimeout(() => {
              const calendar = updatedTasks.filter(task => task.resourceId);
              const board = updatedTasks.filter(task => !task.resourceId);

              setCalendarTasks(calendar);
              setBoardTasks(board);
            }, 0);

            return updatedTasks;
          });
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
  }, [holidays, setCalendarState, setHasLocalChanges, updateTaskStatus, setCalendarTasks, setBoardTasks, setTasks]);


  // Déplacement d'un événement
  const handleEventDrop = useCallback(async (dropInfo) => {
    console.log('handleEventDrop');

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

    if (info.draggedEl) {
      info.draggedEl.style.opacity = '0';
    }


    if (info.draggedEl.dataset.processed === 'true') {
      return;
    }

    if (info.draggedEl) {
      info.draggedEl.style.opacity = '0';
    }

    info.draggedEl.dataset.processed = 'true';

    // Nettoyer le flag après un court délai
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
    setTimeout(() => {
      setBoardTasks(prev => prev.filter(t => t.id.toString() !== taskId.toString()));
    }, 50);

    setTimeout(() => {
      if (info.draggedEl) {
        info.draggedEl.style.opacity = '1';
      }
    }, 100);

    // Mettre à jour sur le serveur
    await handleTaskUpdate(
      taskId,
      updates,
      {
        successMessage: `Tâche "${externalTask.title}" droppée vers le calendrier`,
        skipApiCall: false // Appeler l'API pour synchroniser
      }
    );

    return true;
  }, [holidays, boardTasks, updateTaskStatus, setBoardTasks, handleTaskUpdate]);


  const createGhostElement = useCallback((info) => {
    // Supprimer tout élément fantôme existant
    if (ghostElementRef.current) {
      document.body.removeChild(ghostElementRef.current);
    }

    // Créer un élément fantôme qui suivra le curseur
    const ghostEl = document.createElement('div');
    ghostEl.className = 'task-ghost-element';

    // Copier le contenu et le style de l'élément original pour plus de réalisme
    const originalRect = info.el.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(info.el);

    // Appliquer des styles avancés pour une apparence plus réaliste
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

    // Positionner initialement près du curseur
    ghostEl.style.left = `${info.jsEvent.clientX + 15}px`;
    ghostEl.style.top = `${info.jsEvent.clientY + 15}px`;

    // Ajouter l'élément au body
    document.body.appendChild(ghostEl);

    // Stocker une référence à l'élément
    ghostElementRef.current = ghostEl;


    // Configurer le gestionnaire de mouvements de souris
    const updateGhostPosition = (e) => {
      if (ghostElementRef.current) {
        ghostElementRef.current.style.left = `${e.clientX + 15}px`;
        ghostElementRef.current.style.top = `${e.clientY + 15}px`;

        highlightDropZonesOnDrag(e);

        // Effet de zoom pendant le déplacement
        ghostElementRef.current.style.transform = 'scale(1.05)';

        // Annuler l'effet de zoom après un court délai
        clearTimeout(dropTimeoutRef.current);
        dropTimeoutRef.current = setTimeout(() => {
          if (ghostElementRef.current) {
            ghostElementRef.current.style.transform = 'scale(1)';
          }
        }, 50);
      }
    };

    // Ajouter le gestionnaire d'événements
    document.addEventListener('mousemove', updateGhostPosition);

    // Stocker le gestionnaire pour le supprimer plus tard
    return updateGhostPosition;
  }, [highlightDropZonesOnDrag]);


  const removeGhostElement = () => {
    // Supprimer l'élément fantôme et le gestionnaire d'événements
    if (window.currentGhostEl) {
      document.body.removeChild(window.currentGhostEl);
      window.currentGhostEl = null;
    }

    if (window.ghostMoveHandler) {
      document.removeEventListener('mousemove', window.ghostMoveHandler);
      window.ghostMoveHandler = null;
    }
  };

  const simulateImmediateAppearance = useCallback((taskId, targetDropZone) => {
    // 1. Obtenir la position de la zone de dépôt cible
    const dropZoneIndex = dropZones.findIndex(dz => dz.id === targetDropZone.id);
    const dropZoneRef = dropZoneRefs.current[dropZoneIndex];

    if (!dropZoneRef || !dropZoneRef.current || !ghostElementRef.current) return;

    const dropZoneRect = dropZoneRef.current.getBoundingClientRect();
    const ghostRect = ghostElementRef.current.getBoundingClientRect();

    // 2. Animer le fantôme vers la position finale dans la zone de dépôt
    const ghost = ghostElementRef.current;

    // Position cible dans la zone: centrée horizontalement, près du haut verticalement
    const targetX = dropZoneRect.left + (dropZoneRect.width / 2) - (ghostRect.width / 2);
    const targetY = dropZoneRect.top + 10; // Un peu en dessous du haut de la zone

    // Appliquer une transition fluide vers la position cible
    ghost.style.transition = 'left 0.2s ease, top 0.2s ease, opacity 0.2s ease, transform 0.2s ease';
    ghost.style.left = `${targetX}px`;
    ghost.style.top = `${targetY}px`;
    ghost.style.transform = 'scale(0.9)';

    // 3. Créer visuellement un "placeholder" temporaire dans le TaskBoard
    const placeholderTask = document.createElement('div');
    placeholderTask.className = 'fc-event temporary-task-placeholder';
    placeholderTask.setAttribute('data-task-id', taskId);
    placeholderTask.style.opacity = '0';
    placeholderTask.style.height = `${ghostRect.height}px`;
    placeholderTask.style.margin = '8px 0';
    placeholderTask.style.transition = 'opacity 0.2s ease';
    placeholderTask.innerText = ghostElementRef.current.innerText;

    // Ajouter le placeholder à la zone de dépôt
    dropZoneRef.current.appendChild(placeholderTask);

    // Afficher progressivement le placeholder
    setTimeout(() => {
      placeholderTask.style.opacity = '1';
    }, 50);

    // 4. Supprimer le fantôme et le placeholder une fois que l'état React est mis à jour
    setTimeout(() => {
      // Faire disparaître le fantôme
      ghost.style.opacity = '0';

      // Supprimer complètement le fantôme après l'animation
      setTimeout(() => {
        if (ghostElementRef.current) {
          document.body.removeChild(ghostElementRef.current);
          ghostElementRef.current = null;
        }

        // Le placeholder peut être supprimé maintenant que le TaskBoard a été mis à jour
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


  const handleEventDragStart = useCallback((info) => {

    console.log('Début du glisser-déposer:', info.event.title);

    // Activer la surbrillance du TaskBoard
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


  const isEventOverDropZone = useCallback((eventPosition, dropZoneRefs) => {
    if (!dropZoneRefs?.current) return null;

    // Réinitialiser tous les styles de survol pour toutes les zones
    dropZoneRefs.current.forEach(ref => {
      if (ref?.current) {
        ref.current.classList.remove('active-drop-target');
      }
    });

    for (let index = 0; index < dropZoneRefs.current.length; index++) {
      const ref = dropZoneRefs.current[index];
      if (!ref?.current) continue;

      const dropZoneEl = ref.current;
      const dropZoneRect = dropZoneEl.getBoundingClientRect();

      const isWithinDropZone =
        eventPosition.x >= dropZoneRect.left &&
        eventPosition.x <= dropZoneRect.right &&
        eventPosition.y >= dropZoneRect.top &&
        eventPosition.y <= dropZoneRect.bottom;

      if (isWithinDropZone) {
        // Appliquer un style spécial à la zone de dépôt active
        dropZoneEl.classList.add('active-drop-target');
        return { dropZoneIndex: index, dropZone: dropZones[index] };
      }
    }

    return null;
  }, [dropZones]);


  const prepareEventForTaskBoard = useCallback((event, targetDropZone) => {
    console.log(`Préparation de l'événement "${event.title}" pour la zone "${targetDropZone.title}"`);
    return {
      statusId: targetDropZone.statusId,
      // Ajoutez d'autres modifications si nécessaire
    };
  }, []);


  // Arrêt du glisser-déposer d'un événement
  const handleEventDragStop = useCallback(async (info) => {

    highlightTaskBoard(false);

    if (dropZoneRefs?.current) {
      dropZoneRefs.current.forEach(ref => {
        if (ref?.current) {
          ref.current.classList.remove('dropzone-active');
        }
      });
    }

    // Retirer la classe de surbrillance intense du TaskBoard
  const taskBoardContainer = document.querySelector('.taskboard-container');
  if (taskBoardContainer) {
    taskBoardContainer.classList.remove('taskboard-highlight');
    taskBoardContainer.classList.remove('taskboard-highlight-intense');
  }
  
  // Supprimer le gestionnaire de mouvement de souris pour arrêter les mises à jour de surbrillance
  if (window.ghostMoveHandler) {
    document.removeEventListener('mousemove', window.ghostMoveHandler);
    window.ghostMoveHandler = null;
  }

    if (window.ghostMoveHandler) {
      document.removeEventListener('mousemove', window.ghostMoveHandler);
      window.ghostMoveHandler = null;
    }

    removeGhostElement();
    // Retirer la classe CSS et les styles ajoutés lors du début du glissement
    if (info.el) {
      info.el.classList.remove('dragging-event');

      // Réinitialiser les styles directs
      info.el.style.boxShadow = '';
      info.el.style.border = '';
      info.el.style.backgroundColor = '';

      // Réinitialiser les styles des éléments enfants
      const titleEl = info.el.querySelector('.fc-event-title');
      if (titleEl) {
        titleEl.style.fontStyle = '';
      }
    }

    // Réinitialiser le style des zones de dépôt
    if (dropZoneRefs?.current) {
      dropZoneRefs.current.forEach(ref => {
        if (ref?.current) {
          ref.current.classList.remove('potential-drop-target');
        }
      });
    }
    if (!dropZoneRefs?.current) {
      console.warn('dropZoneRefs.current is undefined');
      return;
    }

    // Utiliser directement la position de la souris sans calculer le rectangle de l'élément
    const eventPosition = {
      x: info.jsEvent.clientX,
      y: info.jsEvent.clientY
    };

    // Vérifier si l'événement est au-dessus d'une zone de dépôt
    const dropTarget = isEventOverDropZone(eventPosition, dropZoneRefs);

    if (dropTarget) {
      const { dropZone } = dropTarget; // Déstructuration de dropZone uniquement
      const taskId = info.event.id;
      const task = tasks.find(t => t.id.toString() === taskId.toString());

      if (!task) {
        console.warn(`Task with id ${taskId} not found`);
        return;
      }

      // PRÉ-TRAITEMENT : Préparer l'événement avant son dépôt final
      const customUpdates = prepareEventForTaskBoard(info.event, dropZone);

      if (info.el) {
        info.el.style.display = 'none';
      }

      info.event.remove();

      simulateImmediateAppearance(taskId, dropZone);

      const updates = {
        resourceId: null,
        statusId: dropZone.statusId,
        extendedProps: {
          statusId: dropZone.statusId,
          // Incorporer les modifications du pré-traitement
          ...customUpdates
        },
        title: task.title
      };

      setTasks(prevTasks => {
        const updatedTasks = prevTasks.map(t => {
          if (t.id.toString() === taskId.toString()) {
            return {
              ...t,
              ...updates,
              extendedProps: {
                ...t.extendedProps,
                ...updates.extendedProps
              }
            };
          }
          return t;
        });

        // Mettre à jour les listes filtrées
        setTimeout(() => {
          const calendar = updatedTasks.filter(task => task.resourceId);
          const board = updatedTasks.filter(task => !task.resourceId);

          setCalendarTasks(calendar);
          setBoardTasks(board);

          // Ajouter une animation à la tâche déposée
          setTimeout(() => {
            // Trouver l'élément de tâche fraîchement déposé dans le DOM
            const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
            if (taskElement) {
              // Ajouter une classe pour l'animation
              taskElement.classList.add('task-added');

              // Retirer la classe après l'animation pour permettre de futures animations
              setTimeout(() => {
                taskElement.classList.remove('task-added');
              }, 800);
            }
          }, 50);
        }, 0);

        return updatedTasks;
      });

      // Indiquer que des changements locaux ont été effectués
      setHasLocalChanges(true);

      // Mettre à jour sur le serveur sans passer par updateTaskStatus
      try {
        // Appel API pour mise à jour
        await updateTask(taskId, updates);

        // Afficher un toast de succès
        toast.success(`Tâche déplacée vers ${dropZone.title}`, TOAST_CONFIG);

        // Réinitialiser le flag de changements locaux
        setHasLocalChanges(false);
      } catch (error) {
        console.error('Erreur lors de la mise à jour de la tâche:', error);
        toast.error(ERROR_MESSAGES.UPDATE_FAILED, TOAST_CONFIG);
      }
    }
  }, [highlightTaskBoard, dropZoneRefs, isEventOverDropZone, tasks, prepareEventForTaskBoard, simulateImmediateAppearance, setTasks, setHasLocalChanges, setCalendarTasks, setBoardTasks]);

  const cleanupAllHighlights = useCallback(() => {
    // Nettoyer la surbrillance du TaskBoard
    const taskBoardContainer = document.querySelector('.taskboard-container');
    if (taskBoardContainer) {
      taskBoardContainer.classList.remove('taskboard-highlight');
      taskBoardContainer.classList.remove('taskboard-highlight-intense');
    }
    
    // Nettoyer les surbrillances des zones de dépôt
    if (dropZoneRefs?.current) {
      dropZoneRefs.current.forEach(ref => {
        if (ref?.current) {
          ref.current.classList.remove('dropzone-active');
          ref.current.classList.remove('potential-drop-target');
        }
      });
    }
  }, [dropZoneRefs]);

  useEffect(() => {
    const handleDragCancel = () => {
      // Si un élément fantôme existe, c'est que le drag est en cours
      if (ghostElementRef.current) {
        // Nettoyer l'élément fantôme
        if (ghostElementRef.current) {
          document.body.removeChild(ghostElementRef.current);
          ghostElementRef.current = null;
        }
        
        // Nettoyer toutes les surbrillances
        cleanupAllHighlights();
        
        // Nettoyer les écouteurs d'événements
        if (window.ghostMoveHandler) {
          document.removeEventListener('mousemove', window.ghostMoveHandler);
          window.ghostMoveHandler = null;
        }
      }
    };
    
    // Ajouter des écouteurs pour les événements qui pourraient annuler le drag
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') handleDragCancel();
    });
    
    document.addEventListener('mouseup', () => {
      // Si le mouseup se produit et que nous avons encore un fantôme, c'est que le drop n'a pas été géré
      setTimeout(() => {
        if (ghostElementRef.current) {
          handleDragCancel();
        }
      }, 100);
    });
    
    return () => {
      // Nettoyer les écouteurs lors du démontage du composant
      document.removeEventListener('keydown', handleDragCancel);
      document.removeEventListener('mouseup', handleDragCancel);
    };
  }, [cleanupAllHighlights]);
 
 
  const taskBoardTransitionCSS = `
  /* Transitions fluides pour les éléments du TaskBoard */
  .fc-event {
    transition: opacity 0.2s ease, transform 0.2s ease;
  }
  
  /* Élément fantôme */
  .task-ghost-element {
    font-weight: normal;
    border: 2px solid rgba(74, 108, 247, 0.7);
    transform-origin: center center;
  }
  
  /* Animation d'apparition dans le TaskBoard */
  .task-added {
    animation: taskAddedAnimation 0.5s ease-in-out;
  }
  
  /* Placeholder temporaire */
  .temporary-task-placeholder {
    background-color: rgba(74, 108, 247, 0.2);
    border: 2px dashed rgba(74, 108, 247, 0.7);
    border-radius: 4px;
    box-shadow: none;
  }
`;



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
    console.log('Event received:', info.event);

    if (info.event.extendedProps.processed) {
      console.log('Événement déjà traité, ignorer');
      return;
    }
    info.event.setExtendedProp('processed', true);
    info.event.remove();

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
    handleEventDragStart,
    handleExternalTaskClick,
    handleEventReceive,
    handleDeleteTask,
    updateTaskStatus
  };
};